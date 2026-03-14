import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const tenantId = '33.74.10.1011.100.100';
        const roles = await prisma.role.findMany({ where: { tenant_id: tenantId } });
        
        const sekRole = roles.find(r => r.name === 'Sekretaris');
        const benRole = roles.find(r => r.name === 'Bendahara');

        if (sekRole) {
            await prisma.user.update({
                where: { email: 'sekretaris@pakrt.id' },
                data: { role_id: sekRole.id, permissions: sekRole.permissions as any }
            });
            console.log('Linked Sekretaris');
        }

        if (benRole) {
            await prisma.user.update({
                where: { email: 'bendahara@pakrt.id' },
                data: { role_id: benRole.id, permissions: benRole.permissions as any }
            });
            console.log('Linked Bendahara');
        }

    } catch (e) {
        console.error(e);
    }
}

main().finally(() => prisma.$disconnect());
