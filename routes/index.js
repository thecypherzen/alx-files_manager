import { Router, json } from 'express';
import {
  getConnect, getDisconnect, getStatus, getStats,
  postNew,
} from '../controllers';

const router = Router();
router.use(json());

router.get('/status', getStatus);
router.get('/stats', getStats);
router.post('/users', postNew);
router.get('/connect', getConnect);
router.get('/disconnect', getDisconnect);

export default router;
