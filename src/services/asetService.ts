import api from './api';
import { Aset } from '../types/database';
import { ScopeType } from '../contexts/TenantContext';

export const asetService = {
    async getAll(tenantId: string, scope: ScopeType): Promise<Aset[]> {
        const response = await api.get('/aset', {
            params: { tenant_id: tenantId, scope }
        });
        const data = response.data;
        return Array.isArray(data) ? data : (data.items || []);
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

    // Booking Methods
    async getAllBookings(asetId?: string, status?: string) {
        const response = await api.get('/aset/booking', {
            params: { aset_id: asetId, status }
        });
        return response.data;
    },

    async createBooking(data: any) {
        return await api.post('/aset/booking', data);
    },

    async updateBookingStatus(id: string, status: string, catatan_admin?: string) {
        return await api.put(`/aset/booking/${id}/status`, { status, catatan_admin });
    },

    async deleteBooking(id: string) {
        return await api.delete(`/aset/booking/${id}`);
    },

    async count(tenantId: string, scope: ScopeType): Promise<number> {
        const response = await api.get('/aset/count', {
            params: { tenant_id: tenantId, scope }
        });
        return response.data.count;
    }
};
