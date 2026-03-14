import axios from 'axios';
import { Keuangan } from '../database/db';
import { ScopeType } from '../contexts/TenantContext';
import { aktivitasService } from './aktivitasService';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000/api';

export const keuanganService = {
    async getAll(tenantId: string, scope: ScopeType, page: number = 1, limit: number = 200): Promise<{ items: Keuangan[], total: number, page: number, limit: number }> {
        try {
            const response = await axios.get(`${API_URL}/keuangan`, {
                params: { tenant_id: tenantId, scope, page, limit }
            });
            // Result is now paginated, but we might still want to sort the items
            if (response.data && response.data.items) {
                response.data.items.sort((a: Keuangan, b: Keuangan) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
            }
            return response.data;
        } catch (e) { console.error(e); throw e; }
    },

    async getById(id: string): Promise<Keuangan | undefined> {
        try {
            const response = await axios.get(`${API_URL}/keuangan/${id}`);
            return response.data;
        } catch (e) { console.error(e); throw e; }
    },

    async create(data: Omit<Keuangan, 'id'>): Promise<string> {
        const response = await axios.post(`${API_URL}/keuangan`, data);
        await aktivitasService.logActivity(
            data.tenant_id,
            data.scope,
            'Input Transaksi',
            `${data.tipe === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'} baru: ${data.keterangan}`
        );
        return response.data.id;
    },

    async update(id: string, data: Partial<Omit<Keuangan, 'id' | 'tenant_id' | 'scope'>>): Promise<number> {
        await axios.put(`${API_URL}/keuangan/${id}`, data);
        return 1;
    },

    async delete(id: string): Promise<void> {
        await axios.delete(`${API_URL}/keuangan/${id}`);
    },

    async getSummary(tenantId: string, scope: ScopeType): Promise<{ kasMasuk: number, kasKeluar: number, saldo: number }> {
        const data = await this.getAll(tenantId, scope, 1, 1000); // Fetch more for summary
        let kasMasuk = 0;
        let kasKeluar = 0;

        data.items.forEach(trx => {
            if (trx.tipe === 'pemasukan') kasMasuk += trx.nominal;
            else if (trx.tipe === 'pengeluaran') kasKeluar += trx.nominal;
        });

        return {
            kasMasuk,
            kasKeluar,
            saldo: kasMasuk - kasKeluar
        };
    }
};
