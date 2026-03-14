import axios from 'axios';
import { Aset } from '../database/db';
import { ScopeType } from '../contexts/TenantContext';
import { aktivitasService } from './aktivitasService';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000/api';

export const asetService = {
    async getAll(tenantId: string, scope: ScopeType): Promise<Aset[]> {
        const response = await axios.get(`${API_URL}/aset`, {
            params: { tenant_id: tenantId, scope }
        });
        return response.data;
    },

    async count(tenantId: string, scope: ScopeType): Promise<number> {
        const data = await this.getAll(tenantId, scope);
        return data.length;
    },

    async getById(id: string): Promise<Aset | undefined> {
        try {
            const response = await axios.get(`${API_URL}/aset/${id}`);
            return response.data;
        } catch (error) {
            return undefined;
        }
    },

    async create(data: Omit<Aset, 'id'>): Promise<string> {
        const response = await axios.post(`${API_URL}/aset`, data);
        await aktivitasService.logActivity(
            data.tenant_id,
            data.scope,
            'Tambah Aset',
            `Menambahkan aset baru: ${data.nama_barang}`
        );
        return response.data.id;
    },

    async update(id: string, data: Partial<Aset>): Promise<number> {
        const response = await axios.put(`${API_URL}/aset/${id}`, data);
        const updated = response.data;
        if (updated) {
            await aktivitasService.logActivity(
                updated.tenant_id || data.tenant_id || '',
                updated.scope || data.scope || 'RT',
                'Update Aset',
                `Memperbarui data aset: ${updated.nama_barang} (Jumlah: ${updated.jumlah})`
            );
        }
        return 1;
    },

    async delete(id: string): Promise<void> {
        await axios.delete(`${API_URL}/aset/${id}`);
    }
};
