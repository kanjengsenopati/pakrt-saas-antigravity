import axios from 'axios';
import { User } from '../database/db';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const userService = {
    async getAllByTenant(tenantId: string): Promise<User[]> {
        try {
            const response = await axios.get(`${API_URL}/user`, { params: { tenant_id: tenantId } });
            const data = response.data;
            return Array.isArray(data) ? data : (data.items || []);

        } catch (e) { console.error(e); throw e; }
    },

    async getById(id: string): Promise<User | undefined> {
        try {
            const response = await axios.get(`${API_URL}/user/${id}`);
            return response.data;
        } catch (e) { console.error(e); throw e; }
    },

    async updatePermissions(id: string, permissions: Record<string, string[]>): Promise<number> {
        try {
            await axios.put(`${API_URL}/user/${id}`, { permissions });
            return 1;
        } catch (e) { console.error(e); throw e; }
    },

    async updateRole(id: string, role: string): Promise<number> {
        try {
            await axios.put(`${API_URL}/user/${id}`, { role });
            return 1;
        } catch (e) { console.error(e); throw e; }
    },

    async update(id: string, data: Partial<User>): Promise<User> {
        try {
            const response = await axios.put(`${API_URL}/user/${id}`, data);
            return response.data;
        } catch (e) { console.error(e); throw e; }
    },

    async create(data: Omit<User, 'id'>): Promise<User> {
        try {
            const response = await axios.post(`${API_URL}/user`, data);
            return response.data;
        } catch (e) { console.error(e); throw e; }
    },

    async delete(id: string): Promise<void> {
        try {
            await axios.delete(`${API_URL}/user/${id}`);
        } catch (e) { console.error(e); throw e; }
    }
};
