import { prisma } from '../prisma';
import { aktivitasService } from './aktivitasService';

export const anggotaKeluargaService = {
    async getByWargaId(wargaId: string) {
        return await prisma.anggotaKeluarga.findMany({
            where: { warga_id: wargaId }
        });
    },

    async getAll(tenantId?: string) {
        const where: any = {};
        if (tenantId) where.tenant_id = tenantId;
        return await prisma.anggotaKeluarga.findMany({ where });
    },

    async getById(id: string) {
        return await prisma.anggotaKeluarga.findUnique({
            where: { id }
        });
    },

    async create(data: any) {
        const result = await prisma.anggotaKeluarga.create({ data });
        // Log activity
        await aktivitasService.create({
            tenant_id: data.tenant_id,
            scope: 'RT',
            action: 'Tambah Anggota',
            details: `Menambahkan anggota keluarga: ${data.nama}`,
            timestamp: Date.now()
        });
        return result;
    },

    async update(id: string, data: any) {
        const result = await prisma.anggotaKeluarga.update({
            where: { id },
            data
        });
        // Log update if possible (tenant_id might be missing in partial data)
        if (result.tenant_id) {
            await aktivitasService.create({
                tenant_id: result.tenant_id,
                scope: 'RT',
                action: 'Edit Anggota',
                details: `Mengubah data anggota: ${result.nama}`,
                timestamp: Date.now()
            });
        }
        return result;
    },

    async delete(id: string) {
        const result = await prisma.anggotaKeluarga.delete({
            where: { id }
        });
        if (result.tenant_id) {
            await aktivitasService.create({
                tenant_id: result.tenant_id,
                scope: 'RT',
                action: 'Hapus Anggota',
                details: `Menghapus anggota keluarga: ${result.nama}`,
                timestamp: Date.now()
            });
        }
        return result;
    }
};
