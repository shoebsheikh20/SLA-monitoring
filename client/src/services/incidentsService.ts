import api from './api';
import { Incident, Pagination } from '../types';

export const incidentsService = {
  getIncidents: async (params?: {
    status?: string;
    severity?: string;
    serviceId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ incidents: Incident[]; pagination: Pagination }> => {
    const res = await api.get('/incidents', { params });
    return res.data;
  },

  createIncident: async (data: {
    serviceId: string;
    severity: string;
    title: string;
    description?: string;
    slaImpact?: number;
  }): Promise<{ incident: Incident }> => {
    const res = await api.post('/incidents', data);
    return res.data;
  },

  updateIncident: async (
    id: string,
    data: Partial<Incident>
  ): Promise<{ incident: Incident }> => {
    const res = await api.put(`/incidents/${id}`, data);
    return res.data;
  },

  deleteIncident: async (id: string): Promise<void> => {
    await api.delete(`/incidents/${id}`);
  },
};
