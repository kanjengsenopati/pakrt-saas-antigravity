import { prisma } from '../prisma';
import { dateUtils } from '../utils/date';
import { aktivitasService } from './aktivitasService';
import { pengaturanService } from './pengaturanService';
import { wargaService } from './wargaService';

async function getWargaIuranRate(wargaId: string, tenantId: string, scope: string = 'RT'): Promise<number> {
  try {
    const warga = await wargaService.getById(wargaId);
    const settings = await pengaturanService.getAll(tenantId, scope);
    
    const config: Record<string, any> = {};
    settings.forEach((p: any) => { config[p.key] = p.value; });

    const statusKey = `${warga?.status_penduduk || 'Tetap'}-${warga?.status_rumah || 'Dihuni'}`;
    const rateField = `iuran_${statusKey.toLowerCase().replace('-', '_')}`;
    const rate = Number(config[rateField] || config.iuran_per_bulan || 0);
    
    if (rate === 0) {
      console.warn(`Warga ${wargaId} has 0 iuran rate. Check settings for ${rateField}`);
    }
    return rate;
  } catch (err) {
    console.error(`Error calculating iuran rate for warga ${wargaId}:`, err);
    throw new Error("Gagal menghitung tarif iuran. Pastikan data warga dan pengaturan iuran sudah benar.");
  }
}

/**
 * Fetch metadata for a specific payment category from the pengaturan jenis_pemasukan config.
 * Returns { tipe, nominal, is_mandatory } or null if not found.
 */
