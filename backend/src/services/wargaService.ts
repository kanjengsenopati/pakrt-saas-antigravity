import { prisma } from '../prisma';
import * as XLSX from 'xlsx';

const prepareWargaData = (data: any) => {
    const {
        id: _id,
        tenant: _t,
        anggota: _anggota,
        pengurus: _pengurus,
        surat_pengantars: _sp,
        pembayaran_iurans: _pi,
        kehadirans: _kh,
        ...clean
    } = data;
    
    // Sanitize NIK: remove non-numeric characters
    if (clean.nik) {
        clean.nik = clean.nik.replace(/\D/g, '');
        if (clean.nik.length < 5) throw new Error("NIK tidak valid (minimal 5 digit)");
    }
    
    return clean;
};

export const wargaService = {
    async getAll(tenantId: string, scope?: string, wargaId?: string, page: number = 1, limit: number = 20) {
        const where: any = { tenant_id: tenantId };
        if (scope) where.scope = scope;
        if (wargaId) where.id = wargaId;

        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            prisma.warga.findMany({
                where,
                include: { anggota: true },
                orderBy: { nama: 'asc' },
                take: limit,
                skip
            }),
            prisma.warga.count({ where })
        ]);

        return { items, total, page, limit };
    },

    async getById(id: string) {
        return await prisma.warga.findUnique({
            where: { id },
            include: {
                anggota: true
            }
        });
    },

    async create(data: any) {
        return await prisma.warga.create({
            data: prepareWargaData(data)
        });
    },

    async update(id: string, data: any) {
        return await prisma.warga.update({
            where: { id },
            data: prepareWargaData(data)
        });
    },

    async delete(id: string) {
        return await prisma.warga.delete({
            where: { id }
        });
    },

    async exportToXlsx(tenantId: string, scope?: string) {
        const where: any = { tenant_id: tenantId };
        if (scope) where.scope = scope;

        const items = await prisma.warga.findMany({
            where,
            orderBy: { nama: 'asc' }
        });

        const data = items.map(item => ({
            'NIK': item.nik,
            'Nama': item.nama,
            'Kontak': item.kontak || '',
            'Alamat': item.alamat,
            'Tempat Lahir': item.tempat_lahir || '',
            'Tanggal Lahir': item.tanggal_lahir || '',
            'Pendidikan': item.pendidikan || '',
            'Pekerjaan': item.pekerjaan || '',
            'Jenis Kelamin': item.jenis_kelamin || '',
            'Agama': item.agama || '',
            'Status Penduduk': item.status_penduduk || 'Tetap',
            'Status Rumah': item.status_rumah || 'Dihuni',
            'Status Domisili': item.status_domisili || 'Aktif',
            'Scope': item.scope || 'RT'
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Data Warga');

        return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    },

    async importFromXlsx(tenantId: string, buffer: Buffer) {
        const wb = XLSX.read(buffer, { type: 'buffer' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const mappedData = data.map(row => {
            const nik = String(row['NIK'] || '').replace(/\D/g, '');
            if (!nik || nik.length < 5) return null;

            return {
                tenant_id: tenantId,
                nik: nik,
                nama: String(row['Nama'] || ''),
                kontak: String(row['Kontak'] || ''),
                alamat: String(row['Alamat'] || ''),
                tempat_lahir: String(row['Tempat Lahir'] || ''),
                tanggal_lahir: String(row['Tanggal Lahir'] || ''),
                pendidikan: String(row['Pendidikan'] || ''),
                pekerjaan: String(row['Pekerjaan'] || ''),
                jenis_kelamin: String(row['Jenis Kelamin'] || ''),
                agama: String(row['Agama'] || ''),
                status_penduduk: String(row['Status Penduduk'] || 'Tetap'),
                status_rumah: String(row['Status Rumah'] || 'Dihuni'),
                status_domisili: String(row['Status Domisili'] || 'Aktif'),
                scope: String(row['Scope'] || 'RT')
            };
        }).filter(Boolean);

        if (mappedData.length === 0) {
            throw new Error('Tidak ada data valid untuk diimport (cek NIK dan Nama)');
        }

        // Use a loop or createMany. For consistency with tenant constraints, we'll do sequential creates if needed, 
        // but since we aren't in a transaction here and it's bulk import, createMany is better for performance.
        // Note: The prisma extension already handles tenant_id injection in createMany if context is set, 
        // but here we are passing it explicitly for safety.
        return await prisma.warga.createMany({
            data: mappedData as any,
            skipDuplicates: true
        });
    },

    async getImportTemplate() {
        const headers = [
            {
                'NIK': 'Masukkan 16 digit NIK (WAJIB)',
                'Nama': 'Masukkan Nama Lengkap (WAJIB)',
                'Kontak': 'Nomor WhatsApp/Telepon',
                'Alamat': 'Alamat Lengkap',
                'Tempat Lahir': 'Kota Kelahiran',
                'Tanggal Lahir': 'YYYY-MM-DD',
                'Pendidikan': 'Pendidikan Terakhir',
                'Pekerjaan': 'Pekerjaan Saat Ini',
                'Jenis Kelamin': 'Laki-laki / Perempuan',
                'Agama': 'Agama',
                'Status Penduduk': 'Tetap / Kontrak',
                'Status Rumah': 'Dihuni / Kosong',
                'Status Domisili': 'Aktif / Pindah / Meninggal Dunia',
                'Scope': 'RT / PKK / Dasa Wisma'
            }
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(headers);
        XLSX.utils.book_append_sheet(wb, ws, 'Template Import Warga');

        return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }
};
