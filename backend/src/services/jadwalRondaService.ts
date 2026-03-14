import { prisma } from '../prisma';

export const jadwalRondaService = {
  async getAll(tenantId: string, scope?: string, wargaId?: string) {
    const where: any = {};
    if (tenantId) where.tenant_id = tenantId;
    if (scope) where.scope = scope;
    if (wargaId) {
      where.warga_ids = {
        has: wargaId
      };
    }
    return await prisma.jadwalRonda.findMany({
      where,
      orderBy: { tanggal: 'asc' }
    });
  },

  async getById(id: string) {
    return await prisma.jadwalRonda.findUnique({ where: { id } });
  },

  async create(data: any) {
    // Prevent duplicate schedule for same date, regu, tenant, scope
    const existing = await prisma.jadwalRonda.findFirst({
      where: {
        tenant_id: data.tenant_id,
        scope: data.scope,
        tanggal: data.tanggal,
        regu: data.regu
      }
    });
    if (existing) {
      throw new Error(`Jadwal ronda untuk Regu ${data.regu} pada tanggal ${data.tanggal} sudah ada.`);
    }
    return await prisma.jadwalRonda.create({ data });
  },

  async update(id: string, data: any) {
    // Check if updated date/regu conflicts with another record
    if (data.tanggal || data.regu) {
      const current = await prisma.jadwalRonda.findUnique({ where: { id } });
      const existing = await prisma.jadwalRonda.findFirst({
        where: {
          id: { not: id },
          tenant_id: current?.tenant_id,
          scope: current?.scope,
          tanggal: data.tanggal || current?.tanggal,
          regu: data.regu || current?.regu
        }
      });
      if (existing) {
        throw new Error(`Jadwal ronda untuk Regu ${data.regu || current?.regu} pada tanggal ${data.tanggal || current?.tanggal} sudah ada.`);
      }
    }
    return await prisma.jadwalRonda.update({ where: { id }, data });
  },

  async delete(id: string) {
    return await prisma.jadwalRonda.delete({ where: { id } });
  }
};
