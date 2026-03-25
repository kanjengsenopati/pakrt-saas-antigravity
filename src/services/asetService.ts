import api from './api';
import { Aset } from '../types/database';
import { ScopeType } from '../contexts/TenantContext';
import { aktivitasService } from './aktivitasService';

export const asetService = {
    async getAll(tenantId: string, scope: ScopeType): Promise<Aset[]> {
        const response = await api.get('/aset', {
            params: { tenant_id: tenantId, scope }
        });
        return response.data;
    },

    async getById(id: string): Promise<Aset | undefined> {
        try {
            const response = await api.get(`/aset/${id}`);
            return response.data;
        } catch (error) {
            return undefined;
        }
    },

    async create(data: Omit<Aset, 'id'>): Promise<string> {
        const response = await api.post('/aset', data);
        await aktivitasService.logActivity(
            data.tenant_id,
            data.scope,
            'Tambah Aset (Cloud)',
            `Menambahkan aset baru: ${data.nama_barang}`
        );
        return response.data.id;
    },

    async update(id: string, data: Partial<Aset>): Promise<number> {
        const response = await api.put(`/aset/${id}`, data);
        const updated = response.data;
        if (updated) {
            await aktivitasService.logActivity(
                updated.tenant_id || data.tenant_id || '',
                updated.scope || data.scope || 'RT',
                'Update Aset (Cloud)',
                `Memperbarui data aset: ${updated.nama_barang || data.nama_barang}`
            );
        }
        return response.status === 200 ? 1 : 0;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/aset/${id}`);
    }
};
