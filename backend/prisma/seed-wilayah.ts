import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const wilayahData = [
        // Provinsi
        { id: '33', name: 'JAWA TENGAH', level: 'provinsi', parent_id: null },
        { id: '31', name: 'DKI JAKARTA', level: 'provinsi', parent_id: null },
        { id: '32', name: 'JAWA BARAT', level: 'provinsi', parent_id: null },

        // Kab/Kota (Jateng)
        { id: '33.74', name: 'KOTA SEMARANG', level: 'kabkota', parent_id: '33' },
        { id: '33.71', name: 'KOTA MAGELANG', level: 'kabkota', parent_id: '33' },
        { id: '33.72', name: 'KOTA SURAKARTA', level: 'kabkota', parent_id: '33' },

        // Kecamatan (Semarang)
        { id: '33.74.10', name: 'TEMBALANG', level: 'kecamatan', parent_id: '33.74' },
        { id: '33.74.11', name: 'BANYUMANIK', level: 'kecamatan', parent_id: '33.74' },
        { id: '33.74.12', name: 'GAJAHMUNGKUR', level: 'kecamatan', parent_id: '33.74' },

        // Kelurahan (Tembalang)
        { id: '33.74.10.1011', name: 'SENDANGMULYO', level: 'keldesa', parent_id: '33.74.10' },
        { id: '33.74.10.1012', name: 'MANGUNHARJO', level: 'keldesa', parent_id: '33.74.10' },
        { id: '33.74.10.1013', name: 'METESEH', level: 'keldesa', parent_id: '33.74.10' },
    ];

    console.log('Seeding wilayah...');
    for (const item of wilayahData) {
        await prisma.wilayah.upsert({
            where: { id: item.id },
            update: item,
            create: item,
        });
    }
    console.log('Wilayah seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
