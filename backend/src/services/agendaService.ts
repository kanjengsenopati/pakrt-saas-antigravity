import { prisma } from '../prisma';
import { dateUtils } from '../utils/date';
import { aktivitasService } from './aktivitasService';
import { NotificationHelper } from '../utils/NotificationHelper';

/**
 * Synchronizes agenda-related financial transactions to the Keuangan ledger.
 */
async function syncToKeuangan(tx: any, agenda: any, action: 'CREATE' | 'UPDATE' | 'DELETE') {
  const existingKeuangan = await (tx.keuangan as any).findUnique({ 
    where: { agendaId: agenda.id } 
  });

  if (action === 'DELETE') {
    if (existingKeuangan) {
      await (tx.keuangan as any).delete({ where: { id: existingKeuangan.id } });
    }
    return;
  }

  // Business Logic: Only sync to Keuangan if funding is from 'Kas' and has nominal
  const shouldHaveExpense = agenda.butuh_pendanaan && agenda.sumber_dana === 'Kas' && agenda.nominal_biaya;

  if (shouldHaveExpense) {
    const payload = {
      tenant_id: agenda.tenant_id,
      scope: agenda.scope || 'RT',
      tipe: 'pengeluaran',
      kategori: 'Kegiatan Agenda',
      nominal: Number(agenda.nominal_biaya),
      tanggal: agenda.tanggal,
      keterangan: `Dana untuk agenda: **${agenda.judul}**`,
      agendaId: agenda.id
    };

    if (existingKeuangan) {
      await (tx.keuangan as any).update({
        where: { id: existingKeuangan.id },
        data: payload
      });
    } else {
      await (tx.keuangan as any).create({ data: payload });
    }
  } else if (existingKeuangan) {
    // If it used to have an expense but now it shouldn't (funding turned off or source changed)
    await (tx.keuangan as any).delete({ where: { id: existingKeuangan.id } });
  }
}

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
    
    const agenda = await prisma.$transaction(async (tx) => {
        const item = await tx.agenda.create({ data });
        
        // SYNC KEUANGAN: Centralized logic via helper
        await syncToKeuangan(tx, item, 'CREATE');
        
        return item;
    });

    // Trigger Push Notification via Helper
    await NotificationHelper.notifyTarget(agenda, {
        title: 'Agenda Baru: ' + agenda.judul,
        body: `Kegiatan baru pada ${dateUtils.toDisplay(agenda.tanggal)}. Cek detailnya sekarang!`,
        data: { url: '/agenda', id: agenda.id }
    });

    // Log Activity
    try {
        await aktivitasService.create({
            tenant_id: agenda.tenant_id,
            scope: agenda.scope || 'RT',
            action: 'Agenda Baru',
            details: `Menambahkan agenda baru: **${agenda.judul}** pada ${dateUtils.toDisplay(agenda.tanggal)}`,
            timestamp: Date.now()
        });
    } catch (e) {
        console.warn("Failed to log activity for agenda creation:", e);
    }

    return agenda;
  },

  async update(id: string, data: any) {
    if (data.tanggal) data.tanggal = dateUtils.normalize(data.tanggal);
    
    const agenda = await prisma.$transaction(async (tx) => {
        const item = await tx.agenda.update({ where: { id }, data });
        
        // SYNC KEUANGAN: Centralized logic via helper
        await syncToKeuangan(tx, item, 'UPDATE');
        
        return item;
    });

    // Trigger Push Notification on Update
    await NotificationHelper.notifyTarget(agenda, {
        title: 'Update Agenda: ' + agenda.judul,
        body: `Terdapat update pada kegiatan ${agenda.judul} (${dateUtils.toDisplay(agenda.tanggal)}). Silakan cek detailnya!`,
        data: { url: '/agenda', id: agenda.id }
    });

    // Log Activity
    try {
        await aktivitasService.create({
            tenant_id: agenda.tenant_id,
            scope: agenda.scope || 'RT',
            action: 'Update Agenda',
            details: `Memperbarui agenda: **${agenda.judul}**`,
            timestamp: Date.now()
        });
    } catch (e) {
        console.warn("Failed to log activity for agenda update:", e);
    }

    return agenda;
  },

  async delete(id: string) {
    return await prisma.$transaction(async (tx) => {
        const agenda = await tx.agenda.findUnique({ where: { id } });
        if (agenda) {
            await syncToKeuangan(tx, agenda, 'DELETE');
        }
        return await tx.agenda.delete({ where: { id } });
    });
  }
};
