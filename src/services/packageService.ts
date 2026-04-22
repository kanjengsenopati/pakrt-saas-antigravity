import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100/api';

export const packageService = {
  async getAll() {
    const response = await axios.get(`${API_URL}/packages/all`, { withCredentials: true });
    return response.data;
  },

  async getPublic() {
    const response = await axios.get(`${API_URL}/packages`);
    return response.data;
  },

  async create(data: any) {
    const response = await axios.post(`${API_URL}/packages`, data, { withCredentials: true });
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await axios.put(`${API_URL}/packages/${id}`, data, { withCredentials: true });
    return response.data;
  },

  async delete(id: string) {
    const response = await axios.delete(`${API_URL}/packages/${id}`, { withCredentials: true });
    return response.data;
  }
};
