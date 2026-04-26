import { prisma } from '../prisma';
import { dateUtils } from '../utils/date';
import { aktivitasService } from './aktivitasService';
import { pengaturanService } from './pengaturanService';
import { wargaService } from './wargaService';
import { IuranCalculator } from '../utils/IuranCalculator';

/**
 * Validates and synchronizes iuran payments with the Keuangan (financial) ledger.
 * This centralizes the logic for creating/updating/deleting financial records.
 */
async function syncToKeuangan(tx: any, iuran: any, wargaNama: string, action: 'CREATE' | 'UPDATE' | 'DELETE') {
  const existingKeuangan = await tx.keuangan.findUnique({
    where: { pembayaranIuranId: iuran.id }
  });

  if (action === 'DELETE') {
    if (existingKeuangan) {
      await tx.keuangan.delete({ where: { id: existingKeuangan.id } });
    }
    return;
  }

  if (iuran.status !== 'VERIFIED') {
    // If it was VERIFIED but now PENDING/REJECTED, "Rollback" Keuangan
    if (existingKeuangan) {
      await tx.keuangan.delete({ where: { id: existingKeuangan.id } });
    }
    return;
  }

  const payload = {
    tenant_id: iuran.tenant_id,
    scope: iuran.scope || 'RT',
    tipe: 'pemasukan',
    kategori: iuran.kategori === 'Iuran Warga' ? iuran.kategori : 'Iuran Warga',
    nominal: iuran.nominal,
    tanggal: iuran.tanggal_bayar,
    pembayaranIuranId: iuran.id,
    keterangan: buildKeterangan(
      wargaNama,
      iuran.kategori,
      Array.isArray(iuran.periode_bulan) ? iuran.periode_bulan : [],
      iuran.periode_tahun,
      iuran.id
    )
  };

  if (existingKeuangan) {
    await tx.keuangan.update({
      where: { id: existingKeuangan.id },
      data: payload
    });
  } else {
    await tx.keuangan.create({ data: payload });
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
    const metadataMode = data.metadata?.mode;
    const processedData = { ...data };
    
    delete processedData.metadata;

    // Delegate calculation logic to IuranCalculator
    const details = await IuranCalculator.calculatePaymentDetails(data);
    processedData.nominal = details.nominal;
    processedData.periode_bulan = details.periode_bulan;

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
                    await syncToKeuangan(tx, result, wargaNama, 'CREATE');
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
                        target_url: '/iuran',
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
                        target_url: '/iuran',
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
            await syncToKeuangan(tx, result, iuran?.warga?.nama || 'Warga', 'CREATE');

            const wargaNama = iuran?.warga?.nama || 'Warga';

            await aktivitasService.create({
                tenant_id: result.tenant_id,
                scope: result.scope || 'RT',
                action: 'Verifikasi Iuran',
                details: `Verifikasi pembayaran iuran oleh **${wargaNama}** [DITERIMA]`,
                target_url: '/iuran',
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
                target_url: '/iuran',
                timestamp: Date.now()
            });

            return result;
        }
    });
  },

  async update(id: string, data: any) {
    const metadataMode = data.metadata?.mode;
    const processedData = { ...data };
    
    delete processedData.metadata;

    const existingRecord = await this.getById(id);
    if (!existingRecord) throw new Error("Record not found");

    // Merge data for calculator
    const calcData = {
      ...existingRecord,
      ...data,
      metadata: data.metadata || { mode: metadataMode }
    };

    const details = await IuranCalculator.calculatePaymentDetails(calcData);
    processedData.nominal = details.nominal;
    processedData.periode_bulan = details.periode_bulan;

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

        // Sync to Keuangan using central helper
        await syncToKeuangan(tx, result, (result as any).warga?.nama || 'Warga', 'UPDATE');

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
        
        await syncToKeuangan(tx, result, wargaNama, 'DELETE');

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

  async createBatch(items: any[], commonData: { tenant_id: string; scope: string; tanggal_bayar: string; url_bukti?: string }) {
    return await prisma.$transaction(async (tx) => {
        const results = [];
        for (const item of items) {
            const processedData = { 
                ...item, 
                ...commonData,
                tanggal_bayar: dateUtils.normalize(commonData.tanggal_bayar)
            };
            
            delete processedData.metadata;

            // Delegate calculation logic
            const details = await IuranCalculator.calculatePaymentDetails({
                ...item,
                ...commonData
            });
            processedData.nominal = details.nominal;
            processedData.periode_bulan = details.periode_bulan;

            const { _autoVerify } = processedData;
            const status = _autoVerify ? 'VERIFIED' : 'PENDING';

            const sanitizedData = {
                tenant_id: processedData.tenant_id,
                scope:     processedData.scope || 'RT',
                warga_id:  processedData.warga_id,
                kategori:  processedData.kategori,
                periode_bulan: Array.isArray(processedData.periode_bulan) ? processedData.periode_bulan : [],
                periode_tahun: Number(processedData.periode_tahun),
                nominal:       Number(processedData.nominal),
                tanggal_bayar: processedData.tanggal_bayar,
                url_bukti:     processedData.url_bukti || null,
                status
            };

            const result = await tx.pembayaranIuran.create({ data: sanitizedData });
            results.push(result);
            
            const wargaRecord = await tx.warga.findUnique({ where: { id: processedData.warga_id } });
            const wargaNama = wargaRecord?.nama || 'Warga';

            if (status === 'VERIFIED') {
                await syncToKeuangan(tx, result, wargaNama, 'CREATE');
            }

            await aktivitasService.create({
                tenant_id: processedData.tenant_id,
                scope: processedData.scope || 'RT',
                action: 'Bayar Iuran (Batch)',
                details: `Bayar iuran **${wargaNama}**: ${processedData.kategori} - ${status}`,
                timestamp: Date.now()
            });
        }
        return results;
    });
  },

  async getBillingSummary(tenantId: string, wargaId: string, tahun: number, kategori?: string, scope: string = 'RT') {
    const settings = await pengaturanService.getAll(tenantId, scope);
    const config: Record<string, any> = {};
    settings.forEach((p: any) => { config[p.key] = p.value; });

    let jenisList: any[] = [];
    try {
        jenisList = config.jenis_pemasukan ? JSON.parse(config.jenis_pemasukan) : [];
    } catch {
        jenisList = [];
    }

    const allPayments = await prisma.pembayaranIuran.findMany({
      where: {
        tenant_id: tenantId,
        warga_id: wargaId,
        periode_tahun: tahun,
        status: { in: ['VERIFIED', 'PENDING'] }
      }
    });

    if (kategori === 'SEMUA') {
        // Return a multi-category manifest
        const manifest: any[] = [];
        for (const j of jenisList) {
            const isInsidentil = j.tipe === 'INSIDENTIL';
            const rate = isInsidentil 
                ? (Number(j.nominal) || 0) 
                : await IuranCalculator.getWargaIuranRate(wargaId, tenantId, scope);
            
            const targetKat = j.nama.trim().replace(/\s+/g, ' ').toLowerCase();
            const verified = allPayments.filter(p => p.status === 'VERIFIED' && p.kategori.trim().replace(/\s+/g, ' ').toLowerCase() === targetKat);
            const pending = allPayments.filter(p => p.status === 'PENDING' && p.kategori.trim().replace(/\s+/g, ' ').toLowerCase() === targetKat);
            
            const totalPaid = verified.reduce((sum, curr) => sum + curr.nominal, 0);
            const pendingAmount = pending.reduce((sum, curr) => sum + curr.nominal, 0);
            const expectedTotal = isInsidentil ? rate : rate * 12;

            manifest.push({
                nama: j.nama,
                tipe: j.tipe,
                is_mandatory: !!j.is_mandatory,
                rate,
                expectedTotal,
                totalPaid,
                pendingAmount,
                paidMonths: [...new Set(verified.flatMap(e => e.periode_bulan))].sort((a, b) => a - b),
                pendingMonths: [...new Set(pending.flatMap(e => e.periode_bulan))].sort((a, b) => a - b),
                sisa: Math.max(0, expectedTotal - totalPaid - pendingAmount)
            });
        }
        return { type: 'MANIFEST', items: manifest };
    }

    // Default: Existing logic for single category
    const kategoriMeta = kategori ? await IuranCalculator.getKategoriMetadata(kategori, tenantId, scope) : null;
    const isInsidentil = kategoriMeta?.tipe === 'INSIDENTIL';
    const rate = isInsidentil
      ? (kategoriMeta?.nominal || 0)
      : await IuranCalculator.getWargaIuranRate(wargaId, tenantId, scope);
    
    const targetKat = kategori?.trim().replace(/\s+/g, ' ').toLowerCase();

    const verifiedPayments = allPayments.filter(p => {
      if (p.status !== 'VERIFIED') return false;
      if (!targetKat) return true;
      return (p.kategori || '').trim().replace(/\s+/g, ' ').toLowerCase() === targetKat;
    });

    const pendingPayments = allPayments.filter(p => {
      if (p.status !== 'PENDING') return false;
      if (!targetKat) return true;
      return (p.kategori || '').trim().replace(/\s+/g, ' ').toLowerCase() === targetKat;
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
