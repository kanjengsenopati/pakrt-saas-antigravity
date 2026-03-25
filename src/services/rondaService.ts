import api from './api';
import { JadwalRonda, Warga } from '../types/database';
import { ScopeType } from '../contexts/TenantContext';

export type RondaWithWarga = JadwalRonda & { 
    anggota_warga?: Warga[];
    anggota_konsumsi?: Warga[];
};

export const rondaService = {
    async getAll(tenantId: string, scope: ScopeType): Promise<RondaWithWarga[]> {
        const response = await api.get('/ronda', {
            params: { tenant_id: tenantId, scope }
        });
        const data = response.data;
        return Array.isArray(data) ? data : (data.items || []);
    },

    async getUpcoming(tenantId: string, scope: ScopeType, limit: number = 5): Promise<RondaWithWarga[]> {
        const response = await api.get('/ronda/upcoming', {
            params: { tenant_id: tenantId, scope, limit }
        });
        const data = response.data;
        return Array.isArray(data) ? data : (data.items || []);
    },

    async getById(id: string): Promise<RondaWithWarga | undefined> {
        const response = await api.get(`/ronda/${id}`);
        return response.data;
    },

    async create(data: Omit<JadwalRonda, 'id'>): Promise<string> {
        const response = await api.post('/ronda', data);
        return response.data.id;
    },

    async createMany(data: Omit<JadwalRonda, 'id'>[]): Promise<void> {
        await api.post('/ronda/batch', { items: data });
    },

    async update(id: string, data: Partial<JadwalRonda>): Promise<number> {
        await api.put(`/ronda/${id}`, data);
        return 1;
    },

    async updateKehadiran(id: string, kehadiran: string[]): Promise<void> {
        await api.post(`/ronda/${id}/kehadiran`, { kehadiran_warga: kehadiran });
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/ronda/${id}`);
    }
};
