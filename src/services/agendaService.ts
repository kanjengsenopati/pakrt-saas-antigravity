import api from './api';
import { Agenda } from '../types/database';
import { ScopeType } from '../contexts/TenantContext';
import { aktivitasService } from './aktivitasService';

export const agendaService = {
    async getAll(tenantId: string, scope: ScopeType): Promise<Agenda[]> {
        try {
            const response = await api.get(`/agenda`, {
                params: { tenant_id: tenantId, scope }
            });
            const data = response.data;
            const items = Array.isArray(data) ? data : (data.items || []);
            return items.sort((a: Agenda, b: Agenda) => b.tanggal.localeCompare(a.tanggal));
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    async count(tenantId: string, scope: ScopeType): Promise<number> {
        const data = await this.getAll(tenantId, scope);
        return data.length;
    },

    async getUpcoming(tenantId: string, scope: ScopeType, limit: number = 5): Promise<Agenda[]> {
        try {
            const response = await api.get(`/agenda`, {
                params: { tenant_id: tenantId, scope }
            });
            const data = response.data;
            const items = Array.isArray(data) ? data : (data.items || []);
            const today = new Date().toISOString().split('T')[0];
            return items
                .filter((a: Agenda) => a.tanggal >= today)
                .sort((a: Agenda, b: Agenda) => a.tanggal.localeCompare(b.tanggal))
                .slice(0, limit);
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    async getById(id: string): Promise<Agenda | undefined> {
        try {
            const response = await api.get(`/agenda/${id}`);
            return response.data;
        } catch (error) {
            return undefined;
        }
    },

    async create(data: Omit<Agenda, 'id'>): Promise<string> {
        const response = await api.post(`/agenda`, data);
        await aktivitasService.logActivity(
            data.tenant_id,
            data.scope,
            'Buat Agenda',
            `Membuat agenda baru: ${data.judul}`
        );
        return response.data.id;
    },

    async update(id: string, data: Partial<Agenda>): Promise<number> {
        const response = await api.put(`/agenda/${id}`, data);
        if (response.data) {
            await aktivitasService.logActivity(
                response.data.tenant_id || data.tenant_id || '',
                response.data.scope || data.scope || 'RT',
                'Update Agenda',
                `Memperbarui agenda: ${response.data.judul || data.judul || 'tanpa judul'}`
            );
        }
        return 1;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/agenda/${id}`);
    }
};
