import api from './api';
import { Agenda } from '../types/database';
import { ScopeType } from '../contexts/TenantContext';
import { aktivitasService } from './aktivitasService';
import { notulensiService } from './notulensiService';

export const agendaService = {
    async getAll(tenantId: string, scope: ScopeType): Promise<Agenda[]> {
        try {
            const response = await api.get(`/agenda`, {
                params: { tenant_id: tenantId, scope }
            });
            const data = response.data;
            const items = Array.isArray(data) ? data : (data.items || []);
            return items.sort((a: Agenda, b: Agenda) => b.tanggal.localeCompare(a.tanggal));
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    async count(tenantId: string, scope: ScopeType): Promise<number> {
        const data = await this.getAll(tenantId, scope);
        return data.length;
    },

    async getUpcoming(tenantId: string, scope: ScopeType, limit: number = 5): Promise<Agenda[]> {
        try {
            const response = await api.get(`/agenda`, {
                params: { tenant_id: tenantId, scope }
            });
            const data = response.data;
            const items = Array.isArray(data) ? data : (data.items || []);
            const today = new Date().toISOString().split('T')[0];
            return items
                .filter((a: Agenda) => a.tanggal >= today)
                .sort((a: Agenda, b: Agenda) => a.tanggal.localeCompare(b.tanggal))
                .slice(0, limit);
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    async getById(id: string): Promise<Agenda | undefined> {
        try {
            const response = await api.get(`/agenda/${id}`);
            return response.data;
        } catch (error) {
            return undefined;
        }
    },

    async create(data: Omit<Agenda, 'id'>): Promise<string> {
        const response = await api.post(`/agenda`, data);
        const newId = response.data.id;

        // Auto-create Notulensi if requested
        if (data.perlu_rapat) {
            try {
                await notulensiService.create({
                    tenant_id: data.tenant_id,
                    scope: data.scope,
                    judul: `Rapat: ${data.judul}`,
                    tanggal: data.tanggal,
                    tuan_rumah: data.tuan_rumah,
                    tuan_rumah_id: data.tuan_rumah_id,
                    lokasi: data.lokasi,
                    jam_mulai: data.jam_mulai,
                    jam_selesai: data.jam_selesai,
                    konten: `Laporan rapat otomatis dari Agenda: ${data.judul}.\n\nKeterangan: ${data.keterangan_tambahan || '-'}`,
                    agenda_id: newId
                });
            } catch (err) {
                console.error("Gagal membuat notulensi otomatis:", err);
            }
        }

        await aktivitasService.logActivity(
            data.tenant_id,
            data.scope as ScopeType,
            'Buat Agenda',
            `Membuat agenda baru: ${data.judul} ${data.perlu_rapat ? '(Auto-create Notulen)' : ''}`
        );
        return newId;
    },

    async update(id: string, data: Partial<Agenda>): Promise<number> {
        const response = await api.put(`/agenda/${id}`, data);
        if (response.data) {
            await aktivitasService.logActivity(
                response.data.tenant_id || data.tenant_id || '',
                (response.data.scope || data.scope || 'RT') as ScopeType,
                'Update Agenda',
                `Memperbarui agenda: ${response.data.judul || data.judul || 'tanpa judul'}`
            );
        }
        return 1;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/agenda/${id}`);
    }
};
