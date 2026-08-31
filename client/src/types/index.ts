// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

// ─── Service ─────────────────────────────────────────────────────────────────
export interface Service {
  id: string;
  name: string;
  description: string;
  url: string;
  environment: string;
  region: string;
  status: 'healthy' | 'degraded' | 'at-risk' | 'down';
  slaTarget: number;
  latencyThreshold: number;
  pageLoadThreshold: number;
  errorRateThreshold: number;
  monitoringEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  latestMetric?: Metric | null;
  slaConfig?: SLAConfig | null;
}

// ─── Metric ──────────────────────────────────────────────────────────────────
export interface Metric {
  id: string;
  serviceId: string;
  latency: number;
  pageLoadTime: number;
  uptime: number;
  errorRate: number;
  timestamp: string;
}

export interface MetricAggregates {
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  p95Latency: number;
  p99Latency: number;
  avgPageLoad: number;
  minPageLoad: number;
  maxPageLoad: number;
  p95PageLoad: number;
  avgUptime: number;
  avgErrorRate: number;
}

// ─── SLA ─────────────────────────────────────────────────────────────────────
export interface SLAConfig {
  id: string;
  serviceId: string;
  availabilitySLA: number;
  responseTimeSLA: number;
  pageLoadSLA: number;
  errorRateSLA: number;
}

export interface SLAStatus {
  serviceId: string;
  serviceName: string;
  environment: string;
  region: string;
  slaTarget: number;
  currentUptime: number;
  currentLatency: number;
  currentPageLoad: number;
  currentErrorRate: number;
  latencyLimit: number;
  pageLoadLimit: number;
  errorRateLimit: number;
  status: 'healthy' | 'at-risk' | 'breached';
  uptimeOk: boolean;
  latencyOk: boolean;
  pageLoadOk: boolean;
  errorRateOk: boolean;
  lastChecked: string | null;
  slaConfig: SLAConfig | null;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface DashboardKPIs {
  uptime: number;
  uptimeSlaTarget: number;
  avgLatency: number;
  avgPageLoad: number;
  slaCompliance: number;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  services: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
  };
  incidents: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  unreadAlerts: number;
  serviceHealth: ServiceHealthSummary[];
}

export interface ServiceHealthSummary {
  id: string;
  name: string;
  status: string;
  latency: number;
  uptime: number;
  slaTarget: number;
}

// ─── Incident ─────────────────────────────────────────────────────────────────
export interface Incident {
  id: string;
  serviceId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved';
  slaImpact: number;
  notes: string;
  startedAt: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  service?: { id: string; name: string };
}

// ─── Alert ───────────────────────────────────────────────────────────────────
export interface Alert {
  id: string;
  serviceId: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  isRead: boolean;
  createdAt: string;
  service?: { id: string; name: string };
}

// ─── Reports ─────────────────────────────────────────────────────────────────
export interface ServiceReport {
  serviceId: string;
  serviceName: string;
  environment: string;
  region: string;
  slaTarget: number;
  avgLatency: number;
  avgPageLoad: number;
  avgUptime: number;
  avgErrorRate: number;
  incidentCount: number;
  slaBreaches: number;
  slaCompliance: number;
}

export interface ReportSummary {
  totalServices: number;
  totalMetrics: number;
  totalIncidents: number;
  resolvedIncidents: number;
  avgLatency: number;
  avgUptime: number;
  overallSLACompliance: number;
}

export interface Report {
  period: { from: string; to: string; range: string };
  summary: ReportSummary;
  serviceReports: ServiceReport[];
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ─── Toast ───────────────────────────────────────────────────────────────────
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}
