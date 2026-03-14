import { prisma } from '../prisma';

export const kehadiranService = {
  async getAll(tenantId: string, scope?: string, notulensi_id?: string) {
    const where: any = {};
    if (tenantId) where.tenant_id = tenantId;
    if (scope) where.scope = scope;
    if (notulensi_id) where.notulensi_id = notulensi_id;
    return await prisma.kehadiran.findMany({ 
      where,
      include: {
        warga: true
      }
    });
  },

  async getById(id: string) {
    return await prisma.kehadiran.findUnique({ where: { id } });
  },

  async create(data: any) {
    return await prisma.kehadiran.create({ data });
  },

  async update(id: string, data: any) {
    return await prisma.kehadiran.update({ where: { id }, data });
  },

  async syncForNotulensi(tenantId: string, notulensiId: string, data: { warga_id: string, status: string }[]) {
    return await prisma.$transaction(async (tx) => {
      // 1. Delete existing records for this notulensi
      await tx.kehadiran.deleteMany({
        where: { notulensi_id: notulensiId }
      });

      // 2. Create new records
      if (data.length > 0) {
        return await tx.kehadiran.createMany({
          data: data.map(item => ({
            ...item,
            tenant_id: tenantId,
            notulensi_id: notulensiId
          }))
        });
      }
      return { count: 0 };
    });
  },

  async delete(id: string) {
    return await prisma.kehadiran.delete({ where: { id } });
  }
};
