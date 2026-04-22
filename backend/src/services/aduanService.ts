import { prisma } from '../prisma';
import { dateUtils } from '../utils/date';
import { aktivitasService } from './aktivitasService';
import { NotificationHelper } from '../utils/NotificationHelper';

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
    const result = await prisma.aduanUsulan.create({ data });

    // Log Activity & Notify Staff (Future: scope notification for important complaints)
    try {
      const warga = await prisma.warga.findUnique({ where: { id: data.warga_id } });
      await aktivitasService.create({
        tenant_id: data.tenant_id,
        scope: data.scope || 'RT',
        action: 'Aduan Warga',
        details: `**${warga?.nama || 'Warga'}** mengirimkan aduan: ${data.judul}`,
        timestamp: Date.now()
      });
      
      // Notify the reporter that it's received
      await NotificationHelper.notifyWargas([data.warga_id], {
        title: 'Aduan Diterima',
        body: `Aduan "${data.judul}" Anda telah diterima dan akan segera ditinjau.`
      });
    } catch (e) {
      console.warn("Failed to log activity/notify for aduan creation:", e);
    }

    return result;
  },

  async update(id: string, data: any) {
    if (data.tanggal) data.tanggal = dateUtils.normalize(data.tanggal);
    const result = await prisma.aduanUsulan.update({ where: { id }, data });

    // Log Activity & Notify Reporter if status changed
    if (data.status) {
      try {
        const aduan = await this.getById(id);
        await aktivitasService.create({
          tenant_id: result.tenant_id,
          scope: result.scope || 'RT',
          action: 'Update Aduan',
          details: `Status aduan **${aduan?.warga?.nama || 'Warga'}** (${result.judul}) diperbarui menjadi: ${result.status}`,
          timestamp: Date.now()
        });

        // Notify the reporter
        await NotificationHelper.notifyWargas([result.warga_id], {
          title: `Update Aduan: ${result.status}`,
          body: `Status aduan "${result.judul}" Anda kini: ${result.status}`
        });
      } catch (e) {
        console.warn("Failed to log activity/notify for aduan update:", e);
      }
    }

    return result;
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
