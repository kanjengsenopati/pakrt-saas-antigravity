import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const newWargaPermissions = {
    "Warga": { actions: ["Lihat", "Ubah"], scope: "personal" },
    "Iuran Warga": { actions: ["Lihat", "Buat"], scope: "personal" },
    "Surat / Cetak": { actions: ["Lihat", "Buat"], scope: "personal" },
    "Agenda": { actions: ["Lihat"], scope: "all" },
    "Jadwal Ronda": { actions: ["Lihat"], scope: "all" },
    "Aset": { actions: ["Lihat"], scope: "all" },
    "Buku Kas / Transaksi": { actions: ["Lihat"], scope: "all" },
    "Pengurus": { actions: ["Lihat"], scope: "all" }
};

async function main() {
    console.log('Starting Warga Role Synchronization...');

    const updatedRoles = await prisma.role.updateMany({
        where: {
            name: 'Warga'
        },
        data: {
            permissions: newWargaPermissions
        }
    });

    console.log(`Successfully updated ${updatedRoles.count} Warga roles.`);

    // Also update users who might have legacy permissions or need refresh
    // Note: Since AuthContext refreshes from database, updating the Role 
    // is usually enough if the user is linked to that Role via role_id.
    
    console.log('Synchronization complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
