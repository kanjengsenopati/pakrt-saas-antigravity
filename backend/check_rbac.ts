import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const roles = await prisma.role.findMany({
            include: {
                _count: {
                    select: { users: true }
                }
            }
        });
        console.log('--- ROLES ---');
        console.log(JSON.stringify(roles, null, 2));

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role_id: true,
                role_entity: {
                    select: { name: true }
                }
            }
        });
        console.log('\n--- USERS ---');
        console.log(JSON.stringify(users, null, 2));
    } catch (e) {
        console.error('Error querying DB:', e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
