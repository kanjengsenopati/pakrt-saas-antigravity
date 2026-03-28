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

  async getByKey(tenantId: string, scope: string, key: string) {
    return await prisma.pengaturan.findFirst({
        where: { tenant_id: tenantId, scope, key }
    });
  },

  async create(data: any) {
    return await prisma.pengaturan.create({ data });
  },

  async upsert(data: any) {
    const { tenant_id, scope, key, value } = data;
    const existing = await prisma.pengaturan.findFirst({
        where: { tenant_id, scope: scope || 'RT', key }
    });

    if (existing) {
        return await prisma.pengaturan.update({
            where: { id: existing.id },
            data: { value }
        });
    } else {
        return await prisma.pengaturan.create({
            data: { tenant_id, scope: scope || 'RT', key, value }
        });
    }
  },

  async batchUpsert(tenantId: string, scope: string, items: any[]) {
    return await prisma.$transaction(async (tx) => {
        for (const item of items) {
            const { key, value } = item;
            const targetScope = item.scope || scope || 'RT';
            const existing = await tx.pengaturan.findFirst({
                where: { tenant_id: tenantId, scope: targetScope, key }
            });

            if (existing) {
                await tx.pengaturan.update({
                    where: { id: existing.id },
                    data: { value }
                });
            } else {
                await tx.pengaturan.create({
                    data: { tenant_id: tenantId, scope: targetScope, key, value }
                });
            }
        }
    });
  },

  async update(id: string, data: any) {
    return await prisma.pengaturan.update({ where: { id }, data });
  },

  async delete(id: string) {
    return await prisma.pengaturan.delete({ where: { id } });
  }
};
