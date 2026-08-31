import { Request, Response } from 'express';
import { prisma } from '../server';

function getDateRange(range: string, startDate?: string, endDate?: string): { from: Date; to: Date } {
  const to = endDate ? new Date(endDate) : new Date();
  let from: Date;

  switch (range) {
    case 'today':
      from = new Date();
      from.setHours(0, 0, 0, 0);
      break;
    case '7d':
      from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'custom':
      from = startDate ? new Date(startDate) : new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    default:
      from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return { from, to };
}

export const getReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { range = '7d', startDate, endDate } = req.query as Record<string, string>;
    const { from, to } = getDateRange(range, startDate, endDate);

    const [services, metrics, incidents] = await Promise.all([
      prisma.service.findMany({
        include: { slaConfig: true },
      }),
      prisma.metric.findMany({
        where: { timestamp: { gte: from, lte: to } },
        include: { service: { select: { id: true, name: true } } },
      }),
      prisma.incident.findMany({
        where: { startedAt: { gte: from, lte: to } },
        include: { service: { select: { id: true, name: true } } },
      }),
    ]);

    // Aggregate by service
    const serviceReports = services.map((service) => {
      const svcMetrics = metrics.filter((m) => m.serviceId === service.id);
      const svcIncidents = incidents.filter((i) => i.serviceId === service.id);

      if (svcMetrics.length === 0) {
        return {
          serviceId: service.id,
          serviceName: service.name,
          environment: service.environment,
          region: service.region,
          slaTarget: service.slaTarget,
          avgLatency: 0,
          avgPageLoad: 0,
          avgUptime: 99.9,
          avgErrorRate: 0,
          incidentCount: svcIncidents.length,
          slaBreaches: 0,
          slaCompliance: 100,
        };
      }

      const avgLatency = svcMetrics.reduce((s, m) => s + m.latency, 0) / svcMetrics.length;
      const avgPageLoad = svcMetrics.reduce((s, m) => s + m.pageLoadTime, 0) / svcMetrics.length;
      const avgUptime = svcMetrics.reduce((s, m) => s + m.uptime, 0) / svcMetrics.length;
      const avgErrorRate = svcMetrics.reduce((s, m) => s + m.errorRate, 0) / svcMetrics.length;

      const breachCount = svcMetrics.filter(
        (m) =>
          m.latency > service.latencyThreshold ||
          m.pageLoadTime > service.pageLoadThreshold ||
          m.uptime < service.slaTarget ||
          m.errorRate > service.errorRateThreshold
      ).length;

      const slaCompliance = ((svcMetrics.length - breachCount) / svcMetrics.length) * 100;

      return {
        serviceId: service.id,
        serviceName: service.name,
        environment: service.environment,
        region: service.region,
        slaTarget: service.slaTarget,
        avgLatency: Math.round(avgLatency * 10) / 10,
        avgPageLoad: Math.round(avgPageLoad * 100) / 100,
        avgUptime: Math.round(avgUptime * 1000) / 1000,
        avgErrorRate: Math.round(avgErrorRate * 100) / 100,
        incidentCount: svcIncidents.length,
        slaBreaches: breachCount,
        slaCompliance: Math.round(slaCompliance * 100) / 100,
      };
    });

    // Overall summary
    const totalMetrics = metrics.length;
    const overallAvgLatency = totalMetrics > 0
      ? metrics.reduce((s, m) => s + m.latency, 0) / totalMetrics
      : 0;
    const overallAvgUptime = totalMetrics > 0
      ? metrics.reduce((s, m) => s + m.uptime, 0) / totalMetrics
      : 99.9;
    const overallCompliance = serviceReports.length > 0
      ? serviceReports.reduce((s, r) => s + r.slaCompliance, 0) / serviceReports.length
      : 100;

    res.json({
      period: { from: from.toISOString(), to: to.toISOString(), range },
      summary: {
        totalServices: services.length,
        totalMetrics,
        totalIncidents: incidents.length,
        resolvedIncidents: incidents.filter((i) => i.status === 'resolved').length,
        avgLatency: Math.round(overallAvgLatency * 10) / 10,
        avgUptime: Math.round(overallAvgUptime * 1000) / 1000,
        overallSLACompliance: Math.round(overallCompliance * 100) / 100,
      },
      serviceReports,
    });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

export const exportCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    const { range = '7d', startDate, endDate } = req.query as Record<string, string>;
    const { from, to } = getDateRange(range, startDate, endDate);

    const services = await prisma.service.findMany({
      include: { slaConfig: true },
    });

    const metrics = await prisma.metric.findMany({
      where: { timestamp: { gte: from, lte: to } },
      include: { service: { select: { id: true, name: true } } },
      orderBy: { timestamp: 'asc' },
    });

    // Build CSV
    const headers = [
      'Service', 'Timestamp', 'Latency (ms)', 'Page Load (s)',
      'Uptime (%)', 'Error Rate (%)', 'Latency SLA', 'Status'
    ];

    const rows = metrics.map((m) => {
      const service = services.find((s) => s.id === m.serviceId);
      const latencyOk = m.latency <= (service?.latencyThreshold ?? 500);
      const status = latencyOk ? 'OK' : 'BREACH';
      return [
        `"${m.service.name}"`,
        new Date(m.timestamp).toISOString(),
        m.latency.toFixed(1),
        m.pageLoadTime.toFixed(2),
        m.uptime.toFixed(3),
        m.errorRate.toFixed(2),
        service?.latencyThreshold ?? 500,
        status,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    const filename = `sla-report-${range}-${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
};
