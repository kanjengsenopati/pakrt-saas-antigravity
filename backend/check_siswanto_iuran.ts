import { prisma } from './src/prisma';

async function main() {
    console.log('--- DIAGNOSTIC: SISWANTO IURAN ---');
    
    // Find Siswanto
    const siswanto = await prisma.warga.findFirst({
        where: { nama: { contains: 'Siswanto', mode: 'insensitive' } }
    });
    
    if (!siswanto) {
        console.log('Siswanto not found');
        return;
    }
    
    console.log('Warga Found:', {
        id: siswanto.id,
        nama: siswanto.nama,
        tenant_id: siswanto.tenant_id,
        nik: siswanto.nik
    });
    
    // Find all iuran for this warga
    const iurans = await prisma.pembayaranIuran.findMany({
        where: { warga_id: siswanto.id },
        orderBy: { tanggal_bayar: 'desc' }
    });
    
    console.log(`Found ${iurans.length} iuran records:`);
    iurans.forEach(i => {
        console.log({
            id: i.id,
            kategori: i.kategori,
            bulan: i.periode_bulan,
            tahun: i.periode_tahun,
            nominal: i.nominal,
            status: i.status
        });
    });

    // Check settings for rate
    const settings = await prisma.pengaturan.findMany({
        where: { tenant_id: siswanto.tenant_id }
    });
    console.log('Settings count:', settings.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
