import axios from 'axios';
import { JadwalRonda, Warga } from '../database/db';
import { ScopeType } from '../contexts/TenantContext';
import { aktivitasService } from './aktivitasService';

export interface RondaWithWarga extends JadwalRonda {
    anggota_warga?: Warga[];
    anggota_konsumsi?: Warga[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const rondaService = {
    async getAll(tenantId: string, scope: ScopeType): Promise<RondaWithWarga[]> {
        const jadwalRes = await axios.get(`${API_URL}/jadwalRonda`, {
            params: { tenant_id: tenantId, scope }
        });
        const data = jadwalRes.data;
        const items = Array.isArray(data) ? data : (data.items || []);
        const jadwalList = items.sort((a: JadwalRonda, b: JadwalRonda) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

        const wargaRes = await axios.get(`${API_URL}/warga`, { params: { tenant_id: tenantId } });
        const wargaData = wargaRes.data;
        const wargaItems = Array.isArray(wargaData) ? wargaData : (wargaData.items || []);
        const wargaMap = new Map(wargaItems.map((w: Warga) => [w.id, w]));

        return jadwalList.map((j: any) => ({
            ...j,
            anggota_warga: (j.warga_ids || []).map((id: string) => wargaMap.get(id)).filter((w: any) => w !== undefined),
            anggota_konsumsi: (j.petugas_konsumsi || []).map((id: string) => wargaMap.get(id)).filter((w: any) => w !== undefined)
        }));
    },

    async getById(id: string): Promise<RondaWithWarga | undefined> {
        try {
            const response = await axios.get(`${API_URL}/jadwalRonda/${id}`);
            return response.data;
        } catch (e) { console.error(e); throw e; }
    },

    async create(data: Omit<JadwalRonda, 'id'>): Promise<string> {
        const response = await axios.post(`${API_URL}/jadwalRonda`, data);
        await aktivitasService.logActivity(
            data.tenant_id,
            data.scope,
            'Buat Jadwal Ronda',
            `Membuat jadwal ronda baru untuk tanggal: ${data.tanggal}`
        );
        return response.data.id;
    },

    async createMany(dataList: Omit<JadwalRonda, 'id'>[]): Promise<string[]> {
        if (dataList.length === 0) return [];
        const ids = [];
        for (const data of dataList) {
            const res = await axios.post(`${API_URL}/jadwalRonda`, data);
            ids.push(res.data.id);
        }
        await aktivitasService.logActivity(
            dataList[0].tenant_id,
            dataList[0].scope,
            'Buat Jadwal Ronda Rutin',
            `Membuat ${dataList.length} jadwal ronda rutin/otomatis`
        );
        return ids;
    },

    async update(id: string, data: Partial<JadwalRonda>): Promise<number> {
        await axios.put(`${API_URL}/jadwalRonda/${id}`, data);
        return 1;
    },

    async updateKehadiran(id: string, kehadiranWargaIds: string[]): Promise<number> {
        await axios.put(`${API_URL}/jadwalRonda/${id}`, { kehadiran_warga: kehadiranWargaIds });
        return 1;
    },

    async delete(id: string): Promise<void> {
        await axios.delete(`${API_URL}/jadwalRonda/${id}`);
    }
};
