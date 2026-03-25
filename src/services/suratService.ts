import api from './api';
import { SuratPengantar } from '../types/database';
import { ScopeType } from '../contexts/TenantContext';

export const suratService = {
    async getAll(tenantId: string, scope: ScopeType): Promise<SuratPengantar[]> {
        const response = await api.get('/surat', {
            params: { tenant_id: tenantId, scope }
        });
        return response.data;
    },

    async create(data: Omit<SuratPengantar, 'id'>): Promise<string> {
        const response = await api.post('/surat', data);
        return response.data.id;
    },

    async update(id: string, data: Partial<SuratPengantar>): Promise<number> {
        await api.put(`/surat/${id}`, data);
        return 1;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/surat/${id}`);
    }
};
