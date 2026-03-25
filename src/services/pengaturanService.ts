import api from './api';
import { Pengaturan } from '../types/database';

export const pengaturanService = {
    async getByKey(tenantId: string, scope: string, key: string): Promise<Pengaturan | undefined> {
        try {
            const response = await api.get('/pengaturan/key', {
                params: { tenant_id: tenantId, scope, key }
            });
            return response.data;
        } catch (e) { return undefined; }
    },

    async getAll(tenantId: string, scope: string): Promise<Pengaturan[]> {
        const response = await api.get('/pengaturan', {
            params: { tenant_id: tenantId, scope }
        });
        return response.data;
    },

    async upsert(data: Omit<Pengaturan, 'id'>): Promise<string> {
        const response = await api.post('/pengaturan', data);
        return response.data.id;
    },

    async updateWargaStatus(tenantId: string, scope: string, wargaId: string, status: string): Promise<void> {
        await api.post('/pengaturan/warga-status', { tenant_id: tenantId, scope, warga_id: wargaId, status });
    }
};
