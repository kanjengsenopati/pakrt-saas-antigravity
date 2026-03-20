import { prisma } from './src/prisma';

async function main() {
    console.log('--- EXTENDED DIAGNOSTIC: ALL IURAN RECORDS ---');
    
    const allIurans = await prisma.pembayaranIuran.findMany({
        include: { warga: true },
        orderBy: { tanggal_bayar: 'desc' },
        take: 20
    });
    
    console.log(`Listing last ${allIurans.length} iuran records:`);
    allIurans.forEach(i => {
        console.log(`[${i.status}] ID:${i.id} | Warga:${i.warga?.nama} | Kat:"${i.kategori}" | Bulan:${i.periode_bulan} | Tahun:${i.periode_tahun} | Nominal:${i.nominal} | Tenant:${i.tenant_id}`);
    });

    const categories = await prisma.pembayaranIuran.groupBy({
        by: ['kategori']
    });
    console.log('Existing Categories in DB:', categories.map(c => `"${c.kategori}"`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
