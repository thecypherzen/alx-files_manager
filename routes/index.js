import { Router, json } from 'express';
import {
  getStatus, getStats,
  postNew, getConnect,
} from '../controllers';

const router = Router();
router.use(json());

router.get('/status', getStatus);
router.get('/stats', getStats);
router.post('/users', postNew);
router.get('/connect', getConnect);

export default router;
