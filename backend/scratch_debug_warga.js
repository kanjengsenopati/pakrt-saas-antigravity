const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const warga = await prisma.warga.findFirst({
    where: { nama: { contains: 'JUNDI' } }
  });
  console.log(JSON.stringify(warga, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
