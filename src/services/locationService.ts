import api from './api';

export const locationService = {
    async getProvinsi() {
        const response = await api.get('/location/provinsi');
        return response.data;
    },
    async getKabKota(provinsiId: string) {
        const response = await api.get(`/location/kabkota/${provinsiId}`);
        return response.data;
    },
    async getKecamatan(kabKotaId: string) {
        const response = await api.get(`/location/kecamatan/${kabKotaId}`);
        return response.data;
    },
    async getKelDesa(kecamatanId: string) {
        const response = await api.get(`/location/keldesa/${kecamatanId}`);
        return response.data;
    },
    async getRW(kelDesaId: string) {
        const response = await api.get(`/location/rw/${kelDesaId}`);
        return response.data;
    },
    async getRT(rwId: string) {
        const response = await api.get(`/location/rt/${rwId}`);
        return response.data;
    },
    async getWilayahById(id: string) {
        try {
            const response = await api.get(`/location/id/${id}`);
            return response.data;
        } catch (error) {
            return null;
        }
    },
    async seedLocations() {
        await api.post('/location/seed');
    }
};
