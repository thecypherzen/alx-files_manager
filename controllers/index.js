import {
  fileUpload,
  getIndex,
  getShow,
  putPublish,
} from './FilesController';

import appController from './AppController';
import { getMe, postNew } from './UsersController';
import authController from './AuthController';

export {
  appController, authController,
  getMe, postNew, fileUpload,
  getIndex, getShow, putPublish,
};
