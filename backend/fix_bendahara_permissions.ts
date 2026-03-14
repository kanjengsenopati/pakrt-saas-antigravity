import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Find all Bendahara roles
    const bendaharaRoles = await prisma.role.findMany({
        where: { name: 'Bendahara' }
    });

    console.log(`Found ${bendaharaRoles.length} Bendahara role(s).`);

    for (const role of bendaharaRoles) {
        const currentPerms = (role.permissions as any) || {};

        const updatedPerms = {
            ...currentPerms,
            // Read-only access to Warga (needed by IuranForm to list warga)
            'Warga': {
                scope: 'all',
                actions: ['Lihat']
            },
            // Read-only access to Pengaturan (needed by IuranForm to get iuran rates)
            'Setup / Pengaturan': {
                scope: 'all',
                actions: ['Lihat']
            },
            // Preserve existing permissions
            'Iuran Warga': currentPerms['Iuran Warga'] || {
                scope: 'all',
                actions: ['Lihat', 'Buat', 'Ubah']
            },
            'Buku Kas / Transaksi': currentPerms['Buku Kas / Transaksi'] || {
                scope: 'all',
                actions: ['Lihat', 'Buat', 'Ubah']
            }
        };

        await prisma.role.update({
            where: { id: role.id },
            data: { permissions: updatedPerms }
        });

        console.log(`✅ Updated Bendahara role [tenant: ${role.tenant_id}] - added Warga:Lihat and Setup/Pengaturan:Lihat`);
        console.log('   New permissions:', JSON.stringify(updatedPerms, null, 2));
    }
}

main()
    .catch(e => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => await prisma.$disconnect());
