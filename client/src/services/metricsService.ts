import api from './api';
import { Metric, MetricAggregates } from '../types';

export const metricsService = {
  getMetrics: async (params?: {
    serviceId?: string;
    range?: string;
    limit?: number;
  }): Promise<{ metrics: Metric[]; range: string; total: number }> => {
    const res = await api.get('/metrics', { params });
    return res.data;
  },

  getServiceMetrics: async (
    serviceId: string,
    range?: string
  ): Promise<{
    metrics: Metric[];
    aggregates: MetricAggregates | null;
    service: { id: string; name: string };
  }> => {
    const res = await api.get(`/metrics/${serviceId}`, { params: { range } });
    return res.data;
  },

  getLatestMetrics: async () => {
    const res = await api.get('/metrics/latest');
    return res.data;
  },
};
