import api from './api';
import { Alert, Pagination } from '../types';

export const alertsService = {
  getAlerts: async (params?: {
    isRead?: boolean;
    severity?: string;
    serviceId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ alerts: Alert[]; unreadCount: number; pagination: Pagination }> => {
    const res = await api.get('/alerts', { params });
    return res.data;
  },

  markRead: async (id: string): Promise<{ alert: Alert }> => {
    const res = await api.put(`/alerts/${id}/read`);
    return res.data;
  },

  markAllRead: async (): Promise<void> => {
    await api.put('/alerts/read-all');
  },

  deleteAlert: async (id: string): Promise<void> => {
    await api.delete(`/alerts/${id}`);
  },

  clearAlerts: async (params?: { severity?: string; isRead?: boolean }): Promise<void> => {
    await api.delete('/alerts/clear', { params });
  },
};
