import { v4 as uuid4 } from 'uuid';
import { writeFile, mkdir } from 'fs';
import path from 'path';
import { dbUtils, getUserFromToken } from '../shared';

/**
 * @function isValidType - checks if type of document is accepted
 * - Accepted types an only be either folder, file or image.
 * @param {string} type - the type sent by user
 * @returns {boolean} - true if type is a valid type.
 * - false otherwise.
 */
function isValidType(type) {
  if (typeof type !== 'string') {
    return false;
  }
  const acceptedTypes = ['folder', 'file', 'image'];
  return acceptedTypes.some((value) => value === type);
}

/**
 * @function updateObjectKey - given an object with a key 'key1',
 * updates the value of 'key1' to a new value(if 'newValue' is given),
 * or keeps the save value, but changes 'key1' to a new string 'key2',
 * as supplied in 'key' parameter.
 * @param { object } obj - the object to modify its key and value
 * @param { key } obj - object bearing the key to modify, it's new
 * key-string and its new value.
 * @returns {object} - the object with modified key-string and value.
 */
function updateObjectKey(
  obj, key = { from: '_id', to: 'id', newValue: null },
) {
  const data = { ...obj };
  if (!key.newValue) {
    data[key.to] = data[key.from];
  } else {
    data[key.to] = key.newValue;
  }
  delete data[key.from];
  return data;
}

/**
 * @function fileUpload - uploads a file to the database
 * @param { object } req - the incoming request object
 * @param { object } res - the outgoing response object
 * @returns { object } - the response object with modified values.
 */
async function fileUpload(req, res) {
  const user = await getUserFromToken(req);
  if (user.error) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  // validate file values
  if (!req.body || !req.body.name) {
    return res.status(400).send({ error: 'Missing name' });
  }
  if (!req.body.type || !isValidType(req.body.type)) {
    return res.status(400).send({ error: 'Missing type' });
  }
  if (!req.body.data && req.body.type !== 'folder') {
    return res.status(400).send({ error: 'Missing data' });
  }

  if (req.body.parentId) {
    // obtain parent folder for file if exists and validate
    const folder = await dbUtils
      .getItemById(req.body.parentId, 'files');
    if (!folder) {
      return res.status(400).send({ error: 'Parent not found' });
    }
    if (!folder.type !== 'folder') {
      return res.status(400).send({ error: 'Parent is not a folder' });
    }
  }

  const newFile = {
    parentId: req.body.parentId || 0,
    isPublic: req.body.isPublic || false,
    userId: user._id.toString(),
    type: req.body.type,
    name: req.body.name,
  };

  // if type if folder, add to db
  if (req.body.type === 'folder') {
    try {
      await dbUtils.addDocument(newFile, 'files');
      return res.status(201).send(updateObjectKey(newFile));
    } catch (err) {
      return res.status(500).send({ error: err.message });
    }
  }

  // if type is not folder, prepare to save file locally
  const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
  const fileName = uuid4();
  const filePath = path.join(folderPath, fileName);
  const content = Buffer.from(req.body.data, 'base64');

  // create parent directory tree if not exists
  await mkdir(folderPath, { recursive: true }, (err, path) => {
    if (err) {
      res.status(500).send({ error: err.message, path });
    }
  });

  // write content to file and return response
  return writeFile(filePath, content, (err) => {
    if (err) {
      return res.status(500)
        .send({ error: err.message });
    }
    newFile.localPath = filePath;
    dbUtils
      .addDocument(newFile, 'files')
      .then(() => {
        res.status(201).send(updateObjectKey(newFile));
      })
      .catch((err) => res.status(500).send({ error: err.message }));
    return null;
  });
}

export default fileUpload;
