import api from './api';
import { ScopeType } from '../contexts/TenantContext';

export const pushService = {
    async subscribe(subscription: any, warga_id?: string) {
        return api.post('/push/subscribe', { subscription, warga_id });
    },
    async unsubscribe(endpoint: string) {
        return api.post('/push/unsubscribe', { endpoint });
    },
    async broadcast(tenant_id: string, scope: ScopeType, payload: { title: string, body: string, data?: any }) {
        return api.post('/push/send', {
            tenant_id,
            scope,
            target: 'all',
            ...payload
        });
    },
    async sendToRole(tenant_id: string, scope: ScopeType, role: string, payload: { title: string, body: string, data?: any }) {
        return api.post('/push/send', {
            tenant_id,
            scope,
            target: 'role',
            role,
            ...payload
        });
    },
    async sendToUser(warga_id: string, payload: { title: string, body: string, data?: any }) {
        return api.post('/push/send', {
            target: 'user',
            warga_id,
            ...payload
        });
    }
};
