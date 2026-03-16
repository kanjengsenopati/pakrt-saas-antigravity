import { prisma } from '../prisma';
import { dateUtils } from '../utils/date';

export const notulensiService = {
  async getAll(tenantId: string, scope?: string) {
    const where: any = {};
    if (tenantId) where.tenant_id = tenantId;
    if (scope) where.scope = scope;
    return await prisma.notulensi.findMany({ where });
  },

  async getById(id: string) {
    return await prisma.notulensi.findUnique({ where: { id } });
  },

  async create(data: any) {
    if (data.tanggal) data.tanggal = dateUtils.normalize(data.tanggal);
    return await prisma.notulensi.create({ data });
  },

  async update(id: string, data: any) {
    if (data.tanggal) data.tanggal = dateUtils.normalize(data.tanggal);
    return await prisma.notulensi.update({ where: { id }, data });
  },

  async delete(id: string) {
    return await prisma.notulensi.delete({ where: { id } });
  }
};