async function getKategoriMetadata(kategori: string, tenantId: string, scope: string = 'RT') {
  try {
    const settings = await pengaturanService.getAll(tenantId, scope);
    const config: Record<string, any> = {};
    settings.forEach((p: any) => { config[p.key] = p.value; });

    if (!config.jenis_pemasukan) return null;
    const jenisList: any[] = JSON.parse(config.jenis_pemasukan);
    const match = jenisList.find((j: any) =>
      j.nama?.trim().toLowerCase() === kategori?.trim().toLowerCase()
    );
    return match ? { tipe: match.tipe || 'BULANAN', nominal: Number(match.nominal) || 0, is_mandatory: !!match.is_mandatory } : null;
  } catch {
    return null;
  }
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Builds a human-readable keterangan for keuangan entries.
 * Format: "[Nama Warga] Kategori — Bulan1, Bulan2/Tahun | ref:id"
 */
function buildKeterangan(wargaNama: string, kategori: string, periodeBulan: number[], periodeTahun: number, refId: string): string {
  const monthNames = periodeBulan
    .map(m => MONTH_NAMES_ID[m - 1] || String(m))
    .join(', ');
  return `[${wargaNama}] ${kategori} — ${monthNames} ${periodeTahun} | ref:${refId}`;
}

export const pembayaranIuranService = {
  async getAll(tenantId: string, scope?: string, wargaId?: string, page: number = 1, limit: number = 20) {
    const where: any = {};
    if (tenantId) where.tenant_id = tenantId;
    if (scope) where.scope = scope;
    if (wargaId) where.warga_id = wargaId;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        prisma.pembayaranIuran.findMany({
            where,
            include: { warga: true },
            orderBy: { tanggal_bayar: 'desc' },
            take: limit,
            skip
        }),
        prisma.pembayaranIuran.count({ where })
    ]);

    return { items, total, page, limit };
  },

  async getById(id: string) {
    return await prisma.pembayaranIuran.findUnique({
      where: { id },
      include: {
        warga: true
      }
    });
  },

  async create(data: any) {
    if (data.tanggal_bayar) data.tanggal_bayar = dateUtils.normalize(data.tanggal_bayar);
    const isBebas = data.metadata?.mode === 'Bebas';
    const metadataMode = data.metadata?.mode;
    let processedData = { ...data };
    
    delete processedData.metadata;

    // Determine rate: for INSIDENTIL use kategori's configured nominal, not tiered warga rate
    const kategoriMeta = await getKategoriMetadata(data.kategori, data.tenant_id, data.scope);
    const isInsidentil = kategoriMeta?.tipe === 'INSIDENTIL';

    if (isInsidentil && kategoriMeta?.nominal > 0) {
      // INSIDENTIL: always use the configured event nominal, ignore warga status tiers
      processedData.nominal = kategoriMeta.nominal;
    } else if (isBebas && data.nominal > 0) {
      const rate = await getWargaIuranRate(data.warga_id, data.tenant_id, data.scope);
      if (rate > 0) {
        const totalMonthsCovered = data.nominal / rate;
        const startMonth = data.periode_bulan[0] || 1;
        const months: number[] = [];
        for (let i = 0; i < Math.ceil(totalMonthsCovered); i++) {
          let m = startMonth + i;
          if (m > 12) break;
          months.push(m);
        }
        if (months.length > 0) processedData.periode_bulan = months;
      }
    } else if (!isBebas && !isInsidentil) {
      const rate = await getWargaIuranRate(data.warga_id, data.tenant_id, data.scope);
      if (rate > 0 && Array.isArray(processedData.periode_bulan)) {
        processedData.nominal = rate * processedData.periode_bulan.length;
      }
    }

    try {
        return await prisma.$transaction(async (tx) => {
            // CONCURRENCY CHECK: Prevent double payment for same period
            // Only check against PENDING or VERIFIED payments. REJECTED ones are ignored.
            const existing = await tx.pembayaranIuran.findMany({
                where: {
                    warga_id: processedData.warga_id,
                    kategori: processedData.kategori,
                    periode_tahun: processedData.periode_tahun,
                    status: { in: ['PENDING', 'VERIFIED'] }
                }
            });

            console.log("DEBUG - Incoming processedData:", JSON.stringify(processedData, null, 2));
            const monthsToPay = Array.isArray(processedData.periode_bulan) ? processedData.periode_bulan : [];
            const alreadyPaidMonths = existing.flatMap(e => (e as any).periode_bulan || []);
            const overlappingMonths = monthsToPay.filter((m: number) => alreadyPaidMonths.includes(m));

            if (overlappingMonths.length > 0) {
                throw new Error(`Bulan ${overlappingMonths.join(', ')} sudah dalam proses pembayaran atau sudah lunas untuk tahun ${processedData.periode_tahun}`);
            }

            // Sanitize: only pass fields known to the PembayaranIuran model
            const { _autoVerify } = processedData;
            const status = _autoVerify ? 'VERIFIED' : 'PENDING';

            const sanitizedData = {
                tenant_id: processedData.tenant_id,
                scope:     processedData.scope || 'RT',
                warga_id:  processedData.warga_id,
                kategori:  processedData.kategori,
                periode_bulan: monthsToPay,
                periode_tahun: Number(processedData.periode_tahun),
                nominal:       Number(processedData.nominal),
                tanggal_bayar: processedData.tanggal_bayar,
                url_bukti:     processedData.url_bukti || null,
                alasan_penolakan: processedData.alasan_penolakan || null,
                status
            };

            console.log("DEBUG - Sanitized createData:", JSON.stringify(sanitizedData, null, 2));

            const result = await tx.pembayaranIuran.create({ 
                data: sanitizedData
            });
            
            const wargaRecord = await tx.warga.findUnique({ where: { id: processedData.warga_id } });
            const wargaNama = wargaRecord?.nama || 'Warga';

            if (_autoVerify) {
                console.log("DEBUG - Creating keuangan entry for:", result.id);
                try {
                    await tx.keuangan.create({
                        data: {
                            tenant_id: result.tenant_id,
                            scope: result.scope || 'RT',
                            tipe: 'pemasukan',
                            kategori: 'Iuran Warga',
                            nominal: result.nominal,
                            tanggal: result.tanggal_bayar,
                            pembayaranIuranId: result.id,
                            keterangan: buildKeterangan(
                                wargaNama,
                                result.kategori,
                                Array.isArray(result.periode_bulan) ? result.periode_bulan : [],
                                result.periode_tahun,
                                result.id
                            )
                        }
                    });
                } catch (kErr) {
                    console.error("DEBUG - Failed to create Keuangan entry:", kErr);
                    throw kErr;
                }

                try {
                    await aktivitasService.create({
                        tenant_id: processedData.tenant_id,
                        scope: processedData.scope || 'RT',
                        action: 'Bayar Iuran',
                        details: `Pembayaran iuran tunai oleh **${wargaNama}**: ${processedData.kategori} [${metadataMode || 'Manual'}] - Terverifikasi`,
                        timestamp: Date.now()
                    });
                } catch (aErr) {
                    console.warn("DEBUG - Optional Aktivitas log failed:", aErr);
                }
            } else {
                try {
                    await aktivitasService.create({
                        tenant_id: processedData.tenant_id,
                        scope: processedData.scope || 'RT',
                        action: 'Bayar Iuran',
                        details: `Pembayaran iuran oleh **${wargaNama}**: ${processedData.kategori} [${metadataMode || 'Manual'}] - Menunggu Verifikasi`,
                        timestamp: Date.now()
                    });
                } catch (aErr) {
                    console.warn("DEBUG - Optional Aktivitas log failed:", aErr);
                }
            }

            return result;
        });
    } catch (error) {
        console.error("DEBUG - Error in pembayaranIuranService.create:", error);
        throw error;
    }
  },

  async verify(id: string, action: 'VERIFY' | 'REJECT', alasan?: string) {
    return await prisma.$transaction(async (tx) => {
        const iuran = await tx.pembayaranIuran.findUnique({
            where: { id },
            include: { warga: true }
        });

        if (!iuran) throw new Error("Data iuran tidak ditemukan");
        if (iuran.status !== 'PENDING') throw new Error(`Status iuran sudah ${iuran.status}`);

        if (action === 'VERIFY') {
            const result = await tx.pembayaranIuran.update({
                where: { id },
                data: { status: 'VERIFIED' }
            });

            // Sync to Keuangan ONLY now
            await tx.keuangan.create({
                data: {
                    tenant_id: result.tenant_id,
                    scope: result.scope || 'RT',
                    tipe: 'pemasukan',
                    kategori: 'Iuran Warga',
                    nominal: result.nominal,
                    tanggal: result.tanggal_bayar,
                    pembayaranIuranId: result.id, // CRITICAL FIX: Link to iuran record
                    keterangan: buildKeterangan(
                        (iuran?.warga?.nama || (result as any).warga?.nama) || 'Warga',
                        result.kategori,
                        result.periode_bulan as number[],
                        result.periode_tahun,
                        result.id
                    )
                }
            });

            const wargaNama = iuran?.warga?.nama || 'Warga';

            await aktivitasService.create({
                tenant_id: result.tenant_id,
                scope: result.scope || 'RT',
                action: 'Verifikasi Iuran',
                details: `Verifikasi pembayaran iuran oleh **${wargaNama}** [DITERIMA]`,
                timestamp: Date.now()
            });

            return result;
        } else {
            const result = await tx.pembayaranIuran.update({
                where: { id },
                data: { 
                    status: 'REJECTED',
                    alasan_penolakan: alasan
                }
            });

            const wargaNama = iuran?.warga?.nama || 'Warga';

            await aktivitasService.create({
                tenant_id: result.tenant_id,
                scope: result.scope || 'RT',
                action: 'Verifikasi Iuran',
                details: `Verifikasi pembayaran iuran oleh **${wargaNama}** [DITOLAK]: ${alasan}`,
                timestamp: Date.now()
            });

            return result;
        }
    });
  },

  async update(id: string, data: any) {
    const isBebas = data.metadata?.mode === 'Bebas';
    const metadataMode = data.metadata?.mode;
    const processedData = { ...data };
    
    delete processedData.metadata;

    const existingRecord = await this.getById(id);
    if (!existingRecord) throw new Error("Record not found");

    const targetWargaId = processedData.warga_id || existingRecord.warga_id;
    const targetTenantId = processedData.tenant_id || existingRecord.tenant_id;
    const targetScope = processedData.scope || existingRecord.scope;
    const targetPeriodeBulan = processedData.periode_bulan || existingRecord.periode_bulan;

    if (!isBebas && metadataMode === 'Pas') {
      const rate = await getWargaIuranRate(targetWargaId, targetTenantId, targetScope);
      if (rate > 0 && Array.isArray(targetPeriodeBulan)) {
        processedData.nominal = rate * targetPeriodeBulan.length;
      }
    } else if (isBebas && processedData.nominal > 0) {
      const rate = await getWargaIuranRate(targetWargaId, targetTenantId, targetScope);
      if (rate > 0) {
        const totalMonthsCovered = processedData.nominal / rate;
        const startMonth = targetPeriodeBulan[0] || 1;
        const months: number[] = [];
        for (let i = 0; i < Math.ceil(totalMonthsCovered); i++) {
          let m = startMonth + i;
          if (m > 12) break;
          months.push(m);
        }
        if (months.length > 0) processedData.periode_bulan = months;
      }
    }

    if (processedData.warga_id !== undefined) {
       processedData.warga = { connect: { id: processedData.warga_id } };
       delete processedData.warga_id;
    }

    return await prisma.$transaction(async (tx) => {
        // If not specified, reset status to PENDING on update to require re-verification
        // Unless it's already VERIFIED, we might want to keep it VERIFIED if it's an admin edit?
        // But the safest is to re-verify if data changes.
        if (!processedData.status) {
            processedData.status = 'PENDING';
        }

        const result = await tx.pembayaranIuran.update({ 
            where: { id }, 
            data: processedData,
            include: { warga: true }
        });

        // Sync to Keuangan: Find existing record by relation ID
        const existingKeuangan = await tx.keuangan.findUnique({
            where: { pembayaranIuranId: id }
        });

        if (existingKeuangan) {
            if (result.status === 'VERIFIED') {
                await tx.keuangan.update({
                    where: { id: existingKeuangan.id },
                    data: {
                        nominal: result.nominal,
                        tanggal: result.tanggal_bayar,
                        keterangan: buildKeterangan(
                            (result as any).warga?.nama || 'Warga',
                            result.kategori,
                            result.periode_bulan as number[],
                            result.periode_tahun,
                            result.id
                        )
                    }
                });
            } else {
                // If it was VERIFIED but now PENDING/REJECTED, "Rollback" Keuangan by deleting the entry
                await tx.keuangan.delete({ where: { id: existingKeuangan.id } });
            }
        } else if (result.status === 'VERIFIED') {
            // If it became VERIFIED during update but no Keuangan entry existed
            await tx.keuangan.create({
                data: {
                    tenant_id: result.tenant_id,
                    scope: result.scope || 'RT',
                    tipe: 'pemasukan',
                    kategori: result.kategori,
                    nominal: result.nominal,
                    tanggal: result.tanggal_bayar,
                    pembayaranIuranId: result.id,
                    keterangan: buildKeterangan(
                        (result as any).warga?.nama || 'Warga',
                        result.kategori,
                        result.periode_bulan as number[],
                        result.periode_tahun,
                        result.id
                    )
                }
            });
        }

        await aktivitasService.create({
            tenant_id: result.tenant_id,
            scope: 'RT',
            action: 'Edit Iuran',
            details: `Mengubah data pembayaran iuran oleh **${(result as any).warga?.nama || 'Warga'}**: ${result.kategori} [${metadataMode || 'Manual'}]`,
            timestamp: Date.now()
        });
        return result;
    });
  },

  async delete(id: string) {
    return await prisma.$transaction(async (tx) => {
        const iuranToDelete = await tx.pembayaranIuran.findUnique({
            where: { id },
            include: { warga: true }
        });
        const wargaNama = iuranToDelete?.warga?.nama || 'Warga';

        const result = await tx.pembayaranIuran.delete({ where: { id } });
        
        // Sync to Keuangan: Delete existing record by relation ID
        await tx.keuangan.deleteMany({
            where: { pembayaranIuranId: id }
        });

        await aktivitasService.create({
            tenant_id: result.tenant_id,
            scope: 'RT',
            action: 'Batal Iuran',
            details: `Membatalkan/Menghapus pembayaran iuran oleh **${wargaNama}**: ${result.kategori}`,
            timestamp: Date.now()
        });
        return result;
    });
  },

  async resubmit(id: string, updateData?: { url_bukti?: string }) {
    return await prisma.$transaction(async (tx) => {
        const iuran = await tx.pembayaranIuran.findUnique({ 
            where: { id },
            include: { warga: true }
        });

        if (!iuran) throw new Error('Data iuran tidak ditemukan');
        const wargaNama = iuran?.warga?.nama || 'Warga';
        if (iuran.status !== 'REJECTED') throw new Error('Hanya pembayaran yang ditolak yang dapat diajukan ulang');

        const result = await tx.pembayaranIuran.update({
            where: { id },
            data: {
                status: 'PENDING',
                alasan_penolakan: null, // Clear old rejection reason
                ...(updateData?.url_bukti ? { url_bukti: updateData.url_bukti } : {}),
            }
        });

        await aktivitasService.create({
            tenant_id: result.tenant_id,
            scope: result.scope || 'RT',
            action: 'Ajukan Ulang Iuran',
            details: `Warga (**${wargaNama}**) mengajukan ulang pembayaran iuran yang ditolak: ${result.kategori}`,
            timestamp: Date.now()
        });

        return result;
    });
  },

  async getBillingSummary(tenantId: string, wargaId: string, tahun: number, kategori?: string, scope: string = 'RT') {
    // Determine if this category is INSIDENTIL (no 12-month obligation)
    const kategoriMeta = kategori ? await getKategoriMetadata(kategori, tenantId, scope) : null;
    const isInsidentil = kategoriMeta?.tipe === 'INSIDENTIL';

    // For BULANAN: use warga tiered rate. For INSIDENTIL: use configured event nominal.
    const rate = isInsidentil
      ? (kategoriMeta?.nominal || 0)
      : await getWargaIuranRate(wargaId, tenantId, scope);
    
    // Normalize target category
    const targetKat = kategori?.trim().replace(/\s+/g, ' ').toLowerCase();

    const allPayments = await prisma.pembayaranIuran.findMany({
      where: {
        tenant_id: tenantId,
        warga_id: wargaId,
        periode_tahun: tahun,
        status: { in: ['VERIFIED', 'PENDING'] }
      }
    });

    // EXACT category match — no more heuristic 'includes iuran' fallback
    const verifiedPayments = allPayments.filter(p => {
      if (p.status !== 'VERIFIED') return false;
      if (!targetKat) return true;
      return p.kategori.trim().replace(/\s+/g, ' ').toLowerCase() === targetKat;
    });

    const pendingPayments = allPayments.filter(p => {
      if (p.status !== 'PENDING') return false;
      if (!targetKat) return true;
      return p.kategori.trim().replace(/\s+/g, ' ').toLowerCase() === targetKat;
    });

    const totalPaid = verifiedPayments.reduce((sum, curr) => sum + curr.nominal, 0);
    const pendingAmount = pendingPayments.reduce((sum, curr) => sum + curr.nominal, 0);
    // INSIDENTIL has no 12-month obligation — expectedTotal is per-event nominal only
    const expectedTotal = isInsidentil ? rate : rate * 12;
    
    const paidMonths = [...new Set(verifiedPayments.flatMap(e => e.periode_bulan))].sort((a, b) => a - b);
    const pendingMonths = [...new Set(pendingPayments.flatMap(e => e.periode_bulan))].sort((a, b) => a - b);

    return {
      rate,
      expectedTotal,
      totalPaid,
      pendingAmount,
      paidMonths,
      pendingMonths,
      sisa: Math.max(0, expectedTotal - totalPaid - pendingAmount),
      isInsidentil
    };
  },

  async getPendingCount(tenantId: string, scope?: string) {
    const where: any = { 
        tenant_id: tenantId,
        status: 'PENDING'
    };
    if (scope) where.scope = scope;
    
    return await prisma.pembayaranIuran.count({ where });
  },

  async exportToXlsx(tenantId: string, scope?: string) {
    const where: any = { tenant_id: tenantId };
    if (scope) where.scope = scope;

    const items = await prisma.pembayaranIuran.findMany({
      where,
      include: { warga: true },
      orderBy: { tanggal_bayar: 'desc' }
    });

    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Data Iuran');

    const headers = [
      'Tanggal Bayar', 'Nama Warga', 'NIK', 'Kategori', 'Periode', 'Nominal', 'Status', 'Keterangan'
    ];

    sheet.addRow(headers);
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    items.forEach((item) => {
      const periode = Array.isArray(item.periode_bulan) 
        ? `${item.periode_bulan.map(m => MONTH_NAMES_ID[m-1]).join(', ')} ${item.periode_tahun}`
        : `${item.periode_tahun}`;

      sheet.addRow([
        item.tanggal_bayar,
        item.warga?.nama || '-',
        item.warga?.nik || '-',
        item.kategori,
        periode,
        item.nominal,
        item.status,
        item.alasan_penolakan || '-'
      ]);
    });

    sheet.columns.forEach(col => col.width = 20);
    // Specific widths
    sheet.getColumn(2).width = 30; // Nama
    sheet.getColumn(5).width = 40; // Periode
    sheet.getColumn(8).width = 40; // Keterangan/Alasan

    return await workbook.xlsx.writeBuffer();
  }
};
