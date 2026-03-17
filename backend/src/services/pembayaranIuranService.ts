import { prisma } from '../prisma';
import { dateUtils } from '../utils/date';
import { aktivitasService } from './aktivitasService';
import { pengaturanService } from './pengaturanService';
import { wargaService } from './wargaService';

async function getWargaIuranRate(wargaId: string, tenantId: string, scope: string = 'RT'): Promise<number> {
  const warga = await wargaService.getById(wargaId);
  const settings = await pengaturanService.getAll(tenantId, scope);
  
  const config: Record<string, any> = {};
  settings.forEach((p: any) => { config[p.key] = p.value; });

  const statusKey = `${warga?.status_penduduk || 'Tetap'}-${warga?.status_rumah || 'Dihuni'}`;
  const rateField = `iuran_${statusKey.toLowerCase().replace('-', '_')}`;
  return Number(config[rateField] || config.iuran_per_bulan || 0);
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

    if (isBebas && data.nominal > 0) {
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
    } else if (!isBebas) {
      const rate = await getWargaIuranRate(data.warga_id, data.tenant_id, data.scope);
      if (rate > 0 && Array.isArray(processedData.periode_bulan)) {
        processedData.nominal = rate * processedData.periode_bulan.length;
      }
    }

    return await prisma.$transaction(async (tx) => {
        // CONCURRENCY CHECK: Prevent double payment for same period
        const existing = await tx.pembayaranIuran.findMany({
            where: {
                warga_id: processedData.warga_id,
                kategori: processedData.kategori,
                periode_tahun: processedData.periode_tahun
            }
        });

        const alreadyPaidMonths = existing.flatMap(e => e.periode_bulan);
        const overlappingMonths = processedData.periode_bulan.filter((m: number) => alreadyPaidMonths.includes(m));

        if (overlappingMonths.length > 0) {
            throw new Error(`Bulan ${overlappingMonths.join(', ')} sudah dibayar untuk tahun ${processedData.periode_tahun}`);
        }

        const result = await tx.pembayaranIuran.create({ data: processedData });
        
        // Sync to Keuangan
        await tx.keuangan.create({
            data: {
                tenant_id: result.tenant_id,
                scope: result.scope || 'RT',
                tipe: 'pemasukan',
                kategori: 'Iuran Warga',
                nominal: result.nominal,
                tanggal: result.tanggal_bayar,
                keterangan: `[IURAN_ID:${result.id}] Pembayaran ${result.kategori} - ${result.periode_bulan.join(',')}/${result.periode_tahun}`
            }
        });

        await aktivitasService.create({
            tenant_id: processedData.tenant_id,
            scope: processedData.scope || 'RT',
            action: 'Bayar Iuran',
            details: `Pembayaran iuran dari warga (ID: ${processedData.warga_id}): ${processedData.kategori} [${metadataMode || 'Manual'}]`,
            timestamp: Date.now()
        });
        return result;
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
        const result = await tx.pembayaranIuran.update({ 
            where: { id }, 
            data: processedData 
        });

        // Sync to Keuangan: Find existing record by tag
        const tag = `[IURAN_ID:${id}]`;
        const existingKeuangan = await tx.keuangan.findFirst({
            where: { keterangan: { contains: tag } }
        });

        if (existingKeuangan) {
            await tx.keuangan.update({
                where: { id: existingKeuangan.id },
                data: {
                    nominal: result.nominal,
                    tanggal: result.tanggal_bayar,
                    keterangan: `${tag} Pembayaran ${result.kategori} - ${result.periode_bulan.join(',')}/${result.periode_tahun}`
                }
            });
        }

        await aktivitasService.create({
            tenant_id: result.tenant_id,
            scope: 'RT',
            action: 'Edit Iuran',
            details: `Mengubah data pembayaran iuran: ${result.kategori} [${metadataMode || 'Manual'}]`,
            timestamp: Date.now()
        });
        return result;
    });
  },

  async delete(id: string) {
    return await prisma.$transaction(async (tx) => {
        const result = await tx.pembayaranIuran.delete({ where: { id } });
        
        // Sync to Keuangan: Delete existing record by tag
        const tag = `[IURAN_ID:${id}]`;
        await tx.keuangan.deleteMany({
            where: { keterangan: { contains: tag } }
        });

        await aktivitasService.create({
            tenant_id: result.tenant_id,
            scope: 'RT',
            action: 'Batal Iuran',
            details: `Membatalkan/Menghapus pembayaran iuran: ${result.kategori}`,
            timestamp: Date.now()
        });
        return result;
    });
  },

  async getBillingSummary(tenantId: string, wargaId: string, tahun: number, kategori: string = 'Iuran Warga', scope: string = 'RT') {
    const rate = await getWargaIuranRate(wargaId, tenantId, scope);
    
    const existing = await prisma.pembayaranIuran.findMany({
      where: {
        tenant_id: tenantId,
        warga_id: wargaId,
        kategori: kategori,
        periode_tahun: tahun
      }
    });

    const totalPaid = existing.reduce((sum, curr) => sum + curr.nominal, 0);
    const expectedTotal = rate * 12;
    const paidMonths = existing.flatMap(e => e.periode_bulan);

    return {
      rate,
      expectedTotal,
      totalPaid,
      paidMonths,
      sisa: Math.max(0, expectedTotal - totalPaid)
    };
  }
};
