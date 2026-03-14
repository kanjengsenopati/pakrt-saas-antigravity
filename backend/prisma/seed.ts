import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tenantId = '33.74.10.1011.100.100';

    console.log(`Seeding Tenant: ${tenantId}`);

    // Upsert Tenant
    const tenant = await prisma.tenant.upsert({
        where: { id: tenantId },
        update: {},
        create: {
            id: tenantId,
            name: 'RT 100 / RW 100 SendangMulyo',
            subdomain: 'rt100-sendangmulyo',
            config: {
                provinsi: 'Jawa Tengah',
                kota: 'Semarang',
                kecamatan: 'Tembalang',
                kelurahan: 'SendangMulyo',
                rw: '100',
                rt: '100'
            }
        }
    });

    console.log('Tenant upserted successfully:', tenant.name);

    // Seed 10 Warga for this tenant
    const wargasData = [
        {
            nama: 'SISWANTO',
            nik: '3374101011100001',
            kontak: '081234567890',
            alamat: 'BLOK N10/9',
            tempat_lahir: 'Semarang',
            tanggal_lahir: '15-05-1980',
            pendidikan: 'S1',
            pekerjaan: 'DOSEN',
            jenis_kelamin: 'Laki-laki',
            agama: 'Islam',
            status_penduduk: 'Tetap',
            status_rumah: 'Dihuni'
        },
        {
            nama: 'DIDIK WAHYU',
            nik: '3374101011100002',
            kontak: '081234567891',
            alamat: 'BLOK N10/10',
            tempat_lahir: 'Kendal',
            tanggal_lahir: '20-08-1982',
            pendidikan: 'S1',
            pekerjaan: 'PROFESIONAL',
            jenis_kelamin: 'Laki-laki',
            agama: 'Islam',
            status_penduduk: 'Tetap',
            status_rumah: 'Dihuni'
        },
        {
            nama: 'RIMAWAN YUSUF',
            nik: '3374101011100003',
            kontak: '081234567892',
            alamat: 'BLOK N10/11',
            tempat_lahir: 'Demak',
            tanggal_lahir: '10-11-1975',
            pendidikan: 'SMA',
            pekerjaan: 'PENGUSAHA',
            jenis_kelamin: 'Laki-laki',
            agama: 'Islam',
            status_penduduk: 'Kontrak',
            status_rumah: 'Dihuni'
        },
        {
            nama: 'EKO WIDIYANTO',
            nik: '3374101011100004',
            kontak: '081234567893',
            alamat: 'BLOK N10/5',
            tempat_lahir: 'Semarang',
            tanggal_lahir: '25-02-1990',
            pendidikan: 'S1',
            pekerjaan: 'PNS',
            jenis_kelamin: 'Laki-laki',
            agama: 'Islam',
            status_penduduk: 'Tetap',
            status_rumah: 'Dihuni'
        },
        {
            nama: 'WIKU RAJENDRA',
            nik: '3374101011100005',
            kontak: '081234567894',
            alamat: 'BLOK N5/12',
            tempat_lahir: 'Salatiga',
            tanggal_lahir: '30-06-1985',
            pendidikan: 'S1',
            pekerjaan: 'KARYAWAN BUMN',
            jenis_kelamin: 'Laki-laki',
            agama: 'Kristen',
            status_penduduk: 'Tetap',
            status_rumah: 'Kosong'
        },
        {
            nama: 'DWI HERI KARTIKO',
            nik: '3374101011100006',
            kontak: '081234567895',
            alamat: 'BLOK N5/22',
            tempat_lahir: 'Semarang',
            tanggal_lahir: '12-12-1988',
            pendidikan: 'SMA',
            pekerjaan: 'KARYAWAN BUMN',
            jenis_kelamin: 'Laki-laki',
            agama: 'Islam',
            status_penduduk: 'Tetap',
            status_rumah: 'Dihuni'
        },
        {
            nama: 'HANDY TRI WALUYO',
            nik: '3374101011100007',
            kontak: '081234567896',
            alamat: 'BLOK N6/3',
            tempat_lahir: 'Surakarta',
            tanggal_lahir: '21-06-1961',
            pendidikan: 'S1',
            pekerjaan: 'KARYAWAN SWASTA',
            jenis_kelamin: 'Laki-laki',
            agama: 'Islam',
            status_penduduk: 'Tetap',
            status_rumah: 'Dihuni'
        },
        {
            nama: 'JUNDI SETIYAWAN',
            nik: '3374101011100008',
            kontak: '081234567897',
            alamat: 'BLOK N5/7',
            tempat_lahir: 'Surakarta',
            tanggal_lahir: '01-10-1963',
            pendidikan: 'SMA',
            pekerjaan: 'PROFESIONAL',
            jenis_kelamin: 'Laki-laki',
            agama: 'Islam',
            status_penduduk: 'Kontrak',
            status_rumah: 'Kosong'
        },
        {
            nama: 'ROY ROBY',
            nik: '3374101011100009',
            kontak: '081234567898',
            alamat: 'BLOK N6/8',
            tempat_lahir: 'Surakarta',
            tanggal_lahir: '01-10-1987',
            pendidikan: 'S1',
            pekerjaan: 'POLRI',
            jenis_kelamin: 'Laki-laki',
            agama: 'Islam',
            status_penduduk: 'Tetap',
            status_rumah: 'Dihuni'
        },
        {
            nama: 'AVIN GALIH',
            nik: '3374101011100010',
            kontak: '081234567899',
            alamat: 'BLOK 6/9',
            tempat_lahir: 'Surakarta',
            tanggal_lahir: '25-12-1994',
            pendidikan: 'S1',
            pekerjaan: 'KARYAWAN BUMN',
            jenis_kelamin: 'Laki-laki',
            agama: 'Islam',
            status_penduduk: 'Tetap',
            status_rumah: 'Dihuni'
        }
    ];
    console.log(`Seeding ${wargasData.length} Warga records...`);

    const MOCK_KK_BASE64 = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iNTgwIiBoZWlnaHQ9IjM4MCIgZmlsbD0id2hpdGUiIHN0cm9rZT0iIzAwNzJmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzAwNzJmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+T0ZGSUNJQUwgS0FSVFUgS0VMVUFSR0EgKE1PQ0spPC90ZXh0Pjwvc3ZnPg==`;

    for (const wargaData of wargasData) {
        // Destructure only valid Warga fields (exclude pekerjaan which is on AnggotaKeluarga)
        const { pekerjaan: _pekerjaan, ...wargaFields } = wargaData;
        const warga = await prisma.warga.upsert({
            where: { nik: wargaData.nik },
            update: {
                ...wargaFields,
                tenant_id: tenantId,
                scope: 'RT',
                url_kk: MOCK_KK_BASE64
            },
            create: {
                ...wargaFields,
                tenant_id: tenantId,
                scope: 'RT',
                url_kk: MOCK_KK_BASE64
            }
        });
        console.log(`Upserted Warga: ${warga.nama} (${warga.nik})`);

        // Generate NIK variations for Istri and Anak based on Head NIK
        const prefixNIK = wargaData.nik.substring(0, 12);
        const suffixNIK = wargaData.nik.substring(12); // e.g., '0001'
        const baseId = parseInt(suffixNIK, 10);

        await prisma.anggotaKeluarga.upsert({
            where: { nik: `${prefixNIK}${(baseId + 1000).toString().padStart(4, '0')}` },
            update: {},
            create: {
                tenant_id: tenantId,
                warga_id: warga.id,
                nik: `${prefixNIK}${(baseId + 1000).toString().padStart(4, '0')}`,
                nama: `Istri ${warga.nama}`,
                hubungan: 'Istri',
                tempat_lahir: warga.tempat_lahir,
                tanggal_lahir: '1985-01-01',
                pendidikan: 'SMA',
                pekerjaan: 'Ibu Rumah Tangga'
            }
        });

        await prisma.anggotaKeluarga.upsert({
            where: { nik: `${prefixNIK}${(baseId + 2000).toString().padStart(4, '0')}` },
            update: {},
            create: {
                tenant_id: tenantId,
                warga_id: warga.id,
                nik: `${prefixNIK}${(baseId + 2000).toString().padStart(4, '0')}`,
                nama: `Anak ${warga.nama}`,
                hubungan: 'Anak',
                tempat_lahir: warga.tempat_lahir,
                tanggal_lahir: '2010-06-15',
                pendidikan: 'SMP',
                pekerjaan: 'Pelajar'
            }
        });
    }

    // Seed Pengaturan
    await prisma.pengaturan.createMany({
        data: [
            { tenant_id: tenantId, scope: 'RT', key: 'jabatan_pengurus', value: ['Ketua RT', 'Sekretaris RT', 'Bendahara RT', 'Seksi Pembangunan', 'Seksi Keamanan', 'Seksi Kebersihan'] },
            { tenant_id: tenantId, scope: 'RT', key: 'periode_pengurus', value: ['2024-2027', '2021-2024'] }
        ],
        skipDuplicates: true
    });

    // Quick fix for Pengurus link: Fetch actual warga IDs
    const eko = await prisma.warga.findUnique({ where: { nik: '3374101011100004' } });
    const handy = await prisma.warga.findUnique({ where: { nik: '3374101011100007' } });
    const dwi = await prisma.warga.findUnique({ where: { nik: '3374101011100006' } });

    if (eko) {
        const existing = await prisma.pengurus.findFirst({ where: { tenant_id: tenantId, scope: 'RT', warga_id: eko.id, jabatan: 'Ketua RT', periode: '2024-2027' } });
        if (!existing) await prisma.pengurus.create({ data: { tenant_id: tenantId, scope: 'RT', warga_id: eko.id, jabatan: 'Ketua RT', periode: '2024-2027' } });
    }
    if (handy) {
        const existing = await prisma.pengurus.findFirst({ where: { tenant_id: tenantId, scope: 'RT', warga_id: handy.id, jabatan: 'Bendahara RT', periode: '2024-2027' } });
        if (!existing) await prisma.pengurus.create({ data: { tenant_id: tenantId, scope: 'RT', warga_id: handy.id, jabatan: 'Bendahara RT', periode: '2024-2027' } });
    }
    if (dwi) {
        const existing = await prisma.pengurus.findFirst({ where: { tenant_id: tenantId, scope: 'RT', warga_id: dwi.id, jabatan: 'Sekretaris RT', periode: '2024-2027' } });
        if (!existing) await prisma.pengurus.create({ data: { tenant_id: tenantId, scope: 'RT', warga_id: dwi.id, jabatan: 'Sekretaris RT', periode: '2024-2027' } });
    }

    // --- Seed Demo Users (Credentials) ---
    console.log('Seeding Demo Users...');
    const demoUsers = [
        {
            email: 'ketuart@pakrt.id',
            name: 'EKO WIDIYANTO',
            role: 'admin',
            password: 'password123',
            kontak: '081234567893',
            tenant_id: tenantId,
            permissions: { 'all': ['manage'] }
        },
        {
            email: 'sekretaris@pakrt.id',
            name: 'DWI HERI KARTIKO',
            role: 'staff',
            password: 'password123',
            kontak: '081234567895',
            tenant_id: tenantId,
            permissions: {
                'Surat / Cetak': ['Lihat', 'Buat', 'Ubah', 'Hapus'],
                'Agenda': ['Lihat', 'Buat', 'Ubah', 'Hapus'],
                'Warga': ['Lihat', 'Buat', 'Ubah', 'Hapus'],
                'Notulensi': ['Lihat', 'Buat', 'Ubah', 'Hapus'],
                'Pengaturan Sistem': ['Lihat']
            }
        },
        {
            email: 'bendahara@pakrt.id',
            name: 'HANDY TRI WALUYO',
            role: 'staff',
            password: 'password123',
            kontak: '081234567896',
            tenant_id: tenantId,
            permissions: {
                'Buku Kas / Transaksi': ['Lihat', 'Buat', 'Ubah', 'Hapus'],
                'Iuran Warga': ['Lihat', 'Buat', 'Ubah', 'Hapus'],
                'Aset': ['Lihat', 'Buat', 'Ubah', 'Hapus']
            }
        },
        {
            email: 'warga@pakrt.id',
            name: 'SISWANTO',
            role: 'warga',
            password: 'password123',
            kontak: '081234567890',
            tenant_id: tenantId,
            warga_id: (await prisma.warga.findUnique({ where: { nik: '3374101011100001' } }))?.id,
            scope: 'RT',
            permissions: {
                'Warga': ['Lihat'],
                'Iuran Warga': ['Lihat'],
                'Surat / Cetak': ['Lihat', 'Buat'],
                'Jadwal Ronda': ['Lihat'],
                'Agenda': ['Lihat'],
                'Aset': ['Lihat']
            }
        }
    ];

    for (const u of demoUsers) {
        await prisma.user.upsert({
            where: { email: u.email },
            update: u,
            create: u
        });
    }

    // Seed Surat Pengantar (only if not exists)
    if (eko) {
        const existingSurat1 = await prisma.suratPengantar.findFirst({ where: { tenant_id: tenantId, warga_id: eko.id, jenis_surat: 'Suket Domisili' } });
        if (!existingSurat1) {
            await prisma.suratPengantar.create({
                data: {
                    tenant_id: tenantId,
                    scope: 'RT',
                    warga_id: eko.id,
                    jenis_surat: 'Suket Domisili',
                    keperluan: 'Pembuatan KTP Baru',
                    tanggal: new Date().toISOString().split('T')[0],
                    status: 'selesai',
                    nomor_surat: '001/RT100/III/2026'
                }
            });
        }
    }

    if (handy) {
        const existingSurat2 = await prisma.suratPengantar.findFirst({ where: { tenant_id: tenantId, warga_id: handy.id, jenis_surat: 'Suket Usaha' } });
        if (!existingSurat2) {
            await prisma.suratPengantar.create({
                data: {
                    tenant_id: tenantId,
                    scope: 'RT',
                    warga_id: handy.id,
                    jenis_surat: 'Suket Usaha',
                    keperluan: 'Kredit Bank',
                    tanggal: new Date().toISOString().split('T')[0],
                    status: 'proses'
                }
            });
        }
    }

    // Seed Jadwal Ronda (only if not exists)
    if (eko && handy && dwi) {
        const rondaDate = new Date().toISOString().split('T')[0];
        const existingRonda = await prisma.jadwalRonda.findFirst({ where: { tenant_id: tenantId, scope: 'RT', tanggal: rondaDate, regu: 'Rajawali' } });
        if (!existingRonda) {
            await prisma.jadwalRonda.create({
                data: {
                    tenant_id: tenantId,
                    scope: 'RT',
                    tanggal: rondaDate,
                    regu: 'Rajawali',
                    warga_ids: [eko.id, handy.id],
                    petugas_konsumsi: [dwi.id],
                    kehadiran_warga: [eko.id]
                }
            });
        }
    }
    // Clear existing data for these modules to ensure a clean slate
    console.log('Clearing existing Notulensi, Kehadiran, Agenda, and Aset records...');
    await prisma.kehadiran.deleteMany({ where: { tenant_id: tenantId } });
    await prisma.notulensi.deleteMany({ where: { tenant_id: tenantId } });
    await prisma.agenda.deleteMany({ where: { tenant_id: tenantId } });
    await prisma.aset.deleteMany({ where: { tenant_id: tenantId } });

    console.log('Seeding comprehensive Agenda, Aset, and Notulensi records...');

    // --- Comprehensive Agenda Seeding ---
    if (eko && handy && dwi) {
        await prisma.agenda.createMany({
            data: [
                {
                    tenant_id: tenantId,
                    scope: 'RT',
                    judul: 'Kerja Bakti Rutin Bulanan',
                    tanggal: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
                    deskripsi: 'Membersihkan selokan dan area taman',
                    butuh_pendanaan: true,
                    nominal_biaya: 500000,
                    sumber_dana: 'Kas',
                    peserta_ids: [eko.id, handy.id, dwi.id],
                    is_terlaksana: false
                },
                {
                    tenant_id: tenantId,
                    scope: 'RT',
                    judul: 'Rapat Koordinasi Pengurus RT',
                    tanggal: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0],
                    deskripsi: 'Membahas persiapan lomba 17 Agustus',
                    butuh_pendanaan: false,
                    peserta_ids: [eko.id, handy.id, dwi.id],
                    is_terlaksana: true,
                    laporan_kegiatan: 'Rapat berjalan lancar, panitia 17an sudah terbentuk.'
                },
                {
                    tenant_id: tenantId,
                    scope: 'RT',
                    judul: 'Posyandu Balita & Lansia',
                    tanggal: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0],
                    deskripsi: 'Pemeriksaan kesehatan rutin untuk balita dan lansia bersama Puskesmas.',
                    butuh_pendanaan: true,
                    nominal_biaya: 250000,
                    sumber_dana: 'Kas',
                    peserta_ids: [dwi.id],
                    is_terlaksana: false
                }
            ]
        });
    }

    // --- Comprehensive Aset RT Seeding ---
    await prisma.aset.createMany({
        data: [
            {
                tenant_id: tenantId,
                scope: 'RT',
                nama_barang: 'Tenda Hijau Besar 4x6',
                jumlah: 2,
                kondisi: 'Baik',
                tanggal_beli: '2023-01-15',
                harga_beli: 4500000,
                vendor: 'Toko Tenda Terang',
                status_pinjam: 'tersedia'
            },
            {
                tenant_id: tenantId,
                scope: 'RT',
                nama_barang: 'Sound System Portable (Baretone)',
                jumlah: 1,
                kondisi: 'Baik',
                tanggal_beli: '2023-05-20',
                harga_beli: 2500000,
                vendor: 'Sinar Mas Elektronik',
                status_pinjam: 'tersedia'
            },
            {
                tenant_id: tenantId,
                scope: 'RT',
                nama_barang: 'Mesin Potong Rumput',
                jumlah: 1,
                kondisi: 'Rusak Ringan',
                tanggal_beli: '2022-11-10',
                harga_beli: 1200000,
                vendor: 'Depo Bangunan',
                status_pinjam: 'tersedia'
            }
        ]
    });

    if (eko) {
        await prisma.aset.create({
            data: {
                tenant_id: tenantId,
                scope: 'RT',
                nama_barang: 'Kursi Plastik Merah',
                jumlah: 50,
                kondisi: 'Baik',
                tanggal_beli: '2023-01-15',
                harga_beli: 2500000,
                vendor: 'Toko Plastik Jaya',
                status_pinjam: 'dipinjam',
                peminjam_id: eko.id,
                tanggal_pinjam: new Date().toISOString().split('T')[0]
            }
        });
    }

    // --- Comprehensive Notulensi Seeding ---
    if (eko && handy && dwi) {
        const notulen1 = await prisma.notulensi.create({
            data: {
                tenant_id: tenantId,
                scope: 'RT',
                judul: 'Rapat Persiapan 17 Agustus',
                tanggal: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString().split('T')[0],
                tuan_rumah_id: eko.id,
                tuan_rumah: eko.nama,
                lokasi: eko.alamat,
                konten: '1. Pembentukan panitia HUT RI ke-79.\n2. Pembahasan anggaran lomba (estimasi Rp 5.000.000).\n3. Penentuan jenis perlombaan anak dan dewasa.\n\nHasil: Panitia inti terbentuk, proposal akan diajukan ke warga minggu depan.'
            }
        });

        // Add Kehadiran for Notulen 1
        await prisma.kehadiran.createMany({
            data: [
                { tenant_id: tenantId, notulensi_id: notulen1.id, warga_id: eko.id, status: 'hadir' },
                { tenant_id: tenantId, notulensi_id: notulen1.id, warga_id: handy.id, status: 'hadir' },
                { tenant_id: tenantId, notulensi_id: notulen1.id, warga_id: dwi.id, status: 'izin' }
            ]
        });

        const notulen2 = await prisma.notulensi.create({
            data: {
                tenant_id: tenantId,
                scope: 'RT',
                judul: 'Evaluasi Keamanan & Ronda Malam',
                tanggal: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
                tuan_rumah_id: handy.id,
                tuan_rumah: handy.nama,
                lokasi: 'Pos Kamling RT 100',
                konten: '1. Masih ada warga yang sering mangkir jadwal ronda.\n2. Wacana penambahan CCTV di gang utama.\n3. Iuran keamanan bulan ini terkumpul 85%.\n\nHasil: Denda bagi yang mangkir ronda disepakati Rp 20.000. Pengadaan CCTV akan menggunakan kas RT bulan depan.'
            }
        });

        // Add Kehadiran for Notulen 2
        await prisma.kehadiran.createMany({
            data: [
                { tenant_id: tenantId, notulensi_id: notulen2.id, warga_id: eko.id, status: 'hadir' },
                { tenant_id: tenantId, notulensi_id: notulen2.id, warga_id: handy.id, status: 'hadir' },
                { tenant_id: tenantId, notulensi_id: notulen2.id, warga_id: dwi.id, status: 'hadir' }
            ]
        });
    }

    console.log('Seeding completed successfully.');
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
