import axios from 'axios';
import { User } from '../database/db';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const authService = {
    async login(contactOrEmail: string, password: string): Promise<{ token: string; user: User }> {
        const response = await axios.post(`${API_URL}/auth/login`, {
            contactOrEmail,
            password
        });
        return response.data;
    },

    async checkTenant(id: string): Promise<{ exists: boolean; tenant?: any }> {
        const response = await axios.get(`${API_URL}/auth/tenant/${id}`);
        return response.data;
    },

    async register(tenantData: any, userData: any): Promise<{ message: string; tenant: any; user: any }> {
        const response = await axios.post(`${API_URL}/auth/register`, {
            tenantData,
            userData
        });
        return response.data;
    },

    logout(): void {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    }
};
