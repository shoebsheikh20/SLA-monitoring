import { Router } from 'express';
import {
  getIncidents,
  createIncident,
  updateIncident,
  deleteIncident,
} from '../controllers/incidentsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getIncidents);
router.post('/', createIncident);
router.put('/:id', updateIncident);
router.delete('/:id', deleteIncident);

export default router;
