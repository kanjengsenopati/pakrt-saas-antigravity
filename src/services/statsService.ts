import api from './api';

export const statsService = {
    async getDashboardStats(scope: string = 'RT') {
        const response = await api.get(`/stats/dashboard`, {
            params: { scope }
        });
        return response.data;
    },

    async getWargaPersonalStats() {
        const response = await api.get(`/stats/warga-personal`);
        return response.data;
    }
};
