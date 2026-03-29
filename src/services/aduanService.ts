import api from './api';
import { ScopeType } from '../contexts/TenantContext';

export interface AduanUsulan {
    id: string;
    tenant_id: string;
    scope: string;
    warga_id: string;
    tipe: 'Aduan' | 'Usulan';
    judul: string;
    deskripsi: string;
    status: 'Menunggu' | 'Proses' | 'Selesai';
    tanggal: string;
    foto_url?: string;
    tanggapan?: string;
    is_anonymous: boolean;
    warga?: any;
    polling?: any;
}

export const aduanService = {
    async getAll(params: { scope?: ScopeType; status?: string; tipe?: string; page?: number; limit?: number } = {}): Promise<{ items: AduanUsulan[], total: number }> {
        const response = await api.get('/aduan', { params });
        return response.data;
    },

    async getStats(scope?: ScopeType): Promise<any> {
        const response = await api.get('/aduan/stats', { params: { scope } });
        return response.data;
    },

    async getById(id: string): Promise<AduanUsulan> {
        const response = await api.get(`/aduan/${id}`);
        return response.data;
    },

    async create(data: Partial<AduanUsulan>): Promise<AduanUsulan> {
        const response = await api.post('/aduan', data);
        return response.data;
    },

    async update(id: string, data: Partial<AduanUsulan>): Promise<AduanUsulan> {
        const response = await api.patch(`/aduan/${id}`, data);
        return response.data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/aduan/${id}`);
    },

    async convertToPolling(id: string, pollingData: { pertanyaan: string, opsi: string[], tanggal_selesai?: string }): Promise<any> {
        const response = await api.post(`/aduan/${id}/convert-to-polling`, pollingData);
        return response.data;
    }
};
