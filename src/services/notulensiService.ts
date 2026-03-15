import axios from 'axios';
import { Notulensi, Kehadiran, Warga } from '../database/db';
import { ScopeType } from '../contexts/TenantContext';
import { aktivitasService } from './aktivitasService';

export interface KehadiranWithWarga extends Kehadiran {
    warga?: Warga;
}

export interface NotulensiWithKehadiran extends Notulensi {
    kehadiran_list?: KehadiranWithWarga[];
}

const API_URL = (import.meta as any).env.VITE_API_URL || '/api';

export const notulensiService = {
    async getAll(tenantId: string, scope: ScopeType): Promise<Notulensi[]> {
        try {
            const response = await axios.get(`${API_URL}/notulensi`, {
                params: { tenant_id: tenantId, scope }
            });
            const data = response.data;
            const items = Array.isArray(data) ? data : (data.items || []);
            return items.sort((a: Notulensi, b: Notulensi) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
        } catch (e) { console.error(e); throw e; }
    },

    async getById(id: string): Promise<NotulensiWithKehadiran | undefined> {
        try {
            const response = await axios.get(`${API_URL}/notulensi/${id}`);
            const notulensi = response.data;
            if (!notulensi) return undefined;

            // Fetch kehadiran specifically for this notulensi
            const kehadiranRes = await axios.get(`${API_URL}/kehadiran`, { params: { notulensi_id: id } });
            const kehadiranList = kehadiranRes.data;

            return {
                ...notulensi,
                kehadiran_list: kehadiranList
            };
        } catch (e) { console.error(e); throw e; }
    },

    async create(data: Omit<Notulensi, 'id'>, kehadiranData: { warga_id: string, status: Kehadiran['status'] }[]): Promise<string> {
        const notulensiRes = await axios.post(`${API_URL}/notulensi`, data);
        const newId = notulensiRes.data.id;

        if (kehadiranData.length > 0) {
            await axios.post(`${API_URL}/kehadiran/sync`, {
                tenant_id: data.tenant_id,
                notulensi_id: newId,
                data: kehadiranData
            });
        }

        await aktivitasService.logActivity(
            data.tenant_id,
            data.scope,
            'Buat Notulensi',
            `Membuat notulensi rapat: ${data.judul} (Tuan Rumah: ${data.tuan_rumah || '-'})`
        );

        return newId;
    },

    async update(id: string, data: Partial<Notulensi>, kehadiranData?: { warga_id: string, status: Kehadiran['status'] }[]): Promise<void> {
        await axios.put(`${API_URL}/notulensi/${id}`, data);

        if (kehadiranData && kehadiranData.length > 0) {
            await axios.post(`${API_URL}/kehadiran/sync`, {
                tenant_id: data.tenant_id || '',
                notulensi_id: id,
                data: kehadiranData
            });
        }

        await aktivitasService.logActivity(
            data.tenant_id || '',
            data.scope || 'RT',
            'Update Notulensi',
            `Memperbarui notulensi: ${data.judul}`
        );
    },

    async delete(id: string): Promise<void> {
        // Prisma's onDelete: Cascade will auto-delete kehadiran!
        await axios.delete(`${API_URL}/notulensi/${id}`);
    }
};
