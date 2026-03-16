import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// In-memory cache for settings
let settingsCache: Record<string, { data: Record<string, any>, timestamp: number }> = {};
const CACHE_TTL = 300000; // 5 minutes

export const pengaturanService = {
    async getAll(tenantId: string, scope: string): Promise<Record<string, any>> {
        const cacheKey = `${tenantId}:${scope}`;
        const cached = settingsCache[cacheKey];
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        }

        try {
            const response = await axios.get(`${API_URL}/pengaturan`, {
                params: { tenant_id: tenantId, scope }
            });
            const config: Record<string, any> = {};
            response.data.forEach((p: any) => {
                config[p.key] = p.value;
            });

            settingsCache[cacheKey] = { data: config, timestamp: Date.now() };
            return config;
        } catch (e) { console.error(e); throw e; }
    },

    async getByKey(tenantId: string, scope: string, key: string): Promise<any | undefined> {
        const config = await this.getAll(tenantId, scope);
        return config[key];
    },

    async save(tenantId: string, scope: string, key: string, value: any): Promise<void> {
        try {
            const cacheKey = `${tenantId}:${scope}`;
            delete settingsCache[cacheKey]; // Invalidate cache

            const response = await axios.get(`${API_URL}/pengaturan`, {
                params: { tenant_id: tenantId, scope }
            });
            const existing = response.data.find((p: any) => p.key === key);

            const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

            if (existing) {
                await axios.put(`${API_URL}/pengaturan/${existing.id}`, { value: strValue });
            } else {
                await axios.post(`${API_URL}/pengaturan`, {
                    tenant_id: tenantId,
                    scope,
                    key,
                    value: strValue
                });
            }
        } catch (e) {
            console.error('Failed to save settings:', e);
            throw e;
        }
    },

    async saveMultiple(tenantId: string, scope: string, configs: Record<string, any>): Promise<void> {
        try {
            const cacheKey = `${tenantId}:${scope}`;
            delete settingsCache[cacheKey]; // Invalidate cache

            const response = await axios.get(`${API_URL}/pengaturan`, {
                params: { tenant_id: tenantId, scope }
            });
            const existingData = response.data;

            const promises = Object.entries(configs).map(([key, value]) => {
                const existing = existingData.find((p: any) => p.key === key);
                const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

                if (existing) {
                    return axios.put(`${API_URL}/pengaturan/${existing.id}`, { value: strValue });
                } else {
                    return axios.post(`${API_URL}/pengaturan`, {
                        tenant_id: tenantId,
                        scope,
                        key,
                        value: strValue
                    });
                }
            });

            await Promise.all(promises);
        } catch (error) {
            console.error('Failed to save multiple settings:', error);
            throw error;
        }
    }
};
