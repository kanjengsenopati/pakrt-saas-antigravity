import api from './api';
import { Warga } from '../types/database';
import { ScopeType } from '../contexts/TenantContext';
import { aktivitasService } from './aktivitasService';

export const wargaService = {
    async getAll(tenantId: string, scope: ScopeType, page: number = 1, limit: number = 100): Promise<{ items: Warga[], total: number, page: number, limit: number }> {
        const response = await api.get('/warga', {
            params: { tenant_id: tenantId, scope, page, limit }
        });
        const data = response.data;
        if (Array.isArray(data)) {
            return { items: data, total: data.length, page: 1, limit: data.length };
        }
        return data || { items: [], total: 0, page, limit };
    },

    async count(tenantId: string, scope: ScopeType): Promise<number> {
        const data = await this.getAll(tenantId, scope);
        return data.total;
    },

    async getById(id: string): Promise<Warga | undefined> {
        try {
            const response = await api.get(`/warga/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching warga by ID:', error);
            return undefined;
        }
    },

    async create(data: Omit<Warga, 'id'>): Promise<string> {
        try {
            const response = await api.post('/warga', data);

            await aktivitasService.logActivity(
                data.tenant_id,
                data.scope,
                'Tambah Warga (Cloud)',
                `Menambahkan warga baru: ${data.nama}`
            );

            return response.data.id;
        } catch (error) {
            console.error('Error creating warga:', error);
            throw error;
        }
    },

    async update(id: string, data: Partial<Warga>): Promise<number> {
        try {
            const response = await api.put(`/warga/${id}`, data);

            if (response.data) {
                await aktivitasService.logActivity(
                    response.data.tenant_id || data.tenant_id || '',
                    response.data.scope || data.scope || 'RT',
                    'Update Warga (Cloud)',
                    `Memperbarui data warga: ${response.data.nama || data.nama}`
                );
            }

            return response.status === 200 ? 1 : 0;
        } catch (error) {
            console.error('Error updating warga:', error);
            throw error;
        }
    },

    async delete(id: string): Promise<void> {
        try {
            await api.delete(`/warga/${id}`);
        } catch (error) {
            console.error('Error deleting warga:', error);
            throw error;
        }
    },

    async exportWarga(scope?: string): Promise<void> {
        try {
            const response = await api.get('/warga/export', {
                params: { scope },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `data_warga_${scope || 'semua'}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting warga:', error);
            throw error;
        }
    },

    async importWarga(file: File): Promise<number> {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await api.post('/warga/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            return response.data.count;
        } catch (error) {
            console.error('Error importing warga:', error);
            throw error;
        }
    },

    async getPending(): Promise<Warga[]> {
        const response = await api.get('/warga/pending');
        return response.data;
    },

    async verifyWarga(id: string, status: 'VERIFIED' | 'REJECTED'): Promise<void> {
        await api.post(`/warga/verify/${id}`, { status });
    },

    async downloadTemplate(): Promise<void> {
        try {
            const response = await api.get('/warga/template', {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'template_import_warga.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading template:', error);
            throw error;
        }
    }
};
