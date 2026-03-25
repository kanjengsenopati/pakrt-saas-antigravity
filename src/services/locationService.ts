import api from './api';
import { Wilayah } from '../types/database';

export const locationService = {
    async getProvinsi(): Promise<Wilayah[]> {
        const response = await api.get('/location/provinsi');
        return response.data;
    },

    async getKabupaten(provinsiId: string): Promise<Wilayah[]> {
        const response = await api.get(`/location/kabupaten/${provinsiId}`);
        return response.data;
    },

    async getKecamatan(kabupatenId: string): Promise<Wilayah[]> {
        const response = await api.get(`/location/kecamatan/${kabupatenId}`);
        return response.data;
    },

    async getKelurahan(kecamatanId: string): Promise<Wilayah[]> {
        const response = await api.get(`/location/kelurahan/${kecamatanId}`);
        return response.data;
    }
};
