import api from './api';
import { Notulensi, Kehadiran } from '../types/database';
import { ScopeType } from '../contexts/TenantContext';

export type NotulensiWithKehadiran = Notulensi & { kehadiran?: Kehadiran[], kehadiran_list?: Kehadiran[] };

export const notulensiService = {
    async getAll(tenantId: string, scope: ScopeType): Promise<NotulensiWithKehadiran[]> {
        const response = await api.get('/notulensi', {
            params: { tenant_id: tenantId, scope }
        });
        // Attach attendance list if returning from API as and alias
        return response.data.map((n: any) => ({
            ...n,
            kehadiran_list: n.kehadiran || n.kehadiran_list
        }));
    },

    async getById(id: string): Promise<NotulensiWithKehadiran | undefined> {
        try {
            const response = await api.get(`/notulensi/${id}`);
            const data = response.data;
            if (data) {
                data.kehadiran_list = data.kehadiran || data.kehadiran_list;
            }
            return data;
        } catch (error) {
            return undefined;
        }
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
