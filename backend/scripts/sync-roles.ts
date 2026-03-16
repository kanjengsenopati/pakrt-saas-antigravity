import { PrismaClient } from '@prisma/client';
import { roleService } from '../src/services/roleService';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Starting Global Role Synchronization...');

    // Fetch all tenants
    const tenants = await prisma.tenant.findMany({
        select: { id: true, name: true }
    });

    console.log(`Found ${tenants.length} tenants. Syncing roles...`);

    let successCount = 0;
    let failCount = 0;

    for (const tenant of tenants) {
        try {
            console.log(`\nSynchronizing roles for: ${tenant.name} (${tenant.id})`);
            
            // Execute the syncDefaultRoles which will create missing roles AND update existing ones
            // with any new permissions added to SYSTEM_ROLES (like 'Manajemen User / Role')
            await roleService.syncDefaultRoles(tenant.id, prisma);
            
            console.log(`✅ Success: ${tenant.name}`);
            successCount++;
        } catch (error) {
            console.error(`❌ Failed: ${tenant.name}`, error);
            failCount++;
        }
    }

    console.log('\n=============================================');
    console.log('🎉 Global Role Synchronization Complete!');
    console.log(`✅ Successful Tenants: ${successCount}`);
    if (failCount > 0) {
        console.log(`❌ Failed Tenants: ${failCount}`);
    }
    console.log('=============================================');
}

main()
    .catch((e) => {
        console.error('Fatal Error during synchronization:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
