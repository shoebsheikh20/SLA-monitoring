import api from './api';
import { SLAStatus, SLAConfig } from '../types';

export const slaService = {
  getSLAStatus: async (): Promise<{ slaData: SLAStatus[] }> => {
    const res = await api.get('/sla');
    return res.data;
  },

  updateSLAConfig: async (
    serviceId: string,
    config: Partial<SLAConfig>
  ): Promise<{ config: SLAConfig }> => {
    const res = await api.put(`/sla/${serviceId}`, config);
    return res.data;
  },
};
