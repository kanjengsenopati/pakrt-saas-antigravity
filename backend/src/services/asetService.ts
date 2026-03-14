import { prisma } from '../prisma';

export const asetService = {
  async getAll(tenantId: string, scope?: string, page: number = 1, limit: number = 20) {
    const where: any = { tenant_id: tenantId };
    if (scope) where.scope = scope;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        prisma.aset.findMany({
            where,
            include: { peminjam: true },
            orderBy: { nama_barang: 'asc' },
            take: limit,
            skip
        }),
        prisma.aset.count({ where })
    ]);

    return { items, total, page, limit };
  },

  async getById(id: string) {
    return await prisma.aset.findUnique({
      where: { id },
      include: { peminjam: true }
    });
  },

  async create(data: any) {
    return await prisma.aset.create({ data });
  },

  async update(id: string, data: any) {
    return await prisma.aset.update({ where: { id }, data });
  },

  async delete(id: string) {
    return await prisma.aset.delete({ where: { id } });
  }
};
