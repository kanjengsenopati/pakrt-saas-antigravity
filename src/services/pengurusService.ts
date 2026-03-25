import api from './api';
import { Pengurus, Warga } from '../types/database';
import { ScopeType } from '../contexts/TenantContext';

export type PengurusWithWarga = Pengurus & { warga?: Warga };

export const pengurusService = {
    async getAll(tenantId: string, scope: ScopeType): Promise<PengurusWithWarga[]> {
        const response = await api.get('/pengurus', {
            params: { tenant_id: tenantId, scope }
        });
        const data = response.data;
        return Array.isArray(data) ? data : (data.items || []);
    },

    async getById(id: string): Promise<PengurusWithWarga | undefined> {
        const response = await api.get(`/pengurus/${id}`);
        return response.data;
    },

    async create(data: Omit<Pengurus, 'id'>): Promise<string> {
        const response = await api.post('/pengurus', data);
        return response.data.id;
    },

    async update(id: string, data: Partial<Pengurus>): Promise<void> {
        await api.put(`/pengurus/${id}`, data);
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/pengurus/${id}`);
    },

    async count(tenantId: string, scope: ScopeType): Promise<number> {
        const response = await api.get('/pengurus/count', {
            params: { tenant_id: tenantId, scope }
        });
        return response.data.count;
    }
};
