import api from './api';
import { PembayaranIuran, Warga } from '../types/database';
import { ScopeType } from '../contexts/TenantContext';

export type IuranWithWarga = PembayaranIuran & { warga?: Warga };

export const iuranService = {
    async getAll(tenantId: string, scope?: ScopeType, page: number = 1, limit: number = 100): Promise<{ items: IuranWithWarga[], total: number, page: number, limit: number }> {
        const response = await api.get('/iuran', {
            params: { tenant_id: tenantId, scope, page, limit }
        });
        const data = response.data;
        if (Array.isArray(data)) {
            return { items: data, total: data.length, page: 1, limit: data.length };
        }
        return data || { items: [], total: 0, page, limit };
    },

    async getById(id: string): Promise<IuranWithWarga | undefined> {
        try {
            const response = await api.get(`/iuran/${id}`);
            return response.data;
        } catch (error) {
            return undefined;
        }
    },

    async getBillingSummary(tenantId: string, wargaId: string, year: number, monthOrKategori: number | string | undefined, scope: ScopeType): Promise<any> {
        const params: any = { year, scope, tenant_id: tenantId };
        if (typeof monthOrKategori === 'number') {
            params.month = monthOrKategori;
        } else if (typeof monthOrKategori === 'string') {
            params.kategori = monthOrKategori;
        }
        
        const response = await api.get(`/iuran/billing-summary/${wargaId}`, { params });
        return response.data;
    },

    async create(data: Omit<PembayaranIuran, 'id'>, ..._args: any[]): Promise<string> {
        const response = await api.post('/iuran', data);
        return response.data.id;
    },

    async update(id: string, data: Partial<PembayaranIuran>, ..._args: any[]): Promise<number> {
        await api.put(`/iuran/${id}`, data);
        return 1;
    },

    async delete(id: string, ..._args: any[]): Promise<void> {
        await api.delete(`/iuran/${id}`);
    },

    async verify(id: string, status: string, alasan?: string): Promise<void> {
        // Backend expects: { action: 'VERIFY' | 'REJECT', alasan?: string }
        const action = (status === 'VERIFY' || status === 'VERIFIED') ? 'VERIFY' : 'REJECT';
        console.log(`[IuranService] Verifying ${id} with action: ${action}`);
        await api.post(`/iuran/${id}/verify`, { action, alasan, _t: Date.now() }); // Cache buster param
    },

    async resubmit(id: string, updateData?: { url_bukti?: string }): Promise<void> {
        await api.post(`/iuran/${id}/resubmit`, updateData || {});
    },

    async syncAllToKeuangan(tenantId: string, scope: ScopeType): Promise<void> {
        await api.post('/iuran/sync-keuangan', { tenant_id: tenantId, scope });
    },

    async getPendingCount(scope?: ScopeType): Promise<number> {
        const response = await api.get('/iuran/pending-count', { params: { scope } });
        return response.data.count || 0;
    },

    async exportToXlsx(tenantId: string, scope?: ScopeType): Promise<void> {
        const response = await api.get('/iuran/export', {
            params: { tenant_id: tenantId, scope },
            responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const fileName = `Data_Iuran_${scope}_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};
