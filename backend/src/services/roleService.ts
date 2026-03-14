import { prisma } from '../prisma';

const sanitizeRoleData = (data: any) => {
    const {
        id: _id,
        tenant: _tenant,
        ...clean
    } = data;
    return clean;
};

export const roleService = {
    async getAllByTenant(tenantId: string) {
        return await prisma.role.findMany({
            where: { tenant_id: tenantId },
            orderBy: { name: 'asc' }
        });
    },

    async getById(id: string) {
        return await prisma.role.findUnique({
            where: { id }
        });
    },

    async create(data: any) {
        return await prisma.role.create({
            data: sanitizeRoleData(data)
        });
    },

    async update(id: string, data: any) {
        return await prisma.role.update({
            where: { id },
            data: sanitizeRoleData(data)
        });
    },

    async delete(id: string) {
        return await prisma.role.delete({
            where: { id }
        });
    },

    // Seed default roles for a new tenant
    async seedDefaultRoles(tenantId: string) {
        const defaultRoles = [
            {
                tenant_id: tenantId,
                name: 'Admin',
                permissions: {
                    "Warga": { actions: ["Lihat", "Buat", "Ubah", "Hapus"], scope: "all" },
                    "Pengurus": { actions: ["Lihat", "Buat", "Ubah", "Hapus"], scope: "all" },
                    "Buku Kas / Transaksi": { actions: ["Lihat", "Buat", "Ubah", "Hapus"], scope: "all" },
                    "Iuran Warga": { actions: ["Lihat", "Buat", "Ubah", "Hapus"], scope: "all" },
                    "Surat / Cetak": { actions: ["Lihat", "Buat", "Ubah", "Hapus"], scope: "all" },
                    "Agenda": { actions: ["Lihat", "Buat", "Ubah", "Hapus"], scope: "all" },
                    "Aset": { actions: ["Lihat", "Buat", "Ubah", "Hapus"], scope: "all" },
                    "Notulensi": { actions: ["Lihat", "Buat", "Ubah", "Hapus"], scope: "all" },
                    "Jadwal Ronda": { actions: ["Lihat", "Buat", "Ubah", "Hapus"], scope: "all" },
                    "Setup / Pengaturan": { actions: ["Lihat", "Buat", "Ubah", "Hapus"], scope: "all" }
                }
            },
            {
                tenant_id: tenantId,
                name: 'Sekretaris',
                permissions: {
                    "Warga": { actions: ["Lihat", "Buat", "Ubah"], scope: "all" },
                    "Surat / Cetak": { actions: ["Lihat", "Buat", "Ubah"], scope: "all" },
                    "Notulensi": { actions: ["Lihat", "Buat", "Ubah"], scope: "all" },
                    "Agenda": { actions: ["Lihat", "Buat", "Ubah"], scope: "all" },
                    "Setup / Pengaturan": { actions: ["Lihat"], scope: "all" }
                }
            },
            {
                tenant_id: tenantId,
                name: 'Bendahara',
                permissions: {
                    "Buku Kas / Transaksi": { actions: ["Lihat", "Buat", "Ubah"], scope: "all" },
                    "Iuran Warga": { actions: ["Lihat", "Buat", "Ubah"], scope: "all" },
                    "Setup / Pengaturan": { actions: ["Lihat"], scope: "all" }
                }
            },
            {
                tenant_id: tenantId,
                name: 'Warga',
                permissions: {
                    "Warga": { actions: ["Lihat", "Ubah"], scope: "personal" },
                    "Iuran Warga": { actions: ["Lihat", "Buat"], scope: "personal" },
                    "Surat / Cetak": { actions: ["Lihat", "Buat"], scope: "personal" },
                    "Agenda": { actions: ["Lihat"], scope: "all" },
                    "Jadwal Ronda": { actions: ["Lihat"], scope: "all" },
                    "Aset": { actions: ["Lihat"], scope: "all" },
                    "Buku Kas / Transaksi": { actions: ["Lihat"], scope: "all" },
                    "Pengurus": { actions: ["Lihat"], scope: "all" }
                }
            }
        ];

        return await prisma.role.createMany({
            data: defaultRoles,
            skipDuplicates: true
        });
    }
};
