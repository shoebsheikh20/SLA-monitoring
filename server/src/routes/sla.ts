import { Router } from 'express';
import { getSLAStatus, updateSLAConfig } from '../controllers/slaController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getSLAStatus);
router.put('/:serviceId', updateSLAConfig);

export default router;
