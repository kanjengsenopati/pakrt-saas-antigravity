import { prisma } from '../prisma';

export const suratPengantarService = {
  async getAll(tenantId: string, scope?: string, wargaId?: string, page: number = 1, limit: number = 20) {
    const where: any = { tenant_id: tenantId };
    if (scope) where.scope = scope;
    if (wargaId) where.warga_id = wargaId;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        prisma.suratPengantar.findMany({
            where,
            include: { warga: true },
            orderBy: { tanggal: 'desc' },
            take: limit,
            skip
        }),
        prisma.suratPengantar.count({ where })
    ]);

    return { items, total, page, limit };
  },

  async getById(id: string) {
    return await prisma.suratPengantar.findUnique({
      where: { id },
      include: { warga: true }
    });
  },

  async create(data: any) {
    // Prevent duplicate surat for same warga, jenis_surat, and date
    const existing = await prisma.suratPengantar.findFirst({
      where: {
        tenant_id: data.tenant_id,
        scope: data.scope,
        warga_id: data.warga_id,
        jenis_surat: data.jenis_surat,
        tanggal: data.tanggal
      }
    });
    if (existing) {
      throw new Error(`Surat ${data.jenis_surat} untuk warga ini pada tanggal ${data.tanggal} sudah ada.`);
    }
    // Generate nomor surat if status is 'selesai' and no nomor_surat provided
    if (data.status === 'selesai' && !data.nomor_surat) {
      data.nomor_surat = await this.generateNomorSurat(data.tenant_id);
    }
    return await prisma.suratPengantar.create({ data });
  },

  async update(id: string, data: any) {
    // Generate nomor surat if status is changing to 'selesai'
    if (data.status === 'selesai') {
      const existing = await this.getById(id);
      if (existing && !existing.nomor_surat) {
        data.nomor_surat = await this.generateNomorSurat(existing.tenant_id);
      }
    }
    return await prisma.suratPengantar.update({ where: { id }, data });
  },

  async generateNomorSurat(tenantId: string) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Count letters this month to get serial
    const monthStart = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];

    const count = await prisma.suratPengantar.count({
      where: {
        tenant_id: tenantId,
        status: 'selesai',
        tanggal: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    });

    const serial = (count + 1).toString().padStart(3, '0');
    const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    return `${serial}/SP/${romanMonths[month - 1]}/${year}`;
  },

  async delete(id: string) {
    return await prisma.suratPengantar.delete({ where: { id } });
  }
};
