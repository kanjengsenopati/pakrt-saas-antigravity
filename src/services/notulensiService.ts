import api from './api';
import { Notulensi, Kehadiran } from '../types/database';
import { ScopeType } from '../contexts/TenantContext';

export type NotulensiWithKehadiran = Notulensi & { kehadiran?: Kehadiran[] };

export const notulensiService = {
    async getAll(tenantId: string, scope: ScopeType): Promise<Notulensi[]> {
        const response = await api.get('/notulensi', {
            params: { tenant_id: tenantId, scope }
        });
        return response.data;
    },

    async create(data: Omit<Notulensi, 'id'>, kehadiran?: any[]): Promise<string> {
        const response = await api.post('/notulensi', { ...data, kehadiran });
        return response.data.id;
    },

    async update(id: string, data: Partial<Notulensi>, kehadiran?: any[]): Promise<number> {
        await api.put(`/notulensi/${id}`, { ...data, kehadiran });
        return 1;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/notulensi/${id}`);
    }
};
