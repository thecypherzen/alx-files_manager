import { Router, json } from 'express';
import { postUpload as fileUpload } from '../controllers';

const filesRouter = Router();
filesRouter.use(json());

filesRouter.post('/', fileUpload);

export default filesRouter;
