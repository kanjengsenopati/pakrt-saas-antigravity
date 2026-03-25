import api from './api';
import { User } from '../types/database';

export const authService = {
    async login(contactOrEmail: string, password: string): Promise<{ token: string; user: User }> {
        const response = await api.post('/auth/login', {
            contactOrEmail,
            password
        });
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

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    async joinResident(tenantId: string, residentData: any): Promise<any> {
        const response = await api.post('/auth/join', {
            tenantId,
            residentData
        });
        return response.data;
    }
};
