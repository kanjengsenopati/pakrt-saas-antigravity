import { prisma } from '../prisma';
import { dateUtils } from '../utils/date';

export const aduanService = {
  async getAll(tenantId: string, scope?: string, status?: string, tipe?: string, wargaId?: string, page: number = 1, limit: number = 20) {
    const where: any = { tenant_id: tenantId };
    if (scope) where.scope = scope;
    if (status) where.status = status;
    if (tipe) where.tipe = tipe;
    if (wargaId) where.warga_id = wargaId;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.aduanUsulan.findMany({
        where,
        include: { 
          warga: true,
          polling: {
            include: {
              opsi: {
                include: {
                  _count: {
                    select: { votes: true }
                  }
                }
              }
            }
          }
        },
        orderBy: { tanggal: 'desc' },
        take: limit,
        skip
      }),
      prisma.aduanUsulan.count({ where })
    ]);

    return { items, total, page, limit };
  },

  async getById(id: string) {
    return await prisma.aduanUsulan.findUnique({
      where: { id },
      include: { 
        warga: true,
        polling: {
          include: {
            opsi: {
              include: {
                _count: {
                  select: { votes: true }
                }
              }
            },
            votes: {
              include: {
                warga: {
                  select: { nama: true }
                }
              }
            }
          }
        }
      }
    });
  },

  async create(data: any) {
    if (data.tanggal) data.tanggal = dateUtils.normalize(data.tanggal);
    return await prisma.aduanUsulan.create({ data });
  },

  async update(id: string, data: any) {
    if (data.tanggal) data.tanggal = dateUtils.normalize(data.tanggal);
    return await prisma.aduanUsulan.update({ where: { id }, data });
  },

  async delete(id: string) {
    return await prisma.aduanUsulan.delete({ where: { id } });
  },

  async getStats(tenantId: string, scope?: string) {
    const where: any = { tenant_id: tenantId };
    if (scope) where.scope = scope;

    const [total, pending, processing, completed, byType] = await Promise.all([
      prisma.aduanUsulan.count({ where }),
      prisma.aduanUsulan.count({ where: { ...where, status: 'Menunggu' } }),
      prisma.aduanUsulan.count({ where: { ...where, status: 'Proses' } }),
      prisma.aduanUsulan.count({ where: { ...where, status: 'Selesai' } }),
      prisma.aduanUsulan.groupBy({
        by: ['tipe'],
        where,
        _count: true
      })
    ]);

    return { total, pending, processing, completed, byType };
  }
};
