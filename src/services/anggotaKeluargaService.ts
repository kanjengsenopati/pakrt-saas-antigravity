import api from './api';
import { AnggotaKeluarga } from '../types/database';

export const anggotaKeluargaService = {
    async getByWargaId(wargaId: string): Promise<AnggotaKeluarga[]> {
        const response = await api.get(`/anggota-keluarga/${wargaId}`);
        return response.data;
    },

    // Alias for backward compatibility with components using this name
    async getAllByWargaId(wargaId: string): Promise<AnggotaKeluarga[]> {
        return this.getByWargaId(wargaId);
    },

    async create(data: Omit<AnggotaKeluarga, 'id'>): Promise<string> {
        const response = await api.post('/anggota-keluarga', data);
        return response.data.id;
    },

    async update(id: string, data: Partial<AnggotaKeluarga>): Promise<number> {
        await api.put(`/anggota-keluarga/${id}`, data);
        return 1;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/anggota-keluarga/${id}`);
    }
};
