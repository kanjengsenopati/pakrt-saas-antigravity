import { prisma } from '../prisma';

export const agendaService = {
  async getAll(tenantId: string, scope?: string, page: number = 1, limit: number = 20) {
    const where: any = { tenant_id: tenantId };
    if (scope) where.scope = scope;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        prisma.agenda.findMany({
            where,
            orderBy: { tanggal: 'desc' },
            take: limit,
            skip
        }),
        prisma.agenda.count({ where })
    ]);

    return { items, total, page, limit };
  },

  async getById(id: string) {
    return await prisma.agenda.findUnique({ where: { id } });
  },

  async create(data: any) {
    return await prisma.agenda.create({ data });
  },

  async update(id: string, data: any) {
    return await prisma.agenda.update({ where: { id }, data });
  },

  async delete(id: string) {
    return await prisma.agenda.delete({ where: { id } });
  }
};
