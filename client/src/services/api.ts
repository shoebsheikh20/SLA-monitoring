/// <reference types="vite/client" />
import axios from 'axios';
import {
  demoUser,
  demoServices,
  demoDashboardData,
  demoIncidents,
  demoAlerts,
  demoSLAList,
  generateDemoMetrics,
  demoReport,
} from './demoData';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sla_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors & provide Demo Data Fallback for standalone static client deployments (e.g. Vercel)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isNetworkError = !error.response || error.code === 'ERR_NETWORK';
    const isNotFound = error.response?.status === 404;

    // If static client deployment on Vercel (no backend API endpoint found)
    if (isNetworkError || isNotFound) {
      const url = error.config?.url || '';

      if (url.includes('/auth/login')) {
        return Promise.resolve({
          data: { user: demoUser, token: 'demo-jwt-token-slapulse' },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
        });
      }

      if (url.includes('/auth/me')) {
        return Promise.resolve({
          data: { user: demoUser },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
        });
      }

      if (url.includes('/dashboard')) {
        return Promise.resolve({
          data: demoDashboardData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
        });
      }

      if (url.includes('/services')) {
        if (error.config?.method === 'post') {
          const body = JSON.parse(error.config?.data || '{}');
          const newSrv = {
            id: `srv-${Date.now()}`,
            name: body.name || 'New Monitored Service',
            description: body.description || 'Custom monitored service',
            url: body.url || 'https://api.example.com',
            environment: body.environment || 'Production',
            region: body.region || 'us-east-1',
            status: 'healthy' as const,
            slaTarget: Number(body.slaTarget) || 99.9,
            latencyThreshold: Number(body.latencyThreshold) || 200,
            pageLoadThreshold: Number(body.pageLoadThreshold) || 1.0,
            errorRateThreshold: Number(body.errorRateThreshold) || 0.05,
            monitoringEnabled: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          demoServices.unshift(newSrv);
          return Promise.resolve({
            data: { service: newSrv },
            status: 201,
            statusText: 'Created',
            headers: {},
            config: error.config,
          });
        }
        return Promise.resolve({
          data: {
            services: demoServices,
            pagination: { page: 1, limit: 15, total: demoServices.length, pages: 1 },
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
        });
      }

      if (url.includes('/metrics')) {
        return Promise.resolve({
          data: {
            metrics: generateDemoMetrics(),
            aggregates: {
              avgLatency: 142,
              minLatency: 18,
              maxLatency: 1420,
              p95Latency: 350,
              p99Latency: 1200,
              avgPageLoad: 0.88,
              minPageLoad: 0.15,
              maxPageLoad: 3.8,
              p95PageLoad: 1.5,
              avgUptime: 99.98,
              avgErrorRate: 0.02,
            },
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
        });
      }

      if (url.includes('/sla')) {
        return Promise.resolve({
          data: { slaData: demoSLAList, slaStatuses: demoSLAList },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
        });
      }

      if (url.includes('/incidents')) {
        return Promise.resolve({
          data: {
            incidents: demoIncidents,
            pagination: { page: 1, limit: 15, total: demoIncidents.length, pages: 1 },
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
        });
      }

      if (url.includes('/alerts')) {
        return Promise.resolve({
          data: {
            alerts: demoAlerts,
            pagination: { page: 1, limit: 15, total: demoAlerts.length, pages: 1 },
            unreadCount: 2,
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
        });
      }

      if (url.includes('/reports')) {
        return Promise.resolve({
          data: demoReport,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
        });
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('sla_token');
      localStorage.removeItem('sla_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
