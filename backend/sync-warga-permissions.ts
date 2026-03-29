import { prisma } from './src/prisma';
import { SYSTEM_ROLES } from './src/services/roleService';

async function syncWargaPermissions() {
    console.log('--- Starting Warga Role Permissions Sync ---');
    
    const wargaDef = SYSTEM_ROLES.find(r => r.name === 'Warga');
    if (!wargaDef) {
        console.error('System role definition for "Warga" not found.');
        return;
    }

    const roles = await prisma.role.findMany({
        where: { name: 'Warga' }
    });

    console.log(`Found ${roles.length} Warga roles to update.`);

    let updatedCount = 0;
    for (const role of roles) {
        await prisma.role.update({
            where: { id: role.id },
            data: { permissions: wargaDef.permissions as any }
        });
        updatedCount++;
    }

    console.log(`--- Finished. Updated ${updatedCount} roles successfully. ---`);
    process.exit(0);
}

syncWargaPermissions().catch(err => {
    console.error('Sync failed:', err);
    process.exit(1);
});
