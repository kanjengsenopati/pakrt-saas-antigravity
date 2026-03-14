import axios from 'axios';
import { Pengurus, Warga } from '../database/db';
import { ScopeType } from '../contexts/TenantContext';
import { aktivitasService } from './aktivitasService';

export interface PengurusWithWarga extends Pengurus {
    warga?: Warga;
}

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000/api';

export const pengurusService = {
    async getAll(tenantId: string, scope: ScopeType): Promise<any[]> {
        try {
            const response = await axios.get(`${API_URL}/pengurus`, {
                params: { tenant_id: tenantId, scope }
            });
            const data = response.data;
            return Array.isArray(data) ? data : (data.items || []);

        } catch (e) { console.error(e); throw e; }
    },

    async count(tenantId: string, scope: ScopeType): Promise<number> {
        const data = await this.getAll(tenantId, scope);
        return data.length;
    },

    async getById(id: string): Promise<Pengurus | undefined> {
        try {
            const response = await axios.get(`${API_URL}/pengurus/${id}`);
            return response.data;
        } catch (e) { console.error(e); throw e; }
    },

    async create(data: Omit<Pengurus, 'id'>): Promise<string> {
        const response = await axios.post(`${API_URL}/pengurus`, data);
        await aktivitasService.logActivity(
            data.tenant_id,
            data.scope,
            'Tambah Pengurus',
            `Menambahkan pengurus baru: ${data.jabatan}`
        );
        return response.data.id;
    },

    async update(id: string, data: Partial<Pengurus>): Promise<number> {
        const response = await axios.put(`${API_URL}/pengurus/${id}`, data);
        const updated = response.data;
        if (updated) {
            await aktivitasService.logActivity(
                updated.tenant_id || data.tenant_id || '',
                updated.scope || data.scope || 'RT',
                'Update Pengurus',
                `Memperbarui jabatan pengurus: ${updated.jabatan} (Periode: ${updated.periode})`
            );
        }
        return 1;
    },

    async delete(id: string): Promise<void> {
        await axios.delete(`${API_URL}/pengurus/${id}`);
    }
};
