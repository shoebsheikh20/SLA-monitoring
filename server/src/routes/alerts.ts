import { Router } from 'express';
import {
  getAlerts,
  markAlertRead,
  markAllRead,
  deleteAlert,
  clearAlerts,
} from '../controllers/alertsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getAlerts);
router.put('/read-all', markAllRead);
router.delete('/clear', clearAlerts);
router.put('/:id/read', markAlertRead);
router.delete('/:id', deleteAlert);

export default router;
