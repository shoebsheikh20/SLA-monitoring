import { Router } from 'express';
import { getReport, exportCSV } from '../controllers/reportsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getReport);
router.get('/export', exportCSV);

export default router;
