import { prisma } from '../prisma';
import { dateUtils } from '../utils/date';

export const keuanganService = {
  async getAll(tenantId: string, scope?: string, page: number = 1, limit: number = 20) {
    const where: any = {};
    if (tenantId) where.tenant_id = tenantId;
    if (scope) where.scope = scope;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        prisma.keuangan.findMany({
            where,
            orderBy: { tanggal: 'desc' },
            take: limit,
            skip
        }),
        prisma.keuangan.count({ where })
    ]);

    return { items, total, page, limit };
  },

  async getById(id: string) {
    return await prisma.keuangan.findUnique({ where: { id } });
  },

  async create(data: any) {
    if (data.nominal <= 0) throw new Error("Nominal harus lebih besar dari 0");
    if (data.tanggal) {
        data.tanggal = dateUtils.normalize(data.tanggal);
    }
    if (!data.tanggal) {
        throw new Error("Tanggal tidak valid atau kosong");
    }
    return await prisma.keuangan.create({ data });
  },

  async update(id: string, data: any) {
    if (data.nominal !== undefined && data.nominal <= 0) {
        throw new Error("Nominal harus lebih besar dari 0");
    }
    if (data.tanggal) {
        data.tanggal = dateUtils.normalize(data.tanggal);
        if (!data.tanggal) throw new Error("Format tanggal tidak valid");
    }
    return await prisma.keuangan.update({ where: { id }, data });
  },

  async delete(id: string) {
    return await prisma.keuangan.delete({ where: { id } });
  },

  async getSummary(tenantId: string, scope?: string) {
    const where: any = { tenant_id: tenantId };
    if (scope) where.scope = scope;

    const data = await prisma.keuangan.findMany({ where });
    
    let kasMasuk = 0;
    let kasKeluar = 0;
    
    data.forEach(item => {
      const tipe = item.tipe.toLowerCase();
      if (tipe === 'pemasukan' || tipe === 'masuk') kasMasuk += item.nominal;
      else if (tipe === 'pengeluaran' || tipe === 'keluar') kasKeluar += item.nominal;
    });

    return {
      kasMasuk,
      kasKeluar,
      saldo: kasMasuk - kasKeluar
    };
  }
};
