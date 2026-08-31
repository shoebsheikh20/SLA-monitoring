import { Router } from 'express';
import {
  getMetrics,
  getServiceMetrics,
  getLatestMetrics,
} from '../controllers/metricsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getMetrics);
router.get('/latest', getLatestMetrics);
router.get('/:serviceId', getServiceMetrics);

export default router;
