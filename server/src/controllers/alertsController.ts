import { Request, Response } from 'express';
import { prisma } from '../server';

export const getAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      isRead,
      severity,
      serviceId,
      page = '1',
      limit = '50',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (isRead !== undefined) where.isRead = isRead === 'true';
    if (severity) where.severity = severity;
    if (serviceId) where.serviceId = serviceId;

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        include: { service: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.alert.count({ where }),
    ]);

    const unreadCount = await prisma.alert.count({ where: { isRead: false } });

    res.json({
      alerts,
      unreadCount,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

export const markAlertRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const alert = await prisma.alert.update({
      where: { id },
      data: { isRead: true },
    });
    res.json({ alert });
  } catch {
    res.status(404).json({ error: 'Alert not found' });
  }
};

export const markAllRead = async (_req: Request, res: Response): Promise<void> => {
  try {
    await prisma.alert.updateMany({ where: { isRead: false }, data: { isRead: true } });
    res.json({ message: 'All alerts marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark alerts as read' });
  }
};

export const deleteAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.alert.delete({ where: { id } });
    res.json({ message: 'Alert deleted' });
  } catch {
    res.status(404).json({ error: 'Alert not found' });
  }
};

export const clearAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { severity, isRead } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (severity) where.severity = severity;
    if (isRead !== undefined) where.isRead = isRead === 'true';

    const { count } = await prisma.alert.deleteMany({ where });
    res.json({ message: `Cleared ${count} alerts` });
  } catch (error) {
    console.error('Clear alerts error:', error);
    res.status(500).json({ error: 'Failed to clear alerts' });
  }
};
