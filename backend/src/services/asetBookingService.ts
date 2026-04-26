import { prisma } from '../prisma';
import { pushService } from './pushService';

export const asetBookingService = {
  async getAll(tenantId: string, asetId?: string, status?: string) {
    const where: any = { tenant_id: tenantId };
    if (asetId) where.aset_id = asetId;
    if (status) where.status = status;

    return await prisma.asetBooking.findMany({
      where,
      include: {
        aset: true,
        warga: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async create(data: any) {
    return await prisma.asetBooking.create({
      data: {
        tenant_id: data.tenant_id,
        aset_id: data.aset_id,
        warga_id: data.warga_id,
        tanggal_mulai: data.tanggal_mulai,
        tanggal_selesai: data.tanggal_selesai,
        keperluan: data.keperluan,
        status: 'PENDING'
      }
    });
  },

  async updateStatus(id: string, status: string, catatan_admin?: string) {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.asetBooking.findUnique({
        where: { id },
        include: { aset: true, warga: true }
      });

      if (!booking) throw new Error("Booking not found");

      const updated = await tx.asetBooking.update({
        where: { id },
        data: { status, catatan_admin }
      });

      // If approved, we might want to automatically mark the asset as borrowed IF the date is TODAY
      // But for a booking system, it's better to keep status separate until actual pickup.
      // However, to keep it simple as requested, if status is APPROVED, we send notification.
      
      if (status === 'APPROVED') {
        await pushService.sendNotificationToWarga(booking.warga_id, {
          title: 'Booking Aset Disetujui! ✅',
          body: `Permintaan pinjam ${booking.aset.nama_barang} Anda telah disetujui. Silakan ambil sesuai jadwal.`,
          icon: '/pwa-192x192.png',
          data: { url: '/aset' }
        }).catch(e => console.warn("Push failed:", e));
      } else if (status === 'REJECTED') {
        await pushService.sendNotificationToWarga(booking.warga_id, {
          title: 'Booking Aset Ditolak ❌',
          body: `Maaf, permintaan pinjam ${booking.aset.nama_barang} Anda ditolak. ${catatan_admin ? 'Alasan: ' + catatan_admin : ''}`,
          icon: '/pwa-192x192.png',
          data: { url: '/aset' }
        }).catch(e => console.warn("Push failed:", e));
      }

      return updated;
    });
  },

  async delete(id: string) {
    return await prisma.asetBooking.delete({ where: { id } });
  }
};
