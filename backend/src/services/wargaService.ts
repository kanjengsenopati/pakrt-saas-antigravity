import { prisma } from '../prisma';

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
    }
};
