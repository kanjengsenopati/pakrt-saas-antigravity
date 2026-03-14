import axios from 'axios';
import { Wilayah } from '../database/db';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const locationService = {
    async getProvinsi(): Promise<Wilayah[]> {
        try {
            const response = await axios.get(`${API_URL}/wilayah?level=provinsi`);
            return response.data;
        } catch (e) { console.error(e); throw e; }
    },
    async getKabKota(provId: string): Promise<Wilayah[]> {
        try {
            const response = await axios.get(`${API_URL}/wilayah?level=kabkota&parent_id=${provId}`);
            return response.data;
        } catch (e) { console.error(e); throw e; }
    },
    async getKecamatan(kabId: string): Promise<Wilayah[]> {
        try {
            const response = await axios.get(`${API_URL}/wilayah?level=kecamatan&parent_id=${kabId}`);
            return response.data;
        } catch (e) { console.error(e); throw e; }
    },
    async getKelDesa(kecId: string): Promise<Wilayah[]> {
        try {
            const response = await axios.get(`${API_URL}/wilayah?level=keldesa&parent_id=${kecId}`);
            return response.data;
        } catch (e) { console.error(e); throw e; }
    },
    async getRW(kelId: string): Promise<Wilayah[]> {
        try {
            const response = await axios.get(`${API_URL}/wilayah?level=rw&parent_id=${kelId}`);
            return response.data;
        } catch (e) { console.error(e); throw e; }
    },
    async getRT(rwId: string): Promise<Wilayah[]> {
        try {
            const response = await axios.get(`${API_URL}/wilayah?level=rt&parent_id=${rwId}`);
            return response.data;
        } catch (e) { console.error(e); throw e; }
    },
    async getWilayahById(id: string): Promise<Wilayah> {
        try {
            const response = await axios.get(`${API_URL}/wilayah/${id}`);
            return response.data;
        } catch (e) { console.error(e); throw e; }
    },

    async seedLocations(data: Wilayah[]): Promise<void> {
        try {
            const exist = await axios.get(`${API_URL}/wilayah`);
            if (exist.data.length === 0) {
                await axios.post(`${API_URL}/wilayah/bulk`, { data });
            }
        } catch (e) {
            console.error('Failed to seed locations:', e);
        }
    }
};
