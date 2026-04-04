import { prisma } from '../prisma';
import { dateUtils } from '../utils/date';
import { pushService } from './pushService';
import { aktivitasService } from './aktivitasService';

export const notulensiService = {
  async getAll(tenantId: string, scope?: string) {
    const where: any = {};
    if (tenantId) where.tenant_id = tenantId;
    if (scope) where.scope = scope;
    return await prisma.notulensi.findMany({ where });
  },

  async getById(id: string) {
    return await prisma.notulensi.findUnique({ where: { id } });
  },

  async create(data: any) {
    const { kehadiran, ...notulensiData } = data;
    if (notulensiData.tanggal) notulensiData.tanggal = dateUtils.normalize(notulensiData.tanggal);
    
    const notulensi = await prisma.notulensi.create({ data: notulensiData });

    if (kehadiran) {
      const kehadiranArray = Array.isArray(kehadiran) ? kehadiran : Object.values(kehadiran);
      if (kehadiranArray.length > 0) {
        await prisma.kehadiran.createMany({
          data: kehadiranArray.map((k: any) => ({
            ...k,
            notulensi_id: notulensi.id,
            tenant_id: notulensi.tenant_id
          }))
        });
      }
    }

    // Trigger Push Notification
    try {
        await pushService.sendNotificationToScope(notulensi.tenant_id, notulensi.scope, {
            title: 'Notulensi Baru: ' + notulensi.judul,
            body: `Hasil pertemuan pada ${dateUtils.toDisplay(notulensi.tanggal)} sudah tersedia.`,
            icon: '/pwa-192x192.png',
            data: { url: '/notulensi', id: notulensi.id }
        });
    } catch (error) {
        console.error('Error sending notulensi push notification:', error);
    }

    // Log Activity
    try {
        await aktivitasService.create({
            tenant_id: notulensi.tenant_id,
            scope: notulensi.scope || 'RT',
            action: 'Notulensi Baru',
            details: `Menambahkan notulensi baru: **${notulensi.judul}** untuk pertemuan tanggal ${dateUtils.toDisplay(notulensi.tanggal)}`,
            timestamp: Date.now()
        });
    } catch (e) {
        console.warn("Failed to log activity for notulensi creation:", e);
    }

    return notulensi;
  },

  async update(id: string, data: any) {
    const { kehadiran, ...notulensiData } = data;
    if (notulensiData.tanggal) notulensiData.tanggal = dateUtils.normalize(notulensiData.tanggal);
    
    const notulensi = await prisma.notulensi.update({ 
      where: { id }, 
      data: notulensiData 
    });

    if (kehadiran) {
      const kehadiranArray = Array.isArray(kehadiran) ? kehadiran : Object.values(kehadiran);
      // Sync attendance: delete and recreate in one batch
      await prisma.kehadiran.deleteMany({ where: { notulensi_id: id } });
      if (kehadiranArray.length > 0) {
        await prisma.kehadiran.createMany({
          data: kehadiranArray.map((k: any) => ({
            ...k,
            notulensi_id: id,
            tenant_id: notulensi.tenant_id
          }))
        });
      }
    }

    // Log Activity
    try {
        await aktivitasService.create({
            tenant_id: notulensi.tenant_id,
            scope: notulensi.scope || 'RT',
            action: 'Update Notulensi',
            details: `Memperbarui notulensi: **${notulensi.judul}**`,
            timestamp: Date.now()
        });
    } catch (e) {
        console.warn("Failed to log activity for notulensi update:", e);
    }

    return notulensi;
  },

  async delete(id: string) {
    return await prisma.notulensi.delete({ where: { id } });
  }
};
