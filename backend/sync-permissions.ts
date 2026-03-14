import { prisma } from './src/prisma';

async function syncPermissions() {
  console.log('Synchronizing roles...');
  
  const tenants = await prisma.tenant.findMany();
  
  for (const tenant of tenants) {
    console.log(`Updating roles for tenant: ${tenant.id}`);
    
    // Update Bendahara
    const bendahara = await prisma.role.findFirst({
      where: { tenant_id: tenant.id, name: 'Bendahara' }
    });
    if (bendahara) {
      const perms = bendahara.permissions as any || {};
      perms["Setup / Pengaturan"] = { actions: ["Lihat"], scope: "all" };
      await prisma.role.update({
        where: { id: bendahara.id },
        data: { permissions: perms }
      });
      console.log(`  - Updated Bendahara`);
    }

    // Update Sekretaris
    const sekretaris = await prisma.role.findFirst({
      where: { tenant_id: tenant.id, name: 'Sekretaris' }
    });
    if (sekretaris) {
      const perms = sekretaris.permissions as any || {};
      perms["Setup / Pengaturan"] = { actions: ["Lihat"], scope: "all" };
      await prisma.role.update({
        where: { id: sekretaris.id },
        data: { permissions: perms }
      });
      console.log(`  - Updated Sekretaris`);
    }
  }
  
  console.log('Sync complete.');
}

syncPermissions().catch(err => {
  console.error(err);
  process.exit(1);
});
