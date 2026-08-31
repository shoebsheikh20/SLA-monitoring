import { Request, Response } from 'express';
import { prisma } from '../server';

const RANGE_MAP: Record<string, number> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

export const getMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceId, range = '24h', limit = '200' } = req.query as Record<string, string>;

    const rangeMs = RANGE_MAP[range] || RANGE_MAP['24h'];
    const since = new Date(Date.now() - rangeMs);
    const maxPoints = Math.min(500, parseInt(limit) || 200);

    const where: Record<string, unknown> = { timestamp: { gte: since } };
    if (serviceId) where.serviceId = serviceId;

    const metrics = await prisma.metric.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      take: maxPoints,
      include: {
        service: { select: { id: true, name: true } },
      },
    });

    res.json({ metrics, range, total: metrics.length });
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};

export const getServiceMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceId } = req.params;
    const { range = '24h' } = req.query as Record<string, string>;

    const rangeMs = RANGE_MAP[range] || RANGE_MAP['24h'];
    const since = new Date(Date.now() - rangeMs);

    const [metrics, service] = await Promise.all([
      prisma.metric.findMany({
        where: { serviceId, timestamp: { gte: since } },
        orderBy: { timestamp: 'asc' },
        take: 300,
      }),
      prisma.service.findUnique({ where: { id: serviceId } }),
    ]);

    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    // Calculate aggregates
    if (metrics.length === 0) {
      res.json({ metrics: [], aggregates: null, service });
      return;
    }

    const latencies = metrics.map((m) => m.latency).sort((a, b) => a - b);
    const pageTimes = metrics.map((m) => m.pageLoadTime).sort((a, b) => a - b);

    const p95Index = Math.floor(latencies.length * 0.95);
    const p99Index = Math.floor(latencies.length * 0.99);

    const aggregates = {
      avgLatency: latencies.reduce((s, v) => s + v, 0) / latencies.length,
      minLatency: latencies[0],
      maxLatency: latencies[latencies.length - 1],
      p95Latency: latencies[p95Index] || latencies[latencies.length - 1],
      p99Latency: latencies[p99Index] || latencies[latencies.length - 1],
      avgPageLoad: pageTimes.reduce((s, v) => s + v, 0) / pageTimes.length,
      minPageLoad: pageTimes[0],
      maxPageLoad: pageTimes[pageTimes.length - 1],
      p95PageLoad: pageTimes[Math.floor(pageTimes.length * 0.95)] || pageTimes[pageTimes.length - 1],
      avgUptime: metrics.reduce((s, m) => s + m.uptime, 0) / metrics.length,
      avgErrorRate: metrics.reduce((s, m) => s + m.errorRate, 0) / metrics.length,
    };

    res.json({ metrics, aggregates, service });
  } catch (error) {
    console.error('Get service metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch service metrics' });
  }
};

export const getLatestMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get the latest metric for each service
    const services = await prisma.service.findMany({
      include: {
        metrics: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    const result = services.map((s) => ({
      serviceId: s.id,
      serviceName: s.name,
      status: s.status,
      metric: s.metrics[0] || null,
    }));

    res.json({ data: result });
  } catch (error) {
    console.error('Get latest metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch latest metrics' });
  }
};
