import api from './api';
import { User } from '../types/database';

export const userService = {
    async getAll(tenantId: string): Promise<User[]> {
        const response = await api.get('/users', {
            params: { tenant_id: tenantId }
        });
        return response.data;
    },

    async create(data: Omit<User, 'id'>): Promise<string> {
        const response = await api.post('/users', data);
        return response.data.id;
    },

    async update(id: string, data: Partial<User>): Promise<number> {
        await api.put(`/users/${id}`, data);
        return 1;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/users/${id}`);
    }
};
