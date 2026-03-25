import api from './api';
import { Aset } from '../types/database';
import { ScopeType } from '../contexts/TenantContext';

export const asetService = {
    async getAll(tenantId: string, scope: ScopeType): Promise<Aset[]> {
        const response = await api.get('/aset', {
            params: { tenant_id: tenantId, scope }
        });
        return response.data;
    },

    async getById(id: string): Promise<Aset | undefined> {
        const response = await api.get(`/aset/${id}`);
        return response.data;
    },

    async create(data: Omit<Aset, 'id'>): Promise<string> {
        const response = await api.post('/aset', data);
        return response.data.id;
    },

    async update(id: string, data: Partial<Aset>): Promise<number> {
        await api.put(`/aset/${id}`, data);
        return 1;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/aset/${id}`);
    },

    async count(tenantId: string, scope: ScopeType): Promise<number> {
        const response = await api.get('/aset/count', {
            params: { tenant_id: tenantId, scope }
        });
        return response.data.count;
    }
};
