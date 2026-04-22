import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const packages = [
    {
      name: 'Premium Bulanan',
      description: 'Akses semua fitur premium selama 1 bulan',
      price: 49000,
      duration_months: 1,
      features: ['Laporan Keuangan', 'Cetak Surat Otomatis', 'Push Notification', 'Manajemen Aset'],
      isActive: true,
    },
    {
      name: 'Premium 6 Bulan',
      description: 'Hemat 19% — akses 6 bulan penuh',
      price: 239000,
      duration_months: 6,
      features: ['Laporan Keuangan', 'Cetak Surat Otomatis', 'Push Notification', 'Manajemen Aset', 'Support Prioritas'],
      isActive: true,
    },
    {
      name: 'Premium Tahunan',
      description: 'Hemat 24% — akses sepanjang tahun',
      price: 449000,
      duration_months: 12,
      features: ['Semua Fitur Premium', 'Custom Domain (Coming Soon)', 'Support 24/7', 'Eksklusif Badge'],
      isActive: true,
    },
  ];

  console.log('Seeding packages...');
  for (const pkg of packages) {
    await prisma.pricePackage.create({
      data: pkg,
    });
  }
  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
