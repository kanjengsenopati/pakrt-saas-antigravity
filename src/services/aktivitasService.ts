import api from './api';
import { Aktivitas } from '../types/database';
import { ScopeType } from '../contexts/TenantContext';

export const aktivitasService = {
    async logActivity(tenantId: string, scope: ScopeType, action: string, details: string): Promise<string> {
        try {
            const response = await api.post('/aktivitas', {
                tenant_id: tenantId,
                scope,
                action,
                details,
                timestamp: Date.now()
            });
            return response.data.id;
        } catch (e) { console.error(e); throw e; }
    },

    async getRecent(tenantId: string, scope: ScopeType, limit: number = 5): Promise<Aktivitas[]> {
        try {
            const response = await api.get('/aktivitas', {
                params: { tenant_id: tenantId, scope }
            });
            const data = response.data;
            const items = Array.isArray(data) ? data : (data.items || []);
            return items
                .sort((a: Aktivitas, b: Aktivitas) => b.timestamp - a.timestamp)
                .slice(0, limit);
        } catch (e) { console.error(e); throw e; }
    },

    async getAll(tenantId: string, scope: ScopeType): Promise<Aktivitas[]> {
        try {
            const response = await api.get('/aktivitas', {
                params: { tenant_id: tenantId, scope }
            });
            const data = response.data;
            const items = Array.isArray(data) ? data : (data.items || []);
            return items.sort((a: Aktivitas, b: Aktivitas) => b.timestamp - a.timestamp);
        } catch (e) { console.error(e); throw e; }
    }
};
