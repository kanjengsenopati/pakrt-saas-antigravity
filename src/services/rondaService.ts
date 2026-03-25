import api from './api';
import { JadwalRonda } from '../types/database';
import { ScopeType } from '../contexts/TenantContext';

export const rondaService = {
    async getAll(tenantId: string, scope: ScopeType): Promise<JadwalRonda[]> {
        const response = await api.get('/ronda', {
            params: { tenant_id: tenantId, scope }
        });
        return response.data;
    },

    async getUpcoming(tenantId: string, scope: ScopeType, limit: number = 3): Promise<JadwalRonda[]> {
        const response = await api.get('/ronda/upcoming', {
            params: { tenant_id: tenantId, scope, limit }
        });
        return response.data;
    },

    async create(data: Omit<JadwalRonda, 'id'>): Promise<string> {
        const response = await api.post('/ronda', data);
        return response.data.id;
    },

    async update(id: string, data: Partial<JadwalRonda>): Promise<number> {
        await api.put(`/ronda/${id}`, data);
        return 1;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/ronda/${id}`);
    }
};
