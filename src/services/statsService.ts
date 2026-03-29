import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const statsService = {
    async getDashboardStats(scope: string = 'RT') {
        const response = await axios.get(`${API_URL}/stats/dashboard`, {
            params: { scope },
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return response.data;
    },

    async getWargaPersonalStats() {
        const response = await axios.get(`${API_URL}/stats/warga-personal`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return response.data;
    }
};
