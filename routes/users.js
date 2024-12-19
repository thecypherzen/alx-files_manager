import { Router, json } from 'express';
import { getMe, postNew } from '../controllers';

const router = Router();
router.use(json());

router.post('/', postNew);
router.get('/me', getMe);

export default router;
