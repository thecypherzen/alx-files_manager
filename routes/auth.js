import { Router, json } from 'express';
import { authController } from '../controllers';

const router = Router();
router.use(json());
router.get('/', authController);

export default router;
