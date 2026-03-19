import axios from 'axios';
import { PembayaranIuran, Warga } from '../database/db'; // Keep interface 
import { aktivitasService } from './aktivitasService';
import { keuanganService } from './keuanganService';
import { ScopeType } from '../contexts/TenantContext';
import { wargaService } from './wargaService';

export interface IuranWithWarga extends PembayaranIuran {
    warga?: Warga;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

/** Helper: Build a keterangan tag that encodes the iuran ID, Warga name, and months */
const buildKeteranganTag = (iuranId: string, kategori: string, months: string, tahun: number, wargaNama?: string) =>
    `[AUTO] Iuran ${kategori} — ${months} ${tahun} (${wargaNama || 'Warga ID: ...'}) | ref:${iuranId}`;

export const iuranService = {
    async getAll(tenantId: string, scope?: string, page: number = 1, limit: number = 100): Promise<{ items: IuranWithWarga[], total: number, page: number, limit: number }> {
        const response = await axios.get(`${API_URL}/pembayaranIuran`, {
            params: { tenant_id: tenantId, scope, page, limit }
        });
        return response.data;
    },

    async getById(id: string): Promise<IuranWithWarga | undefined> {
        try {
            const response = await axios.get(`${API_URL}/pembayaranIuran/${id}`);
            return response.data;
        } catch (e) { console.error(e); throw e; }
    },

    async create(data: Omit<PembayaranIuran, 'id'>, scope: ScopeType = 'RT'): Promise<string> {
        // 1. Save the iuran entry (Backend handles Keuangan sync on verification)
        const response = await axios.post(`${API_URL}/pembayaranIuran`, { ...data, scope });
        const iuranId: string = response.data.id;

        await aktivitasService.logActivity(
            data.tenant_id,
            'RT',
            'Bayar Iuran',
            `Pembayaran ${data.kategori}`
        );

        return iuranId;
    },

    async update(id: string, data: Partial<Omit<PembayaranIuran, 'id' | 'tenant_id'>>, scope: ScopeType = 'RT'): Promise<number> {
        // 1. Update the iuran entry
        await axios.put(`${API_URL}/pembayaranIuran/${id}`, { ...data, scope });
        return 1;
    },

    async verify(id: string, action: 'VERIFY' | 'REJECT', alasan?: string): Promise<IuranWithWarga> {
        const response = await axios.post(`${API_URL}/pembayaranIuran/${id}/verify`, { action, alasan });
        return response.data;
    },

    async delete(id: string, tenantId: string, scope: ScopeType = 'RT'): Promise<void> {
        // 1. Find & delete the linked Kas Masuk entry first
        try {
            const data = await keuanganService.getAll(tenantId, scope, 1, 1000);
            const linked = data.items.find(k => k.keterangan?.includes(`ref:${id}`));
            if (linked) {
                await keuanganService.delete(linked.id);
            }
        } catch (err) {
            console.error('[iuranService] Gagal menghapus linked Kas Masuk:', err);
        }

        // 2. Delete the iuran entry
        await axios.delete(`${API_URL}/pembayaranIuran/${id}`);
    },

    /** Internal helper to sync a single Iuran entry to Keuangan (Create or Update) */
    async syncToKeuangan(iuranId: string, iuranData: Omit<PembayaranIuran, 'id'>, scope: ScopeType) {
        try {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
                'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
            const monthLabel = iuranData.periode_bulan
                .map(m => monthNames[m - 1])
                .join(', ');

            // Fetch Warga name for the keterangan
            let wargaNama = '';
            try {
                const warga = await wargaService.getById(iuranData.warga_id);
                wargaNama = warga?.nama || '';
            } catch (e) {
                console.warn('[iuranService] Gagal fetch info warga untuk sync:', e);
            }

            let existingLinked: any = undefined;
            try {
                const data = await keuanganService.getAll(iuranData.tenant_id, scope, 1, 1000);
                existingLinked = data.items.find(k => k.keterangan?.includes(`ref:${iuranId}`));
            } catch (e) {
                console.warn('[iuranService] Gagal fetch info keuangan untuk sync:', e);
            }

            const payload = {
                tenant_id: iuranData.tenant_id,
                scope,
                tipe: 'pemasukan' as const,
                kategori: iuranData.kategori,
                nominal: iuranData.nominal,
                tanggal: iuranData.tanggal_bayar,
                keterangan: buildKeteranganTag(iuranId, iuranData.kategori, monthLabel, iuranData.periode_tahun, wargaNama),
                url_bukti: iuranData.url_bukti,
            };

            if (existingLinked) {
                await keuanganService.update(existingLinked.id, payload);
            } else {
                await keuanganService.create(payload);
            }
        } catch (err) {
            console.error('[iuranService] Gagal sync ke Kas Masuk:', err);
        }
    },

    /** Bulk sync all existing Iuran entries to Keuangan (find orphans) */
    async syncAllToKeuangan(tenantId: string, scope: ScopeType) {
        const iuranData = await this.getAll(tenantId, scope, 1, 1000);
        const keuanganData = await keuanganService.getAll(tenantId, scope, 1, 1000);

        for (const iuran of iuranData.items) {
            const hasLinked = keuanganData.items.some(k => k.keterangan?.includes(`ref:${iuran.id}`));
            if (!hasLinked) {
                await this.syncToKeuangan(iuran.id, iuran, scope);
            }
        }
    },

    async getBillingSummary(wargaId: string, tahun: number, kategori?: string, scope?: string): Promise<{
        rate: number,
        expectedTotal: number,
        totalPaid: number,
        paidMonths: number[],
        sisa: number
    }> {
        const response = await axios.get(`${API_URL}/pembayaranIuran/billing/${wargaId}`, {
            params: { tahun, kategori, scope }
        });
        return response.data;
    }
};
