import {
  fileUpload,
  getFile,
  getIndex,
  getShow,
  putPubUnpulish,
} from './FilesController';

import appController from './AppController';
import { getMe, postNew } from './UsersController';
import authController from './AuthController';

export {
  appController, authController,
  getMe, postNew, fileUpload, getFile,
  getIndex, getShow, putPubUnpulish,
};
