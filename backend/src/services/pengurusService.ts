import { prisma } from '../prisma';

export const pengurusService = {
  async getAll(tenantId: string, scope?: string) {
    const where: any = {};
    if (tenantId) where.tenant_id = tenantId;
    if (scope) where.scope = scope;
    return await prisma.pengurus.findMany({
      where,
      include: { warga: true }
    });
  },

  async getById(id: string) {
    return await prisma.pengurus.findUnique({
      where: { id },
      include: { warga: true }
    });
  },

  async create(data: any) {
    // Prevent duplicate active position for same person in same scope/period
    if (data.status === 'aktif' || !data.status) {
      const existing = await prisma.pengurus.findFirst({
        where: {
          tenant_id: data.tenant_id,
          scope: data.scope,
          warga_id: data.warga_id,
          jabatan: data.jabatan,
          periode: data.periode,
          status: 'aktif'
        }
      });
      if (existing) {
        throw new Error(`Warga ini sudah menjabat sebagai ${data.jabatan} di periode ${data.periode}`);
      }
    }
    return await prisma.pengurus.create({ data });
  },

  async update(id: string, data: any) {
    if (data.status === 'aktif') {
      const current = await prisma.pengurus.findUnique({ where: { id } });
      const existing = await prisma.pengurus.findFirst({
        where: {
          id: { not: id },
          tenant_id: current?.tenant_id,
          scope: current?.scope,
          warga_id: data.warga_id || current?.warga_id,
          jabatan: data.jabatan || current?.jabatan,
          periode: data.periode || current?.periode,
          status: 'aktif'
        }
      });
      if (existing) {
        throw new Error('Data jabatan aktif serupa sudah ada.');
      }
    }
    return await prisma.pengurus.update({ where: { id }, data });
  },

  async delete(id: string) {
    return await prisma.pengurus.delete({ where: { id } });
  }
};
