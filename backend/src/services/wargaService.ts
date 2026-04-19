import { prisma } from '../prisma';
import { dateUtils } from '../utils/date';
import bcrypt from 'bcryptjs';

const createDefaultUser = async (warga: any, tx: any = prisma) => {
    // Determine placeholder email: NIK + @pakrt.id
    const email = `${warga.nik}@pakrt.id`;
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Find custom 'Warga' role for this tenant
    const wargaRole = await tx.role.findFirst({
        where: { tenant_id: warga.tenant_id, name: 'Warga' }
    });

    return await tx.user.upsert({
        where: { email: email },
        update: {
            warga_id: warga.id,
            name: warga.nama,
            kontak: warga.kontak,
            role_id: wargaRole?.id || null,
            permissions: wargaRole?.permissions || {}
        },
        create: {
            tenant_id: warga.tenant_id,
            warga_id: warga.id,
            name: warga.nama,
            email: email,
            kontak: warga.kontak,
            password: hashedPassword,
            role: 'warga',
            role_id: wargaRole?.id || null,
            permissions: wargaRole?.permissions || {},
            verification_status: warga.verification_status || 'VERIFIED'
        }
    });
};

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
    
    if (clean.tanggal_lahir) {
        clean.tanggal_lahir = dateUtils.normalize(clean.tanggal_lahir);
    }
    if (clean.tanggal_meninggal) {
        clean.tanggal_meninggal = dateUtils.normalize(clean.tanggal_meninggal);
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
        const warga = await prisma.warga.create({
            data: prepareWargaData(data)
        });

        // Automatically create User account for this Warga
        try {
            await createDefaultUser(warga);
        } catch (error) {
            console.error(`Failed to create auto-user for Warga ${warga.nik}:`, error);
        }

        return warga;
    },

    async update(id: string, data: any) {
        return await prisma.$transaction(async (tx) => {
            const currentWarga = await tx.warga.findUnique({
                where: { id },
                include: { user: true }
            });

            if (!currentWarga) {
                throw new Error('Warga tidak ditemukan');
            }

    const isNIKChanging = data.nik && String(data.nik).replace(/\D/g, '') !== currentWarga.nik;
            
            if (isNIKChanging) {
                const cleanNIK = String(data.nik).replace(/\D/g, '');
                const existingWarga = await tx.warga.findUnique({
                    where: {
                        tenant_id_nik: {
                            tenant_id: currentWarga.tenant_id,
                            nik: cleanNIK
                        }
                    }
                });
                
                if (existingWarga && existingWarga.id !== id) {
                    throw new Error('NIK sudah terdaftar di rt/rw atau perumahan ini.');
                }
            }
            
            const processedData = prepareWargaData(data);

            const updatedWarga = await tx.warga.update({
                where: { id },
                data: processedData,
            });

            // True Sync: Update the associated User account if critical fields changed
            // Ensure we only update if the user exists and data is provided
            if (currentWarga.user) {
                const userUpdateData: any = {};
                if (data.nama) userUpdateData.name = data.nama;
                if (data.email) userUpdateData.email = data.email;
                if (data.kontak) userUpdateData.kontak = data.kontak;

                if (Object.keys(userUpdateData).length > 0) {
                    await tx.user.update({
                        where: { id: currentWarga.user.id },
                        data: userUpdateData
                    });
                }
            }

            return updatedWarga;
        });
    },

    async delete(id: string) {
        return await prisma.$transaction(async (tx) => {
            const warga = await tx.warga.findUnique({
                where: { id },
                include: { user: true }
            });

            if (warga?.user) {
                await tx.user.delete({ where: { id: warga.user.id } });
            }

            return await tx.warga.delete({
                where: { id },
            });
        });
    },

    async exportToXlsx(tenantId: string, scope?: string) {
        const where: any = { tenant_id: tenantId };
        if (scope) where.scope = scope;

        const items = await prisma.warga.findMany({
            where,
            orderBy: { nama: 'asc' }
        });

        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Data Warga');

        const headers = [
            'NIK', 'Nama', 'Kontak', 'Alamat', 'Tempat Lahir', 'Tanggal Lahir',
            'Pendidikan', 'Pekerjaan', 'Jenis Kelamin', 'Agama',
            'Status Penduduk', 'Status Rumah', 'Status Domisili', 'Scope'
        ];

        sheet.addRow(headers);

        // Styling headers
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        const dropdowns = {
            'Jenis Kelamin': ['Laki-laki', 'Perempuan'],
            'Agama': ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu'],
            'Status Penduduk': ['Tetap', 'Kontrak'],
            'Status Rumah': ['Dihuni', 'Kosong'],
            'Status Domisili': ['Aktif', 'Pindah', 'Meninggal Dunia'],
            'Scope': ['RT', 'PKK', 'Dasa Wisma'],
            'Pendidikan': ['SD', 'SMP / Sederajat', 'SMA / Sederajat', 'Diploma', 'S1', 'S2', 'S3'],
            'Pekerjaan': [
                'Belum/Tidak Bekerja', 'Mengurus Rumah Tangga', 'Pelajar/Mahasiswa', 'Pensiunan', 
                'PNS', 'TNI', 'POLRI', 'Karyawan Swasta', 'Karyawan BUMN', 'Wiraswasta', 
                'Buruh Harian Lepas', 'Guru', 'Dosen', 'Dokter', 'Perawat', 'Sopir', 
                'Pedagang', 'Arsitek', 'Pengacara', 'Seniman'
            ]
        };

        items.forEach((item) => {
            sheet.addRow([
                item.nik,
                item.nama,
                item.kontak || '',
                item.alamat,
                item.tempat_lahir || '',
                item.tanggal_lahir || '',
                item.pendidikan || '',
                item.pekerjaan || '',
                item.jenis_kelamin || '',
                item.agama || '',
                item.status_penduduk || 'Tetap',
                item.status_rumah || 'Dihuni',
                item.status_domisili || 'Aktif',
                item.scope || 'RT'
            ]);
        });

        // Apply formatting and validations
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;

            // NIK as Numeric (Cell A)
            const nikCell = row.getCell(1);
            if (nikCell.value) {
                nikCell.numFmt = '0'; // Numeric no decimal
                nikCell.value = Number(nikCell.value);
            }

            // Kontak as String (Cell C)
            row.getCell(3).numFmt = '@';

            // Tanggal Lahir (Cell F) - Expected format DD-MM-YYYY if user inputs text, but Excel can handle dates
            // For now, we keep it as text for compatibility but add validation hint if needed.

            headers.forEach((header, colIdx) => {
                const options = (dropdowns as any)[header];
                if (options) {
                    row.getCell(colIdx + 1).dataValidation = {
                        type: 'list',
                        allowBlank: true,
                        formulae: [`"${options.join(',')}"`]
                    };
                }
            });
        });

        sheet.columns.forEach(col => col.width = 20);

        return await workbook.xlsx.writeBuffer();
    },

    async importFromXlsx(tenantId: string, buffer: Buffer) {
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer as any);
        const sheet = workbook.getWorksheet(1);
        
        if (!sheet) throw new Error('Sheet tidak ditemukan');

        const data: any[] = [];
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const rowData: any = {};
            const headers = [
                'NIK', 'Nama', 'Kontak', 'Alamat', 'Tempat Lahir', 'Tanggal Lahir',
                'Pendidikan', 'Pekerjaan', 'Jenis Kelamin', 'Agama',
                'Status Penduduk', 'Status Rumah', 'Status Domisili', 'Scope'
            ];

            headers.forEach((header, idx) => {
                let value = row.getCell(idx + 1).value;
                // Handle rich text or objects
                if (value && typeof value === 'object' && 'result' in value) value = (value as any).result;
                if (value && typeof value === 'object' && 'text' in value) value = (value as any).text;
                rowData[header] = value;
            });
            data.push(rowData);
        });

        const mappedData = data.map(row => {
            const nik = String(row['NIK'] || '').replace(/\D/g, '');
            if (!nik || nik.length < 5) return null;

            // Handle Tanggal Lahir formatting if needed
            const tanggalLahir = dateUtils.normalize(String(row['Tanggal Lahir'] || ''));

            return {
                tenant_id: tenantId,
                nik: nik,
                nama: String(row['Nama'] || ''),
                kontak: String(row['Kontak'] || ''),
                alamat: String(row['Alamat'] || ''),
                tempat_lahir: String(row['Tempat Lahir'] || ''),
                tanggal_lahir: tanggalLahir,
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

        const result = await prisma.warga.createMany({
            data: mappedData as any,
            skipDuplicates: true
        });

        // Bulk creation of users for imported citizens
        try {
            const importedWargas = await prisma.warga.findMany({
                where: {
                    tenant_id: tenantId,
                    nik: { in: mappedData.map((d: any) => d.nik) },
                    user: null
                }
            });

            for (const warga of importedWargas) {
                await createDefaultUser(warga);
            }
        } catch (error) {
            console.error('Failed to create users for imported citizens:', error);
        }

        return result;
    },

    async getImportTemplate() {
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Template Import Warga');

        const headers = [
            'NIK', 'Nama', 'Kontak', 'Alamat', 'Tempat Lahir', 'Tanggal Lahir',
            'Pendidikan', 'Pekerjaan', 'Jenis Kelamin', 'Agama',
            'Status Penduduk', 'Status Rumah', 'Status Domisili', 'Scope'
        ];

        sheet.addRow(headers);
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        const sampleRow = [
            '3374101011100001', 'BUDI SANTOSO', '081234567890', 'Jln. Contoh No. 123', 'Semarang', '15-05-1990',
            'S1', 'Wiraswasta', 'Laki-laki', 'Islam', 'Tetap', 'Dihuni', 'Aktif', 'RT'
        ];
        sheet.addRow(sampleRow);

        const dropdowns = {
            'Jenis Kelamin': ['Laki-laki', 'Perempuan'],
            'Agama': ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu'],
            'Status Penduduk': ['Tetap', 'Kontrak'],
            'Status Rumah': ['Dihuni', 'Kosong'],
            'Status Domisili': ['Aktif', 'Pindah', 'Meninggal Dunia'],
            'Scope': ['RT', 'PKK', 'Dasa Wisma'],
            'Pendidikan': ['SD', 'SMP / Sederajat', 'SMA / Sederajat', 'Diploma', 'S1', 'S2', 'S3'],
            'Pekerjaan': [
                'Belum/Tidak Bekerja', 'Mengurus Rumah Tangga', 'Pelajar/Mahasiswa', 'Pensiunan', 
                'PNS', 'TNI', 'POLRI', 'Karyawan Swasta', 'Karyawan BUMN', 'Wiraswasta', 
                'Buruh Harian Lepas', 'Guru', 'Dosen', 'Dokter', 'Perawat', 'Sopir', 
                'Pedagang', 'Arsitek', 'Pengacara', 'Seniman'
            ]
        };

        // Apply validations for 1000 rows
        for (let i = 2; i <= 1000; i++) {
            const row = sheet.getRow(i);
            
            // NIK Formatting (A)
            row.getCell(1).numFmt = '0';
            
            // Kontak Formatting (C)
            row.getCell(3).numFmt = '@';

            // Date hint/formatting in col 6 (Tanggal Lahir)
            row.getCell(6).numFmt = 'dd-mm-yyyy';

            headers.forEach((header, colIdx) => {
                const options = (dropdowns as any)[header];
                if (options) {
                    row.getCell(colIdx + 1).dataValidation = {
                        type: 'list',
                        allowBlank: true,
                        formulae: [`"${options.join(',')}"`],
                        showErrorMessage: true,
                        errorTitle: 'Pilihan Tidak Valid',
                        error: 'Silakan pilih dari daftar yang tersedia.'
                    };
                }
            });
        }

        sheet.columns.forEach(col => col.width = 20);

        return await workbook.xlsx.writeBuffer();
    },

    async getPending(tenantId: string) {
        return await prisma.warga.findMany({
            where: {
                tenant_id: tenantId,
                verification_status: 'PENDING'
            },
            include: {
                user: true
            },
            orderBy: { nama: 'asc' }
        });
    },

    async updateStatus(id: string, status: 'VERIFIED' | 'REJECTED') {
        const warga = await prisma.warga.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!warga) throw new Error('Warga tidak ditemukan');

        // Update Warga status
        await prisma.warga.update({
            where: { id },
            data: { verification_status: status }
        });

        // Update User if exists
        if (warga.user) {
            const updateData: any = { verification_status: status };

            // On VERIFIED, ensure the 'Warga' role is linked if not yet assigned
            if (status === 'VERIFIED' && !warga.user.role_id) {
                const wargaRole = await prisma.role.findFirst({
                    where: { tenant_id: warga.tenant_id, name: 'Warga' }
                });
                if (wargaRole) {
                    updateData.role_id = wargaRole.id;
                    updateData.permissions = wargaRole.permissions as any;
                }
            }

            await prisma.user.update({
                where: { id: warga.user.id },
                data: updateData
            });
        }

        return { success: true };
    }
};
