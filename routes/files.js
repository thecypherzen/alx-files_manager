import { Router, json } from 'express';
import {
  fileUpload, getIndex,
  getShow, putPublish,
} from '../controllers';

const router = Router();
router.use(json());
router.post('/', fileUpload);
router.get('/', getIndex);
router.get('/:id', getShow);
router.get('/:id/publish', putPublish);

export default router;
