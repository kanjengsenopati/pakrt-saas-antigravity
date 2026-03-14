import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const wargaCount = await prisma.warga.count();
        const tenantIds = await prisma.warga.groupBy({
            by: ['tenant_id'],
            _count: true
        });

        console.log('Total Warga:', wargaCount);
        console.log('Tenants in DB:', JSON.stringify(tenantIds, null, 2));
    } catch (e) {
        console.error('Error querying DB:', e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
