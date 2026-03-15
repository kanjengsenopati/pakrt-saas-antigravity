import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const pengaturanService = {
    async getAll(tenantId: string, scope: string): Promise<Record<string, any>> {
        try {
            const response = await axios.get(`${API_URL}/pengaturan`, {
                params: { tenant_id: tenantId, scope }
            });
            const config: Record<string, any> = {};
            response.data.forEach((p: any) => {
                config[p.key] = p.value;
            });
            return config;
        } catch (e) { console.error(e); throw e; }
    },

    async getByKey(tenantId: string, scope: string, key: string): Promise<any | undefined> {
        try {
            const response = await axios.get(`${API_URL}/pengaturan`, {
                params: { tenant_id: tenantId, scope }
            });
            const item = response.data.find((p: any) => p.key === key);
            return item ? item.value : undefined;
        } catch (e) { console.error(e); throw e; }
    },

    async save(tenantId: string, scope: string, key: string, value: any): Promise<void> {
        try {
            const response = await axios.get(`${API_URL}/pengaturan`, {
                params: { tenant_id: tenantId, scope }
            });
            const existing = response.data.find((p: any) => p.key === key);

            if (existing) {
                await axios.put(`${API_URL}/pengaturan/${existing.id}`, { value: String(value) });
            } else {
                await axios.post(`${API_URL}/pengaturan`, {
                    tenant_id: tenantId,
                    scope,
                    key,
                    value: String(value)
                });
            }
        } catch (e) {
            console.error('Failed to save settings:', e);
            throw e;
        }
    },

    async saveMultiple(tenantId: string, scope: string, configs: Record<string, any>): Promise<void> {
        try {
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
