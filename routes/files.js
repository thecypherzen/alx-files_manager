import { Router, json } from 'express';
import {
  fileUpload, getIndex,
  getShow, putPubUnpulish,
} from '../controllers';

const router = Router();
router.use(json());
router.post('/', fileUpload);
router.get('/', getIndex);
router.get('/:id', getShow);
router.put(['/:id/publish', '/:id/unpublish'], putPubUnpulish);

export default router;
