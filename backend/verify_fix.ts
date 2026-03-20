import { prisma } from './src/prisma';

async function getWargaIuranRate(wargaId: string, tenantId: string, scope: string = 'RT'): Promise<number> {
  const warga = await prisma.warga.findUnique({ where: { id: wargaId } });
  const settings = await prisma.pengaturan.findMany({ where: { tenant_id: tenantId, scope } });
  
  const config: Record<string, any> = {};
  settings.forEach((p: any) => { config[p.key] = p.value; });

  const statusKey = `${warga?.status_penduduk || 'Tetap'}-${warga?.status_rumah || 'Dihuni'}`;
  const rateField = `iuran_${statusKey.toLowerCase().replace('-', '_')}`;
  return Number(config[rateField] || config.iuran_per_bulan || 0);
}

async function getBillingSummary(tenantId: string, wargaId: string, tahun: number, kategori?: string, scope: string = 'RT') {
    const rate = await getWargaIuranRate(wargaId, tenantId, scope);
    const targetKat = kategori?.trim().replace(/\s+/g, ' ').toLowerCase();

    const allPayments = await prisma.pembayaranIuran.findMany({
      where: {
        tenant_id: tenantId,
        warga_id: wargaId,
        periode_tahun: tahun,
        status: 'VERIFIED'
      }
    });

    const existing = allPayments.filter(p => {
      const pKat = p.kategori.trim().replace(/\s+/g, ' ').toLowerCase();
      if (targetKat && targetKat !== 'iuran warga' && targetKat !== 'semua') {
        return pKat === targetKat;
      }
      return pKat.includes('iuran');
    });

    const totalPaid = existing.reduce((sum, curr) => sum + curr.nominal, 0);
    const expectedTotal = rate * 12;
    const paidMonths = [...new Set(existing.flatMap(e => e.periode_bulan))].sort((a, b) => a - b);

    return {
      rate,
      expectedTotal,
      totalPaid,
      paidMonths,
      sisa: Math.max(0, expectedTotal - totalPaid)
    };
}

async function main() {
    console.log('--- VERIFICATION: SISWANTO BILLING ---');
    
    const siswanto = await prisma.warga.findFirst({
        where: { nama: { contains: 'Siswanto', mode: 'insensitive' }, tenant_id: '33.74.10.1011.50.25' }
    });
    
    if (!siswanto) {
        console.log('Siswanto not found');
        return;
    }

    const summary = await getBillingSummary(siswanto.tenant_id, siswanto.id, 2026);
    console.log('Summary Result:', summary);

    if (summary.totalPaid === 320000 && summary.sisa === 640000) {
        console.log('SUCCESS: Billing summary is now correct!');
    } else {
        console.log('FAILURE: Billing summary still incorrect.');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
