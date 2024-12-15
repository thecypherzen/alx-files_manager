import { dbClient } from '../utils';
import { createHash, dbUtils } from '../shared';

async function getMe(req, res) {
  console.log('getMe called...');
}

async function postNew(req, res) {
  // ensure data was sent
  if (!req.body || !req.body.email) {
    return res.status(400).send({ error: 'Missing email' });
  }
  if (!req.body.password) {
    return res.status(400).send({ error: 'Missing password' });
  }

  // check already existing values
  const db = dbClient.client.db(dbClient.db);
  const collection = db.collection('users');
  const emailCount = await collection
    .countDocuments({ email: req.body.email });
  if (emailCount) {
    return res.status(400).send({ error: 'Already exist' });
  }

  // create password hash, save and return
  const hash = createHash(req.body.password);
  try {
    const newUser = await collection.insertOne(
      { email: req.body.email, password: hash },
    );
    return res.status(201).send(
      { id: newUser.insertedId, email: req.body.email },
    );
  } catch (err) {
    return res.status(500).send(err);
  }
}

export { getMe, postNew };
