import api from './api';
import { Notulensi, Kehadiran } from '../types/database';
import { ScopeType } from '../contexts/TenantContext';
import { aktivitasService } from './aktivitasService';

export const notulensiService = {
    async getAll(tenantId: string, scope: ScopeType): Promise<Notulensi[]> {
        const response = await api.get('/notulensi', {
            params: { tenant_id: tenantId, scope }
        });
        return response.data;
    },

    async getById(id: string): Promise<Notulensi | undefined> {
        try {
            const response = await api.get(`/notulensi/${id}`);
            return response.data;
        } catch (e) { return undefined; }
    },

    async create(data: Omit<Notulensi, 'id'>): Promise<string> {
        const response = await api.post('/notulensi', data);
        await aktivitasService.logActivity(
            data.tenant_id,
            data.scope,
            'Tambah Notulensi (Cloud)',
            `Mencatat notulensi: ${data.judul}`
        );
        return response.data.id;
    },

    async update(id: string, data: Partial<Notulensi>): Promise<number> {
        await api.put(`/notulensi/${id}`, data);
        return 1;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/notulensi/${id}`);
    },

    async getKehadiran(notulensiId: string): Promise<Kehadiran[]> {
        const response = await api.get(`/notulensi/${notulensiId}/kehadiran`);
        return response.data;
    },

    async saveKehadiran(notulensiId: string, kehadiran: Kehadiran[]): Promise<void> {
        await api.post(`/notulensi/${notulensiId}/kehadiran`, { kehadiran });
    }
};
