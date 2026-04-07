import { prisma } from '../prisma';
import { dateUtils } from '../utils/date';
import { pushService } from './pushService';
import { aktivitasService } from './aktivitasService';

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
        
        // SYNC KEUANGAN: If Needs Funding from RT Cash
        if (item.butuh_pendanaan && item.sumber_dana === 'Kas' && item.nominal_biaya) {
            await (tx.keuangan as any).create({
                data: {
                    tenant_id: item.tenant_id,
                    scope: item.scope || 'RT',
                    tipe: 'pengeluaran',
                    kategori: 'Kegiatan Agenda',
                    nominal: item.nominal_biaya,
                    tanggal: item.tanggal,
                    keterangan: `Dana untuk agenda: **${item.judul}**`,
                    agendaId: item.id
                }
            });
        }
        
        return item;
    });

    // Trigger Push Notification
    try {
        const payload = {
            title: 'Agenda Baru: ' + agenda.judul,
            body: `Kegiatan baru pada ${dateUtils.toDisplay(agenda.tanggal)}. Cek detailnya sekarang!`,
            icon: '/pwa-192x192.png',
            data: { url: '/agenda', id: agenda.id }
        };

        if (agenda.is_semua_warga) {
            await pushService.sendNotificationToScope(agenda.tenant_id, agenda.scope, payload);
        } else if (agenda.peserta_ids && agenda.peserta_ids.length > 0) {
            await Promise.all(agenda.peserta_ids.map(id => 
                pushService.sendNotificationToWarga(id, payload)
            ));
        }
    } catch (error) {
        console.error('Error sending agenda push notification:', error);
    }

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
        
        // SYNC KEUANGAN: Handle changes in funding status or amount
        const existingKeuangan = await (tx.keuangan as any).findUnique({ where: { agendaId: id } });
        
        if (item.butuh_pendanaan && item.sumber_dana === 'Kas' && item.nominal_biaya) {
            if (existingKeuangan) {
                // Update existing expense
                await (tx.keuangan as any).update({
                    where: { id: existingKeuangan.id },
                    data: {
                        nominal: item.nominal_biaya,
                        tanggal: item.tanggal,
                        keterangan: `Dana untuk agenda: **${item.judul}**`
                    }
                });
            } else {
                // Create new expense if it wasn't there
                await (tx.keuangan as any).create({
                    data: {
                        tenant_id: item.tenant_id,
                        scope: item.scope || 'RT',
                        tipe: 'pengeluaran',
                        kategori: 'Kegiatan Agenda',
                        nominal: item.nominal_biaya,
                        tanggal: item.tanggal,
                        keterangan: `Dana untuk agenda: **${item.judul}**`,
                        agendaId: item.id
                    }
                });
            }
        } else if (existingKeuangan) {
            // Remove expense if funding is turned off or source changed
            await (tx.keuangan as any).delete({ where: { id: existingKeuangan.id } });
        }
        
        return item;
    });

    // Trigger Push Notification on Update (if important fields changed or just as a reminder)
    try {
        const payload = {
            title: 'Update Agenda: ' + agenda.judul,
            body: `Terdapat update pada kegiatan ${agenda.judul} (${dateUtils.toDisplay(agenda.tanggal)}). Silakan cek detailnya!`,
            icon: '/pwa-192x192.png',
            data: { url: '/agenda', id: agenda.id }
        };

        if (agenda.is_semua_warga) {
            await pushService.sendNotificationToScope(agenda.tenant_id, agenda.scope, payload);
        } else if (agenda.peserta_ids && agenda.peserta_ids.length > 0) {
            await Promise.all(agenda.peserta_ids.map(id => 
                pushService.sendNotificationToWarga(id, payload)
            ));
        }
    } catch (error) {
        console.error('Error sending agenda update push notification:', error);
    }

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
        // Automatically cleanup linked financial records
        await (tx.keuangan as any).deleteMany({ where: { agendaId: id } });
        return await tx.agenda.delete({ where: { id } });
    });
  }
};
