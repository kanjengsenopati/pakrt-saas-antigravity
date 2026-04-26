import { prisma } from '../prisma';
// Trigger reload after schema update

export const aktivitasService = {
  async getAll(tenantId: string, scope?: string, page: number = 1, limit: number = 20) {
    const where: any = { tenant_id: tenantId };
    if (scope) where.scope = scope;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        prisma.aktivitas.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: limit,
            skip
        }),
        prisma.aktivitas.count({ where })
    ]);

    return { items, total, page, limit };
  },

  async getById(id: string) {
    return await prisma.aktivitas.findUnique({ where: { id } });
  },

  async create(data: any) {
    return await prisma.aktivitas.create({ data });
  },

  async update(id: string, data: any) {
    return await prisma.aktivitas.update({ where: { id }, data });
  },

  async delete(id: string) {
    return await prisma.aktivitas.delete({ where: { id } });
  }
};
