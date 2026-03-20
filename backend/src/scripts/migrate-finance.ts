import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log("Starting Finance Description Migration...");

  // Find all Keuangan entries that might have technical IDs
  const transactions = await prisma.keuangan.findMany({
    where: {
      OR: [
        { keterangan: { contains: 'iuran_id' } },
        { keterangan: { contains: 'IURAN_ID' } },
        { keterangan: { contains: 'ref:' } }
      ]
    }
  });

  console.log(`Found ${transactions.length} potential transactions to migrate.`);

  for (const trx of transactions) {
    let newKeterangan = trx.keterangan;
    let iuranId: string | null = null;

    // Pattern 1: [iuran_id:UUID] or [IURAN_ID:UUID] at the start
    const idPattern = /\[(?:iuran_id|IURAN_ID):([^\]]+)\]/i;
    const match = trx.keterangan.match(idPattern);

    if (match) {
      iuranId = match[1];
      // Remove the tag from the beginning
      newKeterangan = trx.keterangan.replace(idPattern, '').trim();
    }

    // Pattern 2: Extract from ref: pattern if exists
    if (!iuranId) {
        const refPattern = /ref:([a-f0-9-]{8,})/i;
        const refMatch = trx.keterangan.match(refPattern);
        if (refMatch) iuranId = refMatch[1];
    }

    if (iuranId) {
      try {
        const iuran = await prisma.pembayaranIuran.findUnique({
          where: { id: iuranId },
          include: { warga: true }
        });

        if (iuran) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
          const monthLabel = iuran.periode_bulan.map(m => monthNames[m - 1]).join(', ');
          const wargaNama = iuran.warga?.nama || 'Warga';
          
          // Rebuild standardized format: [Warga Nama] Pembayaran Kategori — Bulan/Tahun | ref:iuranId
          newKeterangan = `[${wargaNama}] Pembayaran ${iuran.kategori} — ${monthLabel}/${iuran.periode_tahun} | ref:${iuran.id}`;
          
          if (newKeterangan !== trx.keterangan) {
            await prisma.keuangan.update({
              where: { id: trx.id },
              data: { keterangan: newKeterangan }
            });
            console.log(`Migrated TRX ${trx.id}: ${trx.keterangan} -> ${newKeterangan}`);
          }
        }
      } catch (err) {
        console.error(`Failed to migrate TRX ${trx.id}:`, err);
      }
    }
  }

  console.log("Migration complete.");
}

migrate()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
