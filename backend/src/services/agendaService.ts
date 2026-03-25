import { prisma } from '../prisma';
import { dateUtils } from '../utils/date';

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

    // Hydrate Peserta Names
    const allPesertaIds = Array.from(new Set(items.flatMap(i => i.peserta_ids || [])));
    const wargas = allPesertaIds.length > 0 
        ? await prisma.warga.findMany({
            where: { id: { in: allPesertaIds } },
            select: { id: true, nama: true }
        })
        : [];
    
    const wargaMap = new Map(wargas.map(w => [w.id, w.nama]));
    const itemsWithDetails = items.map(item => ({
        ...item,
        peserta_details: (item.peserta_ids || []).map(id => ({
            id,
            nama: wargaMap.get(id) || 'Warga'
        }))
    }));

    return { items: itemsWithDetails, total, page, limit };
  },

  async getById(id: string) {
    const agenda = await prisma.agenda.findUnique({ where: { id } });
    if (!agenda) return null;

    const wargas = agenda.peserta_ids.length > 0
        ? await prisma.warga.findMany({
            where: { id: { in: agenda.peserta_ids } },
            select: { id: true, nama: true }
        })
        : [];

    return {
        ...agenda,
        peserta_details: wargas
    };
  },

  async create(data: any) {
    if (data.tanggal) data.tanggal = dateUtils.normalize(data.tanggal);
    return await prisma.agenda.create({ data });
  },

  async update(id: string, data: any) {
    if (data.tanggal) data.tanggal = dateUtils.normalize(data.tanggal);
    return await prisma.agenda.update({ where: { id }, data });
  },

  async delete(id: string) {
    return await prisma.agenda.delete({ where: { id } });
  }
};
