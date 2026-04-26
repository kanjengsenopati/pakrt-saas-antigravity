const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = '33.74.10.1011.100.100';
  const setting = await prisma.pengaturan.findFirst({
    where: { tenant_id: tenantId, key: 'kategori_pemasukan' }
  });
  if (setting) {
    console.log('KEY:', setting.key);
    console.log('VALUE TYPE:', typeof setting.value);
    console.log('VALUE:', setting.value);
  } else {
    console.log('NOT FOUND');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
