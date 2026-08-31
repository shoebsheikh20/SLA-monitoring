import api from './api';
import { Report } from '../types';

export const reportsService = {
  getReport: async (params?: {
    range?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Report> => {
    const res = await api.get('/reports', { params });
    return res.data;
  },

  exportCSV: async (params?: {
    range?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<void> => {
    const res = await api.get('/reports/export', {
      params,
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const range = params?.range || '7d';
    a.download = `sla-report-${range}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
