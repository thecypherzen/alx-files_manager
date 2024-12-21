import { Router, json } from 'express';
import { fileUpload } from '../controllers';

const filesRouter = Router();
filesRouter.use(json());
filesRouter.post('/', fileUpload);

export default filesRouter;
