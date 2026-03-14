import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDefaultRoles(tenantId: string) {
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
                "Agenda": { actions: ["Lihat", "Buat", "Ubah"], scope: "all" }
            }
        },
        {
            tenant_id: tenantId,
            name: 'Bendahara',
            permissions: {
                "Buku Kas / Transaksi": { actions: ["Lihat", "Buat", "Ubah"], scope: "all" },
                "Iuran Warga": { actions: ["Lihat", "Buat", "Ubah"], scope: "all" }
            }
        },
        {
            tenant_id: tenantId,
            name: 'Warga',
            permissions: {
                "Warga": { actions: ["Lihat"], scope: "personal" },
                "Iuran Warga": { actions: ["Lihat"], scope: "personal" },
                "Surat / Cetak": { actions: ["Lihat", "Buat"], scope: "personal" },
                "Agenda": { actions: ["Lihat"], scope: "all" },
                "Jadwal Ronda": { actions: ["Lihat"], scope: "all" }
            }
        }
    ];

    return await prisma.role.createMany({
        data: defaultRoles,
        skipDuplicates: true
    });
}

async function main() {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, tenant_id: true, role: true, email: true }
        });

        const tenants = Array.from(new Set(users.map(u => u.tenant_id)));
        console.log(`Migrating ${tenants.length} tenants...`);

        for (const tenantId of tenants) {
            console.log(`\nProcessing Tenant: ${tenantId}`);
            
            // 1. Seed default roles
            await seedDefaultRoles(tenantId);
            
            // 2. Fetch the created roles
            const roles = await prisma.role.findMany({ where: { tenant_id: tenantId } });
            
            // 3. Update users for this tenant
            const tenantUsers = users.filter(u => u.tenant_id === tenantId);
            for (const user of tenantUsers) {
                const matchedRole = roles.find(r => r.name.toLowerCase() === user.role.toLowerCase());
                
                if (matchedRole) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { 
                            role_id: matchedRole.id,
                            permissions: matchedRole.permissions as any
                        }
                    });
                    console.log(`  Linked User ${user.email} (${user.role}) -> Role ${matchedRole.name}`);
                } else {
                    console.warn(`  Warning: User ${user.email} has unknown role: ${user.role}`);
                }
            }
        }
        console.log('\nMigration complete.');

    } catch (e) {
        console.error('Error during migration:', e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
