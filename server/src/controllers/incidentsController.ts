import { Request, Response } from 'express';
import { prisma } from '../server';

export const getIncidents = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      severity,
      serviceId,
      page = '1',
      limit = '20',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (serviceId) where.serviceId = serviceId;

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        include: { service: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.incident.count({ where }),
    ]);

    res.json({
      incidents,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
};

export const createIncident = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceId, severity = 'medium', title, description, slaImpact = 0 } = req.body;

    if (!serviceId || !title) {
      res.status(400).json({ error: 'Service ID and title are required' });
      return;
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    const incident = await prisma.incident.create({
      data: {
        serviceId,
        severity,
        title,
        description: description || '',
        status: 'open',
        slaImpact: parseFloat(slaImpact),
        startedAt: new Date(),
      },
      include: { service: { select: { id: true, name: true } } },
    });

    // Auto-create an alert
    await prisma.alert.create({
      data: {
        serviceId,
        severity: severity === 'critical' || severity === 'high' ? 'critical' : 'warning',
        message: `New incident: ${title}`,
      },
    });

    res.status(201).json({ incident });
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({ error: 'Failed to create incident' });
  }
};

export const updateIncident = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, severity, title, description, notes, slaImpact } = req.body;

    const existing = await prisma.incident.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    const resolvedAt =
      status === 'resolved' && existing.status !== 'resolved'
        ? new Date()
        : existing.resolvedAt;

    const incident = await prisma.incident.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(severity && { severity }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(notes !== undefined && { notes }),
        ...(slaImpact !== undefined && { slaImpact: parseFloat(slaImpact) }),
        resolvedAt,
      },
      include: { service: { select: { id: true, name: true } } },
    });

    res.json({ incident });
  } catch (error) {
    console.error('Update incident error:', error);
    res.status(500).json({ error: 'Failed to update incident' });
  }
};

export const deleteIncident = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await prisma.incident.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }
    await prisma.incident.delete({ where: { id } });
    res.json({ message: 'Incident deleted successfully' });
  } catch (error) {
    console.error('Delete incident error:', error);
    res.status(500).json({ error: 'Failed to delete incident' });
  }
};
