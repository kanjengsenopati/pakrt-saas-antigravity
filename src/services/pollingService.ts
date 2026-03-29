import api from './api';
import { ScopeType } from '../contexts/TenantContext';

export interface Polling {
    id: string;
    tenant_id: string;
    scope: string;
    aduan_usulan_id: string;
    pertanyaan: string;
    status: 'Aktif' | 'Selesai';
    tanggal_mulai: string;
    tanggal_selesai?: string;
    aduan_usulan?: any;
    opsi?: any[];
    votes?: any[];
}

export const pollingService = {
    async getAll(status?: 'Aktif' | 'Selesai', scope?: ScopeType): Promise<Polling[]> {
        const response = await api.get('/polling', {
            params: { status, scope }
        });
        return response.data;
    },

    async getById(id: string): Promise<Polling> {
        const response = await api.get(`/polling/${id}`);
        return response.data;
    },

    async vote(pollingId: string, opsiId: string): Promise<any> {
        const response = await api.post(`/polling/${pollingId}/vote`, { opsiId });
        return response.data;
    },

    async updateStatus(id: string, status: 'Aktif' | 'Selesai'): Promise<any> {
        const response = await api.patch(`/polling/${id}/status`, { status });
        return response.data;
    }
};
