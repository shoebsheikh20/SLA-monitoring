import { Request, Response } from 'express';
import { prisma } from '../server';

export const getSLAStatus = async (_req: Request, res: Response): Promise<void> => {
  try {
    const services = await prisma.service.findMany({
      include: {
        slaConfig: true,
        metrics: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    const slaData = services.map((s) => {
      const metric = s.metrics[0];
      const config = s.slaConfig;
      const slaTarget = config?.availabilitySLA ?? s.slaTarget;
      const latencyLimit = config?.responseTimeSLA ?? s.latencyThreshold;
      const pageLoadLimit = config?.pageLoadSLA ?? s.pageLoadThreshold;
      const errorRateLimit = config?.errorRateSLA ?? s.errorRateThreshold;

      const currentUptime = metric?.uptime ?? 99.9;
      const currentLatency = metric?.latency ?? 0;
      const currentPageLoad = metric?.pageLoadTime ?? 0;
      const currentErrorRate = metric?.errorRate ?? 0;

      const uptimeOk = currentUptime >= slaTarget;
      const latencyOk = currentLatency <= latencyLimit;
      const pageLoadOk = currentPageLoad <= pageLoadLimit;
      const errorRateOk = currentErrorRate <= errorRateLimit;

      let status: string;
      if (!uptimeOk || (currentLatency > latencyLimit * 1.5)) {
        status = 'breached';
      } else if (!latencyOk || !pageLoadOk || !errorRateOk) {
        status = 'at-risk';
      } else {
        status = 'healthy';
      }

      return {
        serviceId: s.id,
        serviceName: s.name,
        environment: s.environment,
        region: s.region,
        slaTarget,
        currentUptime,
        currentLatency,
        currentPageLoad,
        currentErrorRate,
        latencyLimit,
        pageLoadLimit,
        errorRateLimit,
        status,
        uptimeOk,
        latencyOk,
        pageLoadOk,
        errorRateOk,
        lastChecked: metric?.timestamp ?? null,
        slaConfig: config,
      };
    });

    res.json({ slaData });
  } catch (error) {
    console.error('SLA status error:', error);
    res.status(500).json({ error: 'Failed to fetch SLA status' });
  }
};

export const updateSLAConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceId } = req.params;
    const {
      availabilitySLA,
      responseTimeSLA,
      pageLoadSLA,
      errorRateSLA,
    } = req.body;

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    // Validate values
    if (availabilitySLA !== undefined && (availabilitySLA < 0 || availabilitySLA > 100)) {
      res.status(400).json({ error: 'Availability SLA must be between 0 and 100' });
      return;
    }
    if (responseTimeSLA !== undefined && responseTimeSLA < 1) {
      res.status(400).json({ error: 'Response time SLA must be at least 1ms' });
      return;
    }

    const config = await prisma.sLAConfig.upsert({
      where: { serviceId },
      create: {
        serviceId,
        availabilitySLA: availabilitySLA ?? 99.9,
        responseTimeSLA: responseTimeSLA ?? 500,
        pageLoadSLA: pageLoadSLA ?? 2.0,
        errorRateSLA: errorRateSLA ?? 1.0,
      },
      update: {
        ...(availabilitySLA !== undefined && { availabilitySLA: parseFloat(availabilitySLA) }),
        ...(responseTimeSLA !== undefined && { responseTimeSLA: parseInt(responseTimeSLA) }),
        ...(pageLoadSLA !== undefined && { pageLoadSLA: parseFloat(pageLoadSLA) }),
        ...(errorRateSLA !== undefined && { errorRateSLA: parseFloat(errorRateSLA) }),
      },
    });

    // Also update the service thresholds
    await prisma.service.update({
      where: { id: serviceId },
      data: {
        ...(availabilitySLA !== undefined && { slaTarget: parseFloat(availabilitySLA) }),
        ...(responseTimeSLA !== undefined && { latencyThreshold: parseInt(responseTimeSLA) }),
        ...(pageLoadSLA !== undefined && { pageLoadThreshold: parseFloat(pageLoadSLA) }),
        ...(errorRateSLA !== undefined && { errorRateThreshold: parseFloat(errorRateSLA) }),
      },
    });

    res.json({ config });
  } catch (error) {
    console.error('Update SLA config error:', error);
    res.status(500).json({ error: 'Failed to update SLA configuration' });
  }
};
