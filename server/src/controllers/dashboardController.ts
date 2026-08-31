import { Response } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/auth';

export const getDashboard = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const services = await prisma.service.findMany({
      include: {
        metrics: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    const totalServices = services.length;
    const healthyServices = services.filter((s) => s.status === 'healthy').length;
    const degradedServices = services.filter((s) => s.status === 'degraded').length;
    const downServices = services.filter((s) => s.status === 'down').length;

    // Aggregate latest metrics
    const latestMetrics = services
      .map((s) => s.metrics[0])
      .filter(Boolean);

    const avgLatency =
      latestMetrics.length > 0
        ? latestMetrics.reduce((sum, m) => sum + m.latency, 0) / latestMetrics.length
        : 0;

    const avgPageLoad =
      latestMetrics.length > 0
        ? latestMetrics.reduce((sum, m) => sum + m.pageLoadTime, 0) / latestMetrics.length
        : 0;

    const avgUptime =
      latestMetrics.length > 0
        ? latestMetrics.reduce((sum, m) => sum + m.uptime, 0) / latestMetrics.length
        : 99.9;

    // SLA compliance — check what percentage of services are meeting their SLA
    const slaCompliantCount = services.filter((s) => {
      const metric = s.metrics[0];
      if (!metric) return true;
      return (
        metric.latency <= s.latencyThreshold &&
        metric.pageLoadTime <= s.pageLoadThreshold &&
        metric.uptime >= s.slaTarget &&
        metric.errorRate <= s.errorRateThreshold
      );
    }).length;

    const slaCompliance =
      totalServices > 0 ? (slaCompliantCount / totalServices) * 100 : 100;

    // Active incidents
    const activeIncidents = await prisma.incident.groupBy({
      by: ['severity'],
      where: { status: { not: 'resolved' } },
      _count: true,
    });

    const incidentCounts = {
      total: activeIncidents.reduce((sum, i) => sum + i._count, 0),
      critical: activeIncidents.find((i) => i.severity === 'critical')?._count || 0,
      high: activeIncidents.find((i) => i.severity === 'high')?._count || 0,
      medium: activeIncidents.find((i) => i.severity === 'medium')?._count || 0,
      low: activeIncidents.find((i) => i.severity === 'low')?._count || 0,
    };

    // Unread alerts count
    const unreadAlerts = await prisma.alert.count({ where: { isRead: false } });

    // Recent service statuses
    const serviceHealth = services.map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      latency: s.metrics[0]?.latency || 0,
      uptime: s.metrics[0]?.uptime || 99.9,
      slaTarget: s.slaTarget,
    }));

    res.json({
      kpis: {
        uptime: Math.round(avgUptime * 1000) / 1000,
        uptimeSlaTarget: 99.9,
        avgLatency: Math.round(avgLatency * 10) / 10,
        avgPageLoad: Math.round(avgPageLoad * 100) / 100,
        slaCompliance: Math.round(slaCompliance * 100) / 100,
      },
      services: {
        total: totalServices,
        healthy: healthyServices,
        degraded: degradedServices,
        down: downServices,
      },
      incidents: incidentCounts,
      unreadAlerts,
      serviceHealth,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};
