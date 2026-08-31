import { Request, Response } from 'express';
import { prisma } from '../server';

export const getServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search = '',
      status,
      environment,
      page = '1',
      limit = '20',
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { url: { contains: search } },
      ];
    }
    if (status) where.status = status;
    if (environment) where.environment = environment;

    const validSortFields = ['name', 'status', 'slaTarget', 'createdAt', 'updatedAt'];
    const orderBy: Record<string, string> = {
      [validSortFields.includes(sortBy) ? sortBy : 'name']:
        sortOrder === 'desc' ? 'desc' : 'asc',
    };

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          metrics: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
          slaConfig: true,
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.service.count({ where }),
    ]);

    res.json({
      services: services.map((s) => ({
        ...s,
        latestMetric: s.metrics[0] || null,
        metrics: undefined,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

export const getService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        metrics: {
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
        incidents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        slaConfig: true,
      },
    });

    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    res.json({ service });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
};

export const createService = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      url,
      environment = 'production',
      region = 'us-east-1',
      slaTarget = 99.9,
      latencyThreshold = 500,
      pageLoadThreshold = 2.0,
      errorRateThreshold = 1.0,
      monitoringEnabled = true,
    } = req.body;

    if (!name || !url) {
      res.status(400).json({ error: 'Name and URL are required' });
      return;
    }

    const service = await prisma.service.create({
      data: {
        name,
        description: description || '',
        url,
        environment,
        region,
        slaTarget: parseFloat(slaTarget),
        latencyThreshold: parseInt(latencyThreshold),
        pageLoadThreshold: parseFloat(pageLoadThreshold),
        errorRateThreshold: parseFloat(errorRateThreshold),
        monitoringEnabled,
        status: 'healthy',
        slaConfig: {
          create: {
            availabilitySLA: parseFloat(slaTarget),
            responseTimeSLA: parseInt(latencyThreshold),
            pageLoadSLA: parseFloat(pageLoadThreshold),
            errorRateSLA: parseFloat(errorRateThreshold),
          },
        },
      },
      include: { slaConfig: true },
    });

    res.status(201).json({ service });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
};

export const updateService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      url,
      environment,
      region,
      slaTarget,
      latencyThreshold,
      pageLoadThreshold,
      errorRateThreshold,
      monitoringEnabled,
    } = req.body;

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(url && { url }),
        ...(environment && { environment }),
        ...(region && { region }),
        ...(slaTarget !== undefined && { slaTarget: parseFloat(slaTarget) }),
        ...(latencyThreshold !== undefined && { latencyThreshold: parseInt(latencyThreshold) }),
        ...(pageLoadThreshold !== undefined && { pageLoadThreshold: parseFloat(pageLoadThreshold) }),
        ...(errorRateThreshold !== undefined && { errorRateThreshold: parseFloat(errorRateThreshold) }),
        ...(monitoringEnabled !== undefined && { monitoringEnabled }),
      },
      include: { slaConfig: true },
    });

    res.json({ service });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
};

export const deleteService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    await prisma.service.delete({ where: { id } });
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
};

export const toggleMonitoring = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    const service = await prisma.service.update({
      where: { id },
      data: { monitoringEnabled: enabled },
    });

    res.json({ service });
  } catch (error) {
    console.error('Toggle monitoring error:', error);
    res.status(500).json({ error: 'Failed to toggle monitoring' });
  }
};
