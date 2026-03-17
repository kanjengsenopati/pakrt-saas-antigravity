import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Checking specific users with role details...");
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: "BUDI", mode: 'insensitive' } },
                { tenant_id: "33.74.10.1011.50.25" }
            ]
        },
        include: {
            role_entity: true
        }
    });
    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
