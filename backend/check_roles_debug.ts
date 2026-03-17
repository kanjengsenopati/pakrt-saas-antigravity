import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tenantId = "33.74.10.1011.50.25";
    console.log(`Checking roles for tenant ${tenantId}...`);
    const roles = await prisma.role.findMany({
        where: { tenant_id: tenantId }
    });
    console.log(JSON.stringify(roles, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
