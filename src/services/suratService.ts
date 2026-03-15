import axios from 'axios';
import { SuratPengantar, Warga } from '../database/db';
import { ScopeType } from '../contexts/TenantContext';
import { aktivitasService } from './aktivitasService';

export interface SuratWithWarga extends SuratPengantar {
    pemohon?: Warga;
}

const API_URL = (import.meta as any).env.VITE_API_URL || '/api';

export const suratService = {
    async getAll(tenantId: string, scope: ScopeType): Promise<SuratWithWarga[]> {
        try {
            const response = await axios.get(`${API_URL}/suratPengantar`, {
                params: { tenant_id: tenantId, scope }
            });
            // Result is sorted by backend, and includes warga
            const data = response.data;
            const items = Array.isArray(data) ? data : (data.items || []);
            return items.map((s: any) => ({
                ...s,
                pemohon: s.warga
            }));
        } catch (e) { console.error(e); throw e; }
    },

    async getById(id: string): Promise<SuratWithWarga | undefined> {
        try {
            const response = await axios.get(`${API_URL}/suratPengantar/${id}`);
            if (response.data && response.data.warga) {
                response.data.pemohon = response.data.warga;
            }
            return response.data;
        } catch (e) { console.error(e); throw e; }
    },

    async create(data: Omit<SuratPengantar, 'id'>): Promise<string> {
        const response = await axios.post(`${API_URL}/suratPengantar`, data);
        await aktivitasService.logActivity(
            data.tenant_id,
            data.scope,
            'Buat Surat',
            `Membuat surat pengantar baru: ${data.jenis_surat}`
        );
        return response.data.id;
    },

    async update(id: string, data: Partial<SuratPengantar>): Promise<number> {
        await axios.put(`${API_URL}/suratPengantar/${id}`, data);
        return 1;
    },

    async updateStatus(id: string, status: SuratPengantar['status']): Promise<number> {
        // Backend handles "generate nomor_surat" if status is 'selesai'
        await axios.put(`${API_URL}/suratPengantar/${id}`, { status });
        return 1;
    },

    async delete(id: string): Promise<void> {
        await axios.delete(`${API_URL}/suratPengantar/${id}`);
    }
};
