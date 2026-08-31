import api from './api';
import { Service, Pagination } from '../types';

export interface ServicesResponse {
  services: Service[];
  pagination: Pagination;
}

export const servicesService = {
  getServices: async (params?: {
    search?: string;
    status?: string;
    environment?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ServicesResponse> => {
    const res = await api.get('/services', { params });
    return res.data;
  },

  getService: async (id: string): Promise<{ service: Service }> => {
    const res = await api.get(`/services/${id}`);
    return res.data;
  },

  createService: async (data: Partial<Service>): Promise<{ service: Service }> => {
    const res = await api.post('/services', data);
    return res.data;
  },

  updateService: async (id: string, data: Partial<Service>): Promise<{ service: Service }> => {
    const res = await api.put(`/services/${id}`, data);
    return res.data;
  },

  deleteService: async (id: string): Promise<void> => {
    await api.delete(`/services/${id}`);
  },

  toggleMonitoring: async (id: string, enabled: boolean): Promise<{ service: Service }> => {
    const res = await api.patch(`/services/${id}/monitoring`, { enabled });
    return res.data;
  },
};
