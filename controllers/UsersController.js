import { dbClient } from '../utils';
import { cache, createHash, dbUtils } from '../shared';

/**
 * @function getMe - retrieves a user object based on object
 * @param { object } req - the incoming request object
 * @param { object } res - the outgoing response object
 * @returns { object } the resolved response object:
 * If user with token sent in header exists, the response payload
 * is an object with the user's email and id. Else, it's
 * a custom error object.
 */
async function getMe(req, res) {
  const token = req.get('x-token');
  // check user exists
  // case not exists
  const userId = await cache.getUserId(`auth_${token}`);
  if (!userId) {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  const user = await dbUtils.getUserById(userId);
  if (!user) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  // case exists
  return res.send({ id: user._id.toString(), email: user.email });
}

/**
 * @function postNew - adds a new user to the database based on
 * their credentials(password and email) sent as payload.
 * @param { object } req - the incoming request object
 * @param { object } res - the outgoing response object
 * @returns { object } - the response object such that:
 *   - A custom error object is sent if  none or partial credentials
 *     were sent, a user with email already exists or an error occured
 *     while performing a write into the database.
 *   - A response object with payload containing new user's
 *     email and id.
 *
 */
async function postNew(req, res) {
  console.log('creating new user');
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
