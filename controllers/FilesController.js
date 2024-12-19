import { v4 as uuid4 } from 'uuid';
import { writeFile } from 'fs';
import { path } from 'path';
import { dbUtils, getUserFromToken } from '../shared';

function isValidType(type) {
  if (typeof type !== 'string') {
    return false;
  }
  const acceptedTypes = ['folder', 'file', 'image'];
  return acceptedTypes.some((value) => value === type);
}

async function postUpload(req, res) {
  console.log('uploading new file');
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
      .getDocumentsIn(req.body.parentId);
    if (!folder.length) {
      return res.status(400).send({ error: 'Parent not found' });
    }
    if (!folder[0].type !== 'folder') {
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
    await dbUtils.addFolder(newFile);
    return res.status(201).send(newFile);
  }

  // if type is not folder
  const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
  const fileName = uuid4();
  const filePath = path.join(folderPath, fileName);
  const content = Buffer.from(req.body.data, 'base64');

  writeFile(filePath, content, (err) => {
    if (err) {
      return res.status(500)
        .send({ error: 'writing to file failed.' });
    }
    newFile.localPath = filePath;
    dbUtils
      .addDocument(newFile)
      .then(() => res.status(201).send(newFile))
      .catch((err) => res.status(500).send({ error: err.message }));
    return res.status(401).send({ error: 'Unauthorized' });
  });
  return res.status(401).send({ error: 'Unauthorized' });
}

export default postUpload;
