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
    const jadwal = await prisma.jadwalRonda.findMany({
      where,
      orderBy: { tanggal: 'asc' }
    });

    // Populate warga details
    const allWargaIds = new Set<string>();
    jadwal.forEach(j => {
        j.warga_ids?.forEach(id => allWargaIds.add(id));
        j.petugas_konsumsi?.forEach(id => allWargaIds.add(id));
    });

    const wargaData = await prisma.warga.findMany({
        where: { id: { in: Array.from(allWargaIds) } },
        select: { id: true, nama: true }
    });

    const wargaMap = new Map(wargaData.map(w => [w.id, w]));

    return jadwal.map(j => ({
        ...j,
        anggota_warga: (j.warga_ids || []).map(id => wargaMap.get(id)).filter(w => w !== undefined),
        anggota_konsumsi: (j.petugas_konsumsi || []).map(id => wargaMap.get(id)).filter(w => w !== undefined)
    }));
  },

  async getById(id: string) {
    const j = await prisma.jadwalRonda.findUnique({ where: { id } });
    if (!j) return null;

    const allWargaIds = new Set<string>();
    j.warga_ids?.forEach((id: string) => allWargaIds.add(id));
    j.petugas_konsumsi?.forEach((id: string) => allWargaIds.add(id));

    const wargaData = await prisma.warga.findMany({
        where: { id: { in: Array.from(allWargaIds) } },
        select: { id: true, nama: true }
    });

    const wargaMap = new Map(wargaData.map(w => [w.id, w]));

    return {
        ...j,
        anggota_warga: (j.warga_ids || []).map((wId: string) => wargaMap.get(wId)).filter(w => w !== undefined),
        anggota_konsumsi: (j.petugas_konsumsi || []).map((wId: string) => wargaMap.get(wId)).filter(w => w !== undefined)
    };
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
