import { Router, json } from 'express';
import { fileUpload, getIndex, getShow } from '../controllers';

const router = Router();
router.use(json());
router.post('/', fileUpload);
router.get('/', getIndex);
router.get('/:id', getShow);

export default router;
