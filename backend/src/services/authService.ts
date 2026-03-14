import { prisma } from '../prisma';
import { roleService } from './roleService';
import bcrypt from 'bcryptjs';

const DEFAULT_ADMIN_PERMISSIONS = {
    "Warga": ["Lihat", "Buat", "Ubah", "Hapus"],
    "Buku Kas / Transaksi": ["Lihat", "Buat", "Ubah", "Hapus"],
    "Iuran Warga": ["Lihat", "Buat", "Ubah", "Hapus"],
    "Surat / Cetak": ["Lihat", "Buat", "Ubah", "Hapus"],
    "Agenda": ["Lihat", "Buat", "Ubah", "Hapus"],
    "Aset": ["Lihat", "Buat", "Ubah", "Hapus"],
    "Notulensi": ["Lihat", "Buat", "Ubah", "Hapus"],
    "Setup / Pengaturan": ["Lihat", "Buat", "Ubah", "Hapus"]
};

export const authService = {
    async getUserByIdentifier(identifier: string) {
        return await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { kontak: identifier }
                ]
            },
            include: { 
                tenant: true,
                warga: true,
                role_entity: true
            }
        });
    },

    async register(tenantData: any, userData: any) {
        return await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: tenantData
            });

            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const user = await tx.user.create({
                data: {
                    ...userData,
                    password: hashedPassword,
                    tenant_id: tenant.id
                }
            });

            // Seed default roles for the new tenant within the transaction
            await roleService.seedDefaultRoles(tenant.id, tx);

            // Find the 'Admin' role we just created and link user to it
            const adminRole = await tx.role.findFirst({
                where: { tenant_id: tenant.id, name: 'Admin' }
            });

            if (adminRole) {
                await tx.user.update({
                    where: { id: user.id },
                    data: { 
                        role_id: adminRole.id,
                        permissions: (adminRole.permissions as any) // Copy for legacy support if needed, or just rely on role_entity
                    }
                });
            }

            // Seed default Jabatan Pengurus for standard scopes
            const defaultJabatan = JSON.stringify(['Ketua', 'Sekretaris', 'Bendahara']);
            await tx.pengaturan.createMany({
                data: [
                    { tenant_id: tenant.id, scope: 'RT', key: 'jabatan_pengurus', value: defaultJabatan },
                    { tenant_id: tenant.id, scope: 'PKK', key: 'jabatan_pengurus', value: defaultJabatan },
                    { tenant_id: tenant.id, scope: 'Dasa Wisma', key: 'jabatan_pengurus', value: defaultJabatan }
                ]
            });

            return { tenant, user };
        });
    },

    async getTenantById(id: string) {
        return await prisma.tenant.findUnique({
            where: { id }
        });
    },

    async updatePassword(userId: string, hashedPassword: string) {
        return await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });
    }
};
