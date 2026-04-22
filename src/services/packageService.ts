import api from './api';

export const packageService = {
  async getAll() {
    const response = await api.get('/packages/all');
    return response.data;
  },

  async getPublic() {
    const response = await api.get('/packages');
    return response.data;
  },

  async create(data: any) {
    const response = await api.post('/packages', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await api.put(`/packages/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/packages/${id}`);
    return response.data;
  }
};

