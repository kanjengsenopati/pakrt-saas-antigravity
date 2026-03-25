import api from './api';
import { PembayaranIuran } from '../types/database';
import { ScopeType } from '../contexts/TenantContext';
import { aktivitasService } from './aktivitasService';

export const iuranService = {
    async getAll(tenantId: string, scope: ScopeType, page: number = 1, limit: number = 200): Promise<{ items: PembayaranIuran[], total: number, page: number, limit: number }> {
        try {
            const response = await api.get('/iuran', {
                params: { tenant_id: tenantId, scope, page, limit }
            });
            return response.data;
        } catch (e) { console.error(e); throw e; }
    },

    async getById(id: string): Promise<PembayaranIuran | undefined> {
        try {
            const response = await api.get(`/iuran/${id}`);
            return response.data;
        } catch (e) {
            console.error(e);
            return undefined;
        }
    },

    async create(data: Omit<PembayaranIuran, 'id'>): Promise<string> {
        const response = await api.post('/iuran', data);
        await aktivitasService.logActivity(
            data.tenant_id,
            'RT', // Default scope if not in data
            'Pembayaran Iuran (Cloud)',
            `Menerima pembayaran dari warga_id: ${data.warga_id}`
        );
        return response.data.id;
    },

    async update(id: string, data: Partial<PembayaranIuran>): Promise<number> {
        await api.put(`/iuran/${id}`, data);
        return 1;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/iuran/${id}`);
    },

    async getSummary(tenantId: string, scope: ScopeType): Promise<any> {
        const response = await api.get('/iuran/summary', {
            params: { tenant_id: tenantId, scope }
        });
        return response.data;
    },

    async verify(id: string, status: 'VERIFIED' | 'REJECTED', alasan?: string): Promise<void> {
        await api.post(`/iuran/verify/${id}`, { status, alasan_penolakan: alasan });
    }
};
