import axios from 'axios';
import { AnggotaKeluarga } from '../database/db';
import { aktivitasService } from './aktivitasService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const anggotaKeluargaService = {
    async getAllByWargaId(wargaId: string): Promise<AnggotaKeluarga[]> {
        try {
            const response = await axios.get(`${API_URL}/anggotaKeluarga`, {
                params: { warga_id: wargaId }
            });
            const data = response.data;
            return Array.isArray(data) ? data : (data.items || []);
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    async create(data: Omit<AnggotaKeluarga, 'id'>): Promise<string> {
        const response = await axios.post(`${API_URL}/anggotaKeluarga`, data);
        await aktivitasService.logActivity(
            data.tenant_id,
            'RT',
            'Tambah Anggota',
            `Menambahkan anggota keluarga: ${data.nama}`
        );
        return response.data.id;
    },

    async update(id: string, data: Partial<AnggotaKeluarga>): Promise<number> {
        await axios.put(`${API_URL}/anggotaKeluarga/${id}`, data);
        // We might not have tenant_id in partial data, so we might need to fetch first if we want strict logging
        // But for now, let's keep it simple or assume we have context if needed.
        return 1;
    },

    async delete(id: string): Promise<void> {
        await axios.delete(`${API_URL}/anggotaKeluarga/${id}`);
    }
};
