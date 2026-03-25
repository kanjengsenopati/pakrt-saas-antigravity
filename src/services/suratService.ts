import api from './api';
import { SuratPengantar, Warga } from '../types/database';
import { ScopeType } from '../contexts/TenantContext';

export type SuratWithWarga = SuratPengantar & { pemohon?: Warga, warga?: Warga };

export const suratService = {
    async getAll(tenantId: string, scope: ScopeType): Promise<SuratWithWarga[]> {
        const response = await api.get('/surat', {
            params: { tenant_id: tenantId, scope }
        });
        return response.data;
    },

    async getById(id: string): Promise<SuratWithWarga | undefined> {
        try {
            const response = await api.get(`/surat/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching surat by ID:', error);
            return undefined;
        }
    },

    async create(data: Omit<SuratPengantar, 'id'>): Promise<string> {
        const response = await api.post('/surat', data);
        return response.data.id;
    },

    async update(id: string, data: Partial<SuratPengantar>): Promise<number> {
        await api.put(`/surat/${id}`, data);
        return 1;
    },

    async updateStatus(id: string, status: string, alasan?: string): Promise<void> {
        await api.post(`/surat/status/${id}`, { status, alasan_penolakan: alasan });
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/surat/${id}`);
    }
};
