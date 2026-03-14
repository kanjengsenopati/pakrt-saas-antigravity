import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const counts = {
            warga: await prisma.warga.count(),
            keuangan: await prisma.keuangan.count(),
            iuran: await prisma.pembayaranIuran.count(),
            agenda: await prisma.agenda.count(),
            aset: await prisma.aset.count(),
            pengurus: await prisma.pengurus.count()
        };
        console.log('DB Counts:', JSON.stringify(counts, null, 2));
    } catch (e) {
        console.error('Error querying DB:', e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
