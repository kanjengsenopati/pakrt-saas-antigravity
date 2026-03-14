import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicates() {
    console.log('Starting Pengurus data cleanup...');

    // 1. Get all pengurus records
    const allPengurus = await prisma.pengurus.findMany({
        orderBy: { id: 'asc' } // Consistent order
    });

    console.log(`Total records found: ${allPengurus.length}`);

    const seen = new Set();
    const toDelete = [];

    for (const p of allPengurus) {
        const key = `${p.tenant_id}-${p.scope}-${p.warga_id}-${p.jabatan}-${p.periode}-${p.status}`;
        if (seen.has(key)) {
            toDelete.push(p.id);
        } else {
            seen.add(key);
        }
    }

    if (toDelete.length > 0) {
        console.log(`Deleting ${toDelete.length} duplicate records...`);

        // Fastify/Prisma deleteMany doesn't take list of IDs directly in a simple way for big lists,
        // but for our scale it should be fine.
        const result = await prisma.pengurus.deleteMany({
            where: {
                id: { in: toDelete }
            }
        });

        console.log(`Successfully deleted ${result.count} records.`);
    } else {
        console.log('No duplicates found.');
    }

    await prisma.$disconnect();
}

cleanupDuplicates().catch(err => {
    console.error('Cleanup failed:', err);
    process.exit(1);
});
