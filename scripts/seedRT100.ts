import { PakrtDatabase } from './src/database/db.js';
import * as dotenv from 'dotenv';
dotenv.config();

const db = new PakrtDatabase();

const TENANT_ID = '33.74.10.1011.100.100';

const seedData = async () => {
    try {
        console.log('Seeding Database...');

        await db.tenants.put({
            id: TENANT_ID,
            name: 'RT 100 RW 100 Sendangmulyo',
            subdomain: 'rt100rw100',
            config: {}
        });

        console.log('Tenant Created:', TENANT_ID);

        await db.users.put({
            id: 'admin-' + TENANT_ID,
            tenant_id: TENANT_ID,
            role: 'admin',
            name: 'Admin RT 100',
            email: 'rt100rw100@pakrt.app'
        });

        console.log('Admin User Created');

        await db.pengaturan.bulkPut([
            { id: '1-' + TENANT_ID, tenant_id: TENANT_ID, key: 'nama_wilayah', value: 'RT 100 RW 100 Sendangmulyo' },
            { id: '2-' + TENANT_ID, tenant_id: TENANT_ID, key: 'alamat_sekretariat', value: 'Balai Warga RT 100 RW 100, Kel. Sendangmulyo, Kec. Tembalang, Kota Semarang, Jawa Tengah' },
            { id: '3-' + TENANT_ID, tenant_id: TENANT_ID, key: 'kategori_pemasukan', value: JSON.stringify(['Iuran Warga', 'Donasi', 'Bantuan Tunai']) },
            { id: '4-' + TENANT_ID, tenant_id: TENANT_ID, key: 'iuran_per_bulan', value: '150000' }
        ]);

        console.log('Pengaturan Seeded');

        const wargaData = [];
        for (let i = 1; i <= 10; i++) {
            const isBlok5 = i <= 5;
            wargaData.push({
                id: 'warga-' + i + '-' + TENANT_ID,
                tenant_id: TENANT_ID,
                scope: 'RT' as const,
                nik: '337410101100' + i.toString().padStart(4, '0'),
                nama: `Bapak Warga Teladan ${i}`,
                kontak: `0812345678${i.toString().padStart(2, '0')}`,
                alamat: isBlok5 ? `Perumahan Blok N 5, No. ${i}` : (i <= 8 ? `Perumahan Blok N 6, No. ${i}` : `Perumahan Blok N 10, No. ${i}`)
            });
        }

        await db.warga.bulkPut(wargaData);
        console.log('10 Warga Registered in Blok N (5, 6, 10)!');

        console.log('Seeding Complete! You can login with email: rt100rw100@pakrt.app');
        process.exit(0);

    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedData();
