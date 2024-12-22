import { v4 as uuid4 } from 'uuid';
import { ObjectId } from 'mongodb';
import { lookup } from 'mime-types';
import { readFile, writeFile, mkdir } from 'fs';
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
    if (folder.type !== 'folder') {
      return res.status(400).send({ error: 'Parent is not a folder' });
    }
  }

  const newFile = {
    parentId: req.body.parentId
      ? new ObjectId(req.body.parentId)
      : '0',
    isPublic: req.body.isPublic || false,
    userId: new ObjectId(user._id.toString()),
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

/**
 * @async
 * @function getFile - fetches content of a document in db based on id
 * @param { Object<express.request> } req - incoming request object
 * @param { Object<express.response> } res - outgoing response object
 * @returns { Object<express.response> } - modified response object such that:
 * - If no file document is linked to the ID passed as parameter, sets status code to 404 with error object with message 'Not found'
 * - If the doc is private and user is not authenticated or is not
 *   the owner, sets status code to 404 with error object with message
 *   'Not found'
 * - If document is a folder, payload is an error object with message
 *   `A folder doesn't have content` and status code is 400
 * - If file is not locally present, payload is an error object with
 *   message `Not found` and status code 404
 * - Otherwise, the payload is the document's content, with mime-type
 *   set based on file extension.
 */
async function getFile(req, res) {
  const user = await getUserFromToken(req);
  const pipeLine = [
    { $match: { _id: new ObjectId(req.params.id) } },
    { $addFields: { id: '$_id' } },
    { $unset: '_id' },
  ];
  const [file] = await dbUtils.aggregate(pipeLine, 'files');
  if (!file) {
    return res.status(404).send({ error: 'Not found' });
  }
  // validate user is owner
  if (!file.isPublic
      && (user.error
          || file.userId.toString() !== user._id.toString())) {
    console.log(`isPublic: ${file.isPublic}\nuser.userId(${user._id || 'none'})\nuserId matches: ${file.userId === user._id})`);
    return res.status(404).send({ error: 'Not found' });
  }

  // handle type folder
  if (file.type === 'folder') {
    return res.status(400).send({ error: 'A folder doesn\'t have content' });
  }
  return readFile(file.localPath, (err, data) => {
    if (err) {
      res.status(404).send({ error: 'Not found' });
    }
    res.setHeader('Content-Type', lookup(file.name));
    return res.send(data);
  });
}

/**
 * @function getIndex - retrieve all users file documents for a
 * specific parentId and with pagination:
 * @param { object } req - incoming request object
 * @param { object } res  outgoing response objct
 * @returns { object } - modified response object
 * - If no user found based on token, the payload returned is
 *   an object with value `Unauthorized` and status 401
 * - Based on query parameters `parentid` and `page`:
 *   - pageId defaults to 0 by default
 *   - if the `parentId` is not linked to any user folder, returns
 *     an empty list
 *   - each page is 20 items max
 *   - page query parameter starts at 0 for the first page.
 *     If equals to 1, it means it’s the second page.
 *   - pagination can be done directly by the aggregate of MongoDB
 */
async function getIndex(req, res) {
  const user = await getUserFromToken(req);
  if (user.error) {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  const parentId = req.query.parentId
    ? new ObjectId(req.query.parentId)
    : '0';
  const page = req.query.page ? Number(req.query.page) : 0;
  const pipeLine = [
    { $match: { parentId, userId: user._id } },
    { $sort: { _id: 1 } },
    { $skip: page * 20 },
    { $limit: 20 },
    { $addFields: { id: '$_id' } },
    { $unset: '_id' },
  ];
  const result = await dbUtils.aggregate(pipeLine, 'files');
  return res.send(result);
}

/**
 * @function getShow - retrieves a file document based on id
 * - Uses user token to id requesting user
 * @param { object } req - the incoming request object
 * @param { object } res - the outgoing response object
 * @returns { object }:
 * - An error object with value `Unauthorized` and status code 401.
 *   if no valid user is found.
 * - An error object with value `Not found` and status code 404 if no
 *   file document is linked to the user and the ID passed as request
 *   parameter.
 */
async function getShow(req, res) {
  const user = await getUserFromToken(req);
  if (user.error) {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  const pipeLine = [
    {
      $match: {
        _id: new ObjectId(req.params.id),
        userId: user._id,
      },
    },
    { $addFields: { id: '$_id' } },
    { $unset: '_id' },
  ];
  const items = await dbUtils.aggregate(pipeLine, 'files');
  if (!items.length || items.length > 1) {
    return res.status(404).send({ error: 'Not found' });
  }
  return res.send(items[0]);
}

/**
 * @function putPublish - updates a file document's isPublic value
 * to `true` based on id parameter
 * @param { object } req - the request object
 * @param { object } res - the response object
 * @returns { object } - modified response object such that:
 * - if no user found based on token, set status code to 401 and
 *   payload to error object with message 'Unauthorized';
 * - if no document is linked with user and id passed as parameter,
 *   set status code to 404 with message 'Not found'
 * - otherwise, updates the document's isPublic value and returns it.
 */
async function putPubUnpulish(req, res) {
  const user = await getUserFromToken(req);
  if (user.error) {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  const path = req.path.split('/');
  const endpoint = path[path.length - 1];
  const pipeLine = [
    {
      $match: {
        _id: ObjectId(req.params.id),
        userId: user._id,
      },
    },
    { $set: { isPublic: endpoint === 'publish' } },
    { $addFields: { id: '$_id' } },
    { $unset: '_id' },
  ];
  const result = await dbUtils.aggregate(pipeLine, 'files');
  if (!result.length || result.length > 1) {
    return res.status(404).send({ error: 'Not found' });
  }
  const filter = { _id: result[0].id };
  const update = { $set: { isPublic: endpoint === 'publish' } };
  await dbUtils.updateOne(
    { filter, update, coll: 'files' },
  );
  return res.send(result[0]);
}

export {
  fileUpload, getFile, getIndex,
  getShow, putPubUnpulish,
};
