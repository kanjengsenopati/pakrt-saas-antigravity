import api from './api';
import { Keuangan } from '../types/database';
import { ScopeType } from '../contexts/TenantContext';
import { aktivitasService } from './aktivitasService';

export const keuanganService = {
    async getAll(tenantId: string, scope: ScopeType, page: number = 1, limit: number = 200): Promise<{ items: Keuangan[], total: number, page: number, limit: number }> {
        try {
            const response = await api.get('/keuangan', {
                params: { tenant_id: tenantId, scope, page, limit }
            });
            return response.data;
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    async getById(id: string): Promise<Keuangan | undefined> {
        try {
            const response = await api.get(`/keuangan/${id}`);
            return response.data;
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    async create(data: Omit<Keuangan, 'id'>): Promise<string> {
        const response = await api.post('/keuangan', data);
        await aktivitasService.logActivity(
            data.tenant_id,
            data.scope,
            'Tambah Transaksi (Cloud)',
            `Mencatat ${data.tipe}: ${data.keterangan}`
        );
        return response.data.id;
    },

    async update(id: string, data: Partial<Omit<Keuangan, 'id' | 'tenant_id' | 'scope'>>): Promise<number> {
        await api.put(`/keuangan/${id}`, data);
        return 1;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/keuangan/${id}`);
    },

    async getSummary(tenantId: string, scope: ScopeType): Promise<{ kasMasuk: number, kasKeluar: number, saldo: number }> {
        const response = await api.get('/keuangan/summary', {
            params: { tenant_id: tenantId, scope }
        });
        return response.data;
    }
};
