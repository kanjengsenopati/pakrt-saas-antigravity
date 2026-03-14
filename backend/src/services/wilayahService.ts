import { prisma } from '../prisma';

export const wilayahService = {
  async getAll(tenantId?: string, level?: string, parentId?: string) {
    const where: any = {};
    if (tenantId) where.tenant_id = tenantId;
    if (level) where.level = level;
    if (parentId) where.parent_id = parentId;
    return await prisma.wilayah.findMany({
      where,
      orderBy: { name: 'asc' }
    });
  },

  async getById(id: string) {
    return await prisma.wilayah.findUnique({ where: { id } });
  },

  async create(data: any) {
    return await prisma.wilayah.create({ data });
  },

  async update(id: string, data: any) {
    return await prisma.wilayah.update({ where: { id }, data });
  },

  async createMany(data: any[]) {
    return await prisma.wilayah.createMany({
      data,
      skipDuplicates: true
    });
  },

  async delete(id: string) {
    return await prisma.wilayah.delete({ where: { id } });
  }
};
