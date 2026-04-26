const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = '33.74.10.1011.100.100';
  const iurans = await prisma.pembayaranIuran.findMany({
    where: { tenant_id: tenantId },
    select: {
      id: true,
      warga: { select: { nama: true } },
      kategori: true,
      periode_bulan: true,
      periode_tahun: true,
      status: true
    },
    orderBy: { id: 'desc' },
    take: 10
  });
  console.log(JSON.stringify(iurans, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
