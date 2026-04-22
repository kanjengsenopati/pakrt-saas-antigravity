import { prisma } from '../prisma';
import { dateUtils } from '../utils/date';
import { aktivitasService } from './aktivitasService';
import { wargaService } from './wargaService';
import { DocumentUtils } from '../utils/DocumentUtils';
import { NotificationHelper } from '../utils/NotificationHelper';

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
    if (data.tanggal) data.tanggal = dateUtils.normalize(data.tanggal);
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
    const result = await prisma.suratPengantar.create({ data });
    
    // Log Activity & Notify Warga
    try {
      const warga = await wargaService.getById(data.warga_id);
      await aktivitasService.create({
        tenant_id: data.tenant_id,
        scope: data.scope || 'RT',
        action: 'Surat Pengantar',
        details: `**${warga?.nama || 'Warga'}** mengajukan surat pengantar baru: ${data.jenis_surat}`,
        timestamp: Date.now()
      });
      
      // Notify Admin/Staff that a new application is waiting (Optional but good)
      // For now, let's notify the Warga that their request is received
      await NotificationHelper.notifyWargas([data.warga_id], {
        title: 'Surat Diajukan',
        body: `Permohonan ${data.jenis_surat} Anda sedang diproses.`
      });
    } catch (e) {
      console.warn("Failed to log activity/notify for surat creation:", e);
    }

    return result;
  },

  async update(id: string, data: any) {
    if (data.tanggal) data.tanggal = dateUtils.normalize(data.tanggal);
    // Generate nomor surat if status is changing to 'selesai'
    if (data.status === 'selesai') {
      const existing = await this.getById(id);
      if (existing && !existing.nomor_surat) {
        data.nomor_surat = await this.generateNomorSurat(existing.tenant_id);
      }
    }
    const result = await prisma.suratPengantar.update({ where: { id }, data });

    // Log Activity & Notify Warga if status changed
    if (data.status) {
      try {
        const existing = await this.getById(id);
        await aktivitasService.create({
          tenant_id: result.tenant_id,
          scope: result.scope || 'RT',
          action: 'Update Surat',
          details: `Status surat pengantar **${existing?.warga?.nama || 'Warga'}** (${result.jenis_surat}) diperbarui menjadi: ${result.status.toUpperCase()}`,
          timestamp: Date.now()
        });

        // Notify Warga of status update
        await NotificationHelper.notifyWargas([result.warga_id], {
          title: `Update Surat: ${result.status.toUpperCase()}`,
          body: `Status permohonan ${result.jenis_surat} Anda kini: ${result.status.toUpperCase()}`
        });
      } catch (e) {
        console.warn("Failed to log activity/notify for surat update:", e);
      }
    }

    return result;
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

    return DocumentUtils.formatSerialNumber(count + 1, 'SP');
  },

  async delete(id: string) {
    return await prisma.suratPengantar.delete({ where: { id } });
  }
};
