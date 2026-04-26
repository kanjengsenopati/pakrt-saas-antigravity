import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';
import { requirePermission } from '../middleware/auth';
import { pembayaranIuranService } from '../services/pembayaranIuranService';

export default async function statsRoutes(fastify: FastifyInstance) {
    fastify.get('/dashboard', { preHandler: [requirePermission('Dashboard', 'Lihat')] }, async (request, reply) => {
        const user = (request as any).user;
        const tenantId = user.tenant_id;
        const scope = (request.query as any).scope || 'RT';

        try {
            const [totalWarga, totalAset, totalSuratPending, iuranPending] = await Promise.all([
                prisma.warga.count({ where: { tenant_id: tenantId, status_domisili: 'Aktif' } }),
                prisma.aset.count({ where: { tenant_id: tenantId } }),
                prisma.suratPengantar.count({ where: { tenant_id: tenantId, status: 'proses' } }),
                prisma.pembayaranIuran.count({ where: { tenant_id: tenantId, status: 'PENDING' } })
            ]);

            // Simple financial trend for the last 6 months
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            
            const financialTrend = await prisma.keuangan.groupBy({
                by: ['tipe', 'tanggal'],
                where: {
                    tenant_id: tenantId,
                    tanggal: { gte: sixMonthsAgo.toISOString().split('T')[0] }
                },
                _sum: { nominal: true }
            });

            return {
                totalWarga,
                totalAset,
                totalSuratPending,
                iuranPending,
                financialTrend
            };
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch dashboard stats' });
        }
    });

    fastify.get('/warga-personal', async (request, reply) => {
        const user = (request as any).user;
        if (!user.warga_id) return { warga: null, iuranHeader: [], surat: [] };

        const [warga, iuranHeader, surat, financials, iuranPendingCount, suratProsesCount] = await Promise.all([
            prisma.warga.findUnique({ 
                where: { id: user.warga_id },
                include: { anggota: true }
            }),
            prisma.pembayaranIuran.findMany({
                where: { warga_id: user.warga_id },
                orderBy: { tanggal_bayar: 'desc' },
                take: 5
            }),
            prisma.suratPengantar.findMany({
                where: { warga_id: user.warga_id },
                orderBy: { tanggal: 'desc' },
                take: 5
            }),
            prisma.keuangan.groupBy({
                by: ['tipe'],
                where: { tenant_id: user.tenant_id },
                _sum: { nominal: true }
            }),
            prisma.pembayaranIuran.count({
                where: { warga_id: user.warga_id, status: 'PENDING' }
            }),
            prisma.suratPengantar.count({
                where: { warga_id: user.warga_id, status: 'proses' }
            })
        ]);

        const kasRT = financials.reduce((acc: number, curr: any) => 
            curr.tipe === 'pemasukan' ? acc + (curr._sum.nominal || 0) : acc - (curr._sum.nominal || 0), 0) || 0;

        // Calculate actual unpaid months up to current month for the current year
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        let iuranUnpaidMonths = 0;
        
        try {
            // Target the main 'Iuran Warga' category for personal dashboard stats
            const mainKategori = 'Iuran Warga';
            const billingSummary = await pembayaranIuranService.getBillingSummary(
                user.tenant_id, 
                user.warga_id, 
                currentYear, 
                mainKategori,
                'RT'
            );
            
            // If main category returns nothing, try a fallback to a generic catch-all summary
            if (!billingSummary || (!billingSummary.paidMonths?.length && !billingSummary.pendingMonths?.length)) {
                 const fallbackSummary = await pembayaranIuranService.getBillingSummary(
                    user.tenant_id, 
                    user.warga_id, 
                    currentYear, 
                    'SEMUA',
                    'RT'
                );
                
                if (fallbackSummary && fallbackSummary.type === 'MANIFEST') {
                    const iuranWarga = fallbackSummary.items.find((item: any) => 
                        item.nama.toLowerCase().includes('iuran warga') || 
                        item.nama.toLowerCase().includes('iuran wajib')
                    ) || fallbackSummary.items[0];
                    
                    if (iuranWarga) {
                        for (let m = 1; m <= currentMonth; m++) {
                            if (!iuranWarga.paidMonths.includes(m) && !iuranWarga.pendingMonths.includes(m)) {
                                iuranUnpaidMonths++;
                            }
                        }
                    }
                } else if (fallbackSummary && !fallbackSummary.type) {
                    // Single category fallback logic
                    for (let m = 1; m <= currentMonth; m++) {
                        if (!fallbackSummary.paidMonths.includes(m) && !fallbackSummary.pendingMonths.includes(m)) {
                            iuranUnpaidMonths++;
                        }
                    }
                }
            } else {
                // Success with 'Iuran Warga'
                for (let m = 1; m <= currentMonth; m++) {
                    if (!billingSummary.paidMonths.includes(m) && !billingSummary.pendingMonths.includes(m)) {
                        iuranUnpaidMonths++;
                    }
                }
            }
        } catch (err: any) {
            fastify.log.warn("Failed to fetch billing summary for warga-personal stats: " + (err.message || err));
            iuranUnpaidMonths = 0;
        }

        return { warga, iuranHeader, surat, kasRT, iuranPendingCount, suratProsesCount, iuranUnpaidMonths };
    });
}
