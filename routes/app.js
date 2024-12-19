import { Router, json } from 'express';
import { appController } from '../controllers';

const router = Router();
router.use(json());
router.use('/', appController);

export default router;
