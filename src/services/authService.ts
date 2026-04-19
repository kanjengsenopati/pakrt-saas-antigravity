import api from './api';
import { User } from '../types/database';

export const authService = {
    async login(contactOrEmail: string, password: string): Promise<{ user: User }> {
        const response = await api.post('/auth/login', {
            contactOrEmail,
            password
        });
        return response.data; // token is now in header Set-Cookie
    },

    async getMe(): Promise<{ user: User }> {
        const response = await api.get('/auth/me');
        return response.data;
    },

    async checkTenant(id: string): Promise<{ exists: boolean; tenant?: any }> {
        const response = await api.get(`/auth/tenant/${id}`);
        return response.data;
    },

    async register(tenantData: any, userData: any): Promise<{ message: string; tenant: any; user: User }> {
        const response = await api.post('/auth/register', {
            tenantData,
            userData
        });
        return response.data;
    },

    async logout() {
        await api.post('/auth/logout');
        localStorage.removeItem('auth_user'); // Still keep user JSON for UI till next session
    },

    async joinResident(tenantId: string, residentData: any): Promise<any> {
        const response = await api.post('/auth/join', {
            tenantId,
            residentData
        });
        return response.data;
    }
};
