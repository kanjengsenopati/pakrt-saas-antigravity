import api from './api';
import { User } from '../types/database';

export const userService = {
    async getAll(tenantId: string): Promise<User[]> {
        const response = await api.get('/users', {
            params: { tenant_id: tenantId }
        });
        return response.data;
    },

    async getAllByTenant(tenantId: string): Promise<User[]> {
        return this.getAll(tenantId);
    },

    async getById(id: string): Promise<User | undefined> {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    async create(data: Omit<User, 'id'>): Promise<string> {
        const response = await api.post('/users', data);
        return response.data.id;
    },

    async update(id: string, data: Partial<User>): Promise<User> {
        const response = await api.put(`/users/${id}`, data);
        // Usually the backend returns the updated object, if not we merge
        return response.data;
    },

    async updatePermissions(id: string, permissions: Record<string, string[]>): Promise<void> {
        await api.put(`/users/${id}/permissions`, { permissions });
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/users/${id}`);
    }
};
