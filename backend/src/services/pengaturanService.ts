import { prisma } from '../prisma';

export const pengaturanService = {
  async getAll(tenantId: string, scope?: string) {
    const where: any = {};
    if (tenantId) where.tenant_id = tenantId;
    if (scope) where.scope = scope;
    return await prisma.pengaturan.findMany({ where });
  },

  async getById(id: string) {
    return await prisma.pengaturan.findUnique({ where: { id } });
  },

  async create(data: any) {
    return await prisma.pengaturan.create({ data });
  },

  async update(id: string, data: any) {
    return await prisma.pengaturan.update({ where: { id }, data });
  },

  async delete(id: string) {
    return await prisma.pengaturan.delete({ where: { id } });
  }
};
