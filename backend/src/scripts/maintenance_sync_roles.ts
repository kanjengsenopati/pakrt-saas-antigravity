import { PrismaClient } from '@prisma/client';
import { roleService } from '../services/roleService';

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING ROLE SYNCHRONIZATION ---');
    
    // Fetch all unique tenant IDs from the database
    const tenants = await prisma.tenant.findMany({
        select: { id: true, name: true }
    });

    console.log(`Found ${tenants.length} tenants. Syncing roles...`);

    for (const tenant of tenants) {
        try {
            console.log(`Syncing roles for tenant: ${tenant.name} (${tenant.id})...`);
            const results = await roleService.syncDefaultRoles(tenant.id, prisma);
            console.log(`  Successfully synced ${results.length} roles.`);
        } catch (error) {
            console.error(`  Failed to sync roles for tenant ${tenant.id}:`, error);
        }
    }

    console.log('--- ROLE SYNCHRONIZATION COMPLETED ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
