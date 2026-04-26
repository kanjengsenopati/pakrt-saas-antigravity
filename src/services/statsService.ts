import api from './api';

export interface WargaPersonalStats {
    kasRT: number;
    iuranPendingCount: number;
    iuranUnpaidMonths: number;
    suratProsesCount: number;
}

export const statsService = {
    async getDashboardStats(scope: string = 'RT') {
        const response = await api.get(`/stats/dashboard`, {
            params: { scope }
        });
        return response.data;
    },

    async getWargaPersonalStats(): Promise<WargaPersonalStats> {
        const response = await api.get(`/stats/warga-personal`);
        return response.data;
    }
};
