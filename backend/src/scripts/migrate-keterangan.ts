/**
 * Migration Script: Fix keterangan format in Keuangan table
 * 
 * This script migrates all existing keuangan entries linked to iuran payments
 * to use human-readable format:
 *   OLD: "[iuran_id:uuid] Pembayaran Iuran Warga - 1,2,3,4/2026"
 *   OLD: "[Nama Warga] Pembayaran Iuran Warga — 1,2,3,4/2026 | ref:uuid"
 *   NEW: "[Nama Warga] Iuran Warga — Januari, Februari, Maret, April 2026 | ref:uuid"
 * 
 * Run with: npx ts-node src/scripts/migrate-keterangan.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function buildKeterangan(wargaNama: string, kategori: string, periodeBulan: number[], periodeTahun: number, refId: string): string {
  const monthNames = periodeBulan
    .map(m => MONTH_NAMES_ID[m - 1] || String(m))
    .join(', ');
  return `[${wargaNama}] ${kategori} — ${monthNames} ${periodeTahun} | ref:${refId}`;
}

async function migrate() {
  console.log('🚀 Starting keterangan migration...\n');

  // 1. Fix entries that have a | ref: tag (linked to iuran payments)
  const linkedEntries = await prisma.keuangan.findMany({
    where: {
      keterangan: { contains: '| ref:' }
    }
  });

  console.log(`📋 Found ${linkedEntries.length} entries linked to iuran payments.`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const entry of linkedEntries) {
    try {
      // Extract the ref id
      const refMatch = entry.keterangan.match(/\| ref:([a-f0-9-]+)$/i);
      if (!refMatch) {
        console.log(`  ⚠️  Skipping ${entry.id} — no ref found in: ${entry.keterangan}`);
        skipCount++;
        continue;
      }

      const iuranId = refMatch[1];

      // Fetch the linked iuran record
      const iuran = await prisma.pembayaranIuran.findUnique({
        where: { id: iuranId },
        include: { warga: true }
      });

      if (!iuran) {
        console.log(`  ⚠️  Skipping ${entry.id} — iuran record ${iuranId} not found`);
        skipCount++;
        continue;
      }

      const wargaNama = (iuran as any).warga?.nama || 'Warga';
      const newKeterangan = buildKeterangan(
        wargaNama,
        iuran.kategori,
        iuran.periode_bulan as number[],
        iuran.periode_tahun,
        iuran.id
      );

      // Only update if keterangan is actually different
      if (newKeterangan === entry.keterangan) {
        skipCount++;
        continue;
      }

      await prisma.keuangan.update({
        where: { id: entry.id },
        data: { keterangan: newKeterangan }
      });

      console.log(`  ✅ Updated entry ${entry.id}`);
      console.log(`     OLD: ${entry.keterangan}`);
      console.log(`     NEW: ${newKeterangan}\n`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ Error processing entry ${entry.id}:`, err);
      errorCount++;
    }
  }

  // 2. Fix old-format entries with [iuran_id:...] tag (legacy format)
  const legacyEntries = await prisma.keuangan.findMany({
    where: {
      keterangan: { contains: '[iuran_id:' }
    }
  });

  console.log(`\n📋 Found ${legacyEntries.length} entries with legacy [iuran_id:...] format.`);

  for (const entry of legacyEntries) {
    try {
      // Extract iuran_id from legacy format: "[iuran_id:uuid] Pembayaran Iuran Warga - ..."
      const legacyMatch = entry.keterangan.match(/\[iuran_id:([a-f0-9-]+)\]/i);
      if (!legacyMatch) {
        skipCount++;
        continue;
      }

      const iuranId = legacyMatch[1];
      const iuran = await prisma.pembayaranIuran.findUnique({
        where: { id: iuranId },
        include: { warga: true }
      });

      if (!iuran) {
        console.log(`  ⚠️  Skipping legacy ${entry.id} — iuran ${iuranId} not found`);
        skipCount++;
        continue;
      }

      const wargaNama = (iuran as any).warga?.nama || 'Warga';
      const newKeterangan = buildKeterangan(
        wargaNama,
        iuran.kategori,
        iuran.periode_bulan as number[],
        iuran.periode_tahun,
        iuran.id
      );

      await prisma.keuangan.update({
        where: { id: entry.id },
        data: { keterangan: newKeterangan }
      });

      console.log(`  ✅ Fixed legacy entry ${entry.id}`);
      console.log(`     OLD: ${entry.keterangan}`);
      console.log(`     NEW: ${newKeterangan}\n`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ Error processing legacy entry ${entry.id}:`, err);
      errorCount++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Updated: ${successCount}`);
  console.log(`   ⏭️  Skipped (already correct or not found): ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('\n✨ Migration complete!');

  await prisma.$disconnect();
}

migrate().catch(async (e) => {
  console.error('❌ Migration failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
