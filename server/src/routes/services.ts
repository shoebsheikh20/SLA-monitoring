import { Router } from 'express';
import {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  toggleMonitoring,
} from '../controllers/servicesController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getServices);
router.post('/', createService);
router.get('/:id', getService);
router.put('/:id', updateService);
router.delete('/:id', deleteService);
router.patch('/:id/monitoring', toggleMonitoring);

export default router;
