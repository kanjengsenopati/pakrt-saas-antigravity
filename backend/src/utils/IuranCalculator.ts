import { wargaService } from '../services/wargaService';
import { pengaturanService } from '../services/pengaturanService';

export interface IuranRateConfig {
  [key: string]: any;
}

export interface KategoriMetadata {
  tipe: 'BULANAN' | 'INSIDENTIL';
  nominal: number;
  is_mandatory: boolean;
}

export class IuranCalculator {
  /**
   * Calculates the specific iuran rate for a resident based on their status.
   */
  static async getWargaIuranRate(wargaId: string, tenantId: string, scope: string = 'RT'): Promise<number> {
    try {
      const warga = await wargaService.getById(wargaId);
      const settings = await pengaturanService.getAll(tenantId, scope);
      
      const config: Record<string, any> = {};
      settings.forEach((p: any) => { config[p.key] = p.value; });

      const statusKey = `${warga?.status_penduduk || 'Tetap'}-${warga?.status_rumah || 'Dihuni'}`;
      const rateField = `iuran_${statusKey.toLowerCase().replace('-', '_')}`;
      const rate = Number(config[rateField] || config.iuran_per_bulan || config.iuran_tetap_dihuni || 100000);
      
      if (rate === 0) {
        console.warn(`Warga ${wargaId} has 0 iuran rate. Check settings for ${rateField}`);
      }
      return rate;
    } catch (err) {
      console.error(`Error calculating iuran rate for warga ${wargaId}:`, err);
      throw new Error("Gagal menghitung tarif iuran. Pastikan data warga dan pengaturan iuran sudah benar.");
    }
  }

  /**
   * Fetches metadata for a specific payment category.
   */
  static async getKategoriMetadata(kategori: string, tenantId: string, scope: string = 'RT'): Promise<KategoriMetadata | null> {
    try {
      const settings = await pengaturanService.getAll(tenantId, scope);
      const config: Record<string, any> = {};
      settings.forEach((p: any) => { config[p.key] = p.value; });

      const rawJenis = config.jenis_pemasukan || config.kategori_pemasukan;
      if (!rawJenis) return null;
      const jenisList: any[] = typeof rawJenis === 'string' ? JSON.parse(rawJenis) : rawJenis;
      const match = jenisList.find((j: any) =>
        j.nama?.trim().toLowerCase() === kategori?.trim().toLowerCase()
      );
      
      if (!match) return null;

      return {
        tipe: match.tipe || 'BULANAN',
        nominal: Number(match.nominal) || 0,
        is_mandatory: !!match.is_mandatory
      };
    } catch {
      return null;
    }
  }

  /**
   * Strategic method to calculate payment nominal and period based on input data and configuration.
   * This implements the Strategy Pattern for different payment modes.
   */
  static async calculatePaymentDetails(data: {
    nominal: number;
    warga_id: string;
    tenant_id: string;
    scope: string;
    kategori: string;
    periode_bulan: number[];
    metadata?: { mode?: string };
  }) {
    const isBebas = data.metadata?.mode === 'Bebas';
    const metadataMode = data.metadata?.mode;
    const result = {
      nominal: Number(data.nominal),
      periode_bulan: [...(data.periode_bulan || [])]
    };

    const kategoriMeta = await this.getKategoriMetadata(data.kategori, data.tenant_id, data.scope);
    const isInsidentil = kategoriMeta?.tipe === 'INSIDENTIL';

    // Strategy 1: INSIDENTIL (Event-based)
    if (isInsidentil && kategoriMeta?.nominal > 0) {
      // For updates where nominal might be missing if metadataMode is not specifically set
      if (!result.nominal || metadataMode === 'Pas') {
        result.nominal = kategoriMeta.nominal;
      }
    } 
    // Strategy 2: BEBAS (Flexible amount determines months)
    else if (isBebas && result.nominal > 0) {
      const rate = await this.getWargaIuranRate(data.warga_id, data.tenant_id, data.scope);
      if (rate > 0) {
        const totalMonthsCovered = result.nominal / rate;
        const startMonth = result.periode_bulan[0] || 1;
        const months: number[] = [];
        for (let i = 0; i < Math.ceil(totalMonthsCovered); i++) {
          const m = startMonth + i;
          if (m > 12) break;
          months.push(m);
        }
        if (months.length > 0) result.periode_bulan = months;
      }
    } 
    // Strategy 3: PAS / BULANAN (Month selection determines amount)
    else if (!isBebas && !isInsidentil) {
      const rate = await this.getWargaIuranRate(data.warga_id, data.tenant_id, data.scope);
      if (rate > 0 && Array.isArray(result.periode_bulan) && (metadataMode === 'Pas' || !result.nominal)) {
        result.nominal = rate * result.periode_bulan.length;
      }
    }

    return result;
  }
}
