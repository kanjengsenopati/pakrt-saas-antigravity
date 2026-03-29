import { prisma } from '../prisma';

const sanitizeRoleData = (data: any) => {
    const {
        id: _id,
        tenant: _tenant,
        ...clean
    } = data;
    return clean;
};

// Define core system roles as the source of truth
export const SYSTEM_ROLES = [
    {
        name: 'Ketua',
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
            "Setup / Pengaturan": { actions: ["Lihat", "Buat", "Ubah", "Hapus"], scope: "all" },
            "Manajemen User / Role": { actions: ["Lihat", "Buat", "Ubah", "Hapus"], scope: "all" },
            "Log Aktivitas": { actions: ["Lihat"], scope: "all" },
            "Aduan & Usulan": { actions: ["Lihat", "Buat", "Ubah", "Hapus", "manage"], scope: "all" },
            "Dashboard": { actions: ["Lihat"], scope: "all" }
        }
    },
    {
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
            "Setup / Pengaturan": { actions: ["Lihat", "Buat", "Ubah", "Hapus"], scope: "all" },
            "Manajemen User / Role": { actions: ["Lihat", "Buat", "Ubah", "Hapus"], scope: "all" },
            "Log Aktivitas": { actions: ["Lihat"], scope: "all" },
            "Aduan & Usulan": { actions: ["Lihat", "Buat", "Ubah", "Hapus", "manage"], scope: "all" },
            "Dashboard": { actions: ["Lihat"], scope: "all" }
        }
    },
    {
        name: 'Sekretaris',
        permissions: {
            "Log Aktivitas": { actions: ["Lihat"], scope: "all" },
            "Aduan & Usulan": { actions: ["Lihat", "Buat", "Ubah"], scope: "all" },
            "Dashboard": { actions: ["Lihat"], scope: "all" }
        }
    },
    {
        name: 'Bendahara',
        permissions: {
            "Setup / Pengaturan": { actions: ["Lihat"], scope: "all" },
            "Aduan & Usulan": { actions: ["Lihat", "Buat", "Ubah"], scope: "all" },
            "Dashboard": { actions: ["Lihat"], scope: "all" }
        }
    },
    {
        name: 'Warga',
        permissions: {
            "Pengurus": { actions: ["Lihat"], scope: "all" },
            "Aduan & Usulan": { actions: ["Lihat", "Buat", "Ubah"], scope: "personal" },
            "Dashboard": { actions: ["Lihat"], scope: "all" }
        }
    }
];

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

    // Sync default roles for a tenant, ensuring all standard roles exist and have correct permissions
    async syncDefaultRoles(tenantId: string, txClient: any = prisma) {
        const results = [];
        
        for (const roleDef of SYSTEM_ROLES) {
            // Find existing role by name for this tenant
            const existing = await txClient.role.findFirst({
                where: { 
                    tenant_id: tenantId, 
                    name: roleDef.name 
                }
            });

            if (existing) {
                // Update permissions to ensure system roles stay in sync with latest definitions
                // This ensures that new modules added to SYSTEM_ROLES are propagated to all tenants
                const updated = await txClient.role.update({
                    where: { id: existing.id },
                    data: { permissions: roleDef.permissions }
                });
                results.push(updated);
            } else {
                // Create missing role
                const newRole = await txClient.role.create({
                    data: {
                        tenant_id: tenantId,
                        name: roleDef.name,
                        permissions: roleDef.permissions
                    }
                });
                results.push(newRole);
            }
        }

        return results;
    }
};
