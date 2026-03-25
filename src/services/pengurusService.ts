import api from './api';
import { Pengurus } from '../types/database';
import { ScopeType } from '../contexts/TenantContext';

export const pengurusService = {
    async getAll(tenantId: string, scope: ScopeType): Promise<Pengurus[]> {
        const response = await api.get('/pengurus', {
            params: { tenant_id: tenantId, scope }
        });
        return response.data;
    },

    async create(data: Omit<Pengurus, 'id'>): Promise<string> {
        const response = await api.post('/pengurus', data);
        return response.data.id;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/pengurus/${id}`);
    }
};
