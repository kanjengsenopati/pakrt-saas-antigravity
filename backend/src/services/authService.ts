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
        const user = await prisma.user.findFirst({
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

        if (user && user.tenant) {
            (user.tenant as any).location_detail = await this.resolveLocationDetail(user.tenant.id);
        }

        return user;
    },

    async resolveLocationDetail(tenantId: string) {
        try {
            const parts = tenantId.split('.');
            if (parts.length < 6) return null;

            const kecCode = parts.slice(0, 3).join('.');
            const kelCode = parts.slice(0, 4).join('.');
            const rw = parts[4];
            const rt = parts[5];

            const [kec, kel] = await Promise.all([
                prisma.wilayah.findUnique({ where: { id: kecCode } }),
                prisma.wilayah.findUnique({ where: { id: kelCode } })
            ]);

            const kecName = kec ? kec.name.toUpperCase() : 'KECAMATAN';
            const kelName = kel ? kel.name.toUpperCase() : 'KELURAHAN';

            return `RT ${rt} / RW ${rw} • KEL. ${kelName} • KEC. ${kecName}`;
        } catch (e) {
            return null;
        }
    },

    async register(tenantData: any, userData: any) {
        // Remove interactive transaction due to PgBouncer limits on Vercel/Supabase
        // Execute sequentially.
        const tenant = await prisma.tenant.create({
            data: {
                ...tenantData,
                subscription_status: 'TRIAL',
                subscription_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
                subscription_plan: 'PREMIUM' // Everyone starts with Premium Trial
            }
        });

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = await prisma.user.create({
            data: {
                ...userData,
                password: hashedPassword,
                tenant_id: tenant.id
            }
        });

        // Sync default roles for the new tenant sequentially
        await roleService.syncDefaultRoles(tenant.id, prisma);

        // Find the 'Admin' role we just created and link user to it
        const adminRole = await prisma.role.findFirst({
            where: { tenant_id: tenant.id, name: 'Admin' }
        });

        if (adminRole) {
            await prisma.user.update({
                where: { id: user.id },
                data: { 
                    role_id: adminRole.id,
                    permissions: (adminRole.permissions as any) // Copy for legacy support if needed, or just rely on role_entity
                }
            });
        }

        // Seed default Jabatan Pengurus for standard scopes
        const defaultJabatan = JSON.stringify(['Ketua', 'Sekretaris', 'Bendahara']);
        await prisma.pengaturan.createMany({
            data: [
                { tenant_id: tenant.id, scope: 'RT', key: 'jabatan_pengurus', value: defaultJabatan },
                { tenant_id: tenant.id, scope: 'PKK', key: 'jabatan_pengurus', value: defaultJabatan },
                { tenant_id: tenant.id, scope: 'Dasa Wisma', key: 'jabatan_pengurus', value: defaultJabatan }
            ]
        });

        return { tenant, user };
    },

    async getTenantById(id: string) {
        const tenant = await prisma.tenant.findUnique({
            where: { id }
        });
        
        if (tenant) {
            (tenant as any).location_detail = await this.resolveLocationDetail(tenant.id);
        }
        
        return tenant;
    },

    async updateSubscription(tenantId: string, data: { status: string; until: Date; plan: string }) {
        return await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                subscription_status: data.status,
                subscription_until: data.until,
                subscription_plan: data.plan
            }
        });
    },

    async updatePassword(userId: string, hashedPassword: string) {
        return await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });
    },

    async joinResident(tenantId: string, residentData: any) {
        const { email, password, name, ...wargaData } = residentData;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Look up the 'Warga' role for this tenant to assign by default
        const wargaRole = await prisma.role.findFirst({
            where: { tenant_id: tenantId, name: 'Warga' }
        });

        // Create Warga record with PENDING status
        const warga = await prisma.warga.create({
            data: {
                ...wargaData,
                nama: name,
                tenant_id: tenantId,
                verification_status: 'PENDING'
            }
        });

        // Create User with PENDING status, linked to warga and assigned the 'Warga' role
        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                tenant_id: tenantId,
                warga_id: warga.id,
                role: 'warga',
                role_id: wargaRole?.id ?? null,
                permissions: wargaRole ? (wargaRole.permissions as any) : {},
                verification_status: 'PENDING'
            }
        });

        return { warga, user };
    }
};
