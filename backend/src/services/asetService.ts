import { prisma } from '../prisma';
import { aktivitasService } from './aktivitasService';

export const asetService = {
  async getAll(tenantId: string, scope?: string, page: number = 1, limit: number = 20) {
    const where: any = { tenant_id: tenantId };
    if (scope) where.scope = scope;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        prisma.aset.findMany({
            where,
            include: { peminjam: true },
            orderBy: { nama_barang: 'asc' },
            take: limit,
            skip
        }),
        prisma.aset.count({ where })
    ]);

    return { items, total, page, limit };
  },

  async getById(id: string) {
    return await prisma.aset.findUnique({
      where: { id },
      include: { peminjam: true }
    });
  },

  async create(data: any) {
    const asset = await prisma.aset.create({ data });
    
    // Log Activity
    try {
      await aktivitasService.create({
        tenant_id: data.tenant_id,
        scope: data.scope || 'RT',
        action: 'Aset Baru',
        details: `Menambahkan aset baru: **${data.nama_barang}**`,
        timestamp: Date.now()
      });
    } catch (e) {
      console.warn("Failed to log activity for asset creation:", e);
    }

    return asset;
  },

  async update(id: string, data: any) {
    const asset = await prisma.aset.update({ where: { id }, data });
    
    // Log Activity (e.g. borrowing status or generic update)
    try {
      await aktivitasService.create({
        tenant_id: asset.tenant_id,
        scope: asset.scope || 'RT',
        action: 'Update Aset',
        details: `Memperbarui data aset: **${asset.nama_barang}**`,
        timestamp: Date.now()
      });
    } catch (e) {
      console.warn("Failed to log activity for asset update:", e);
    }

    return asset;
  },

  async delete(id: string) {
    return await prisma.aset.delete({ where: { id } });
  },

  async count(tenantId: string, scope?: string) {
    const where: any = { tenant_id: tenantId };
    if (scope) where.scope = scope;
    return await prisma.aset.count({ where });
  }
};
