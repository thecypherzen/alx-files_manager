import { v4 as uuid4 } from 'uuid';
import { cache, createHash, dbUtils } from '../shared';

// log user in
async function getConnect(req, res) {
  // fetch auth
  let authorization = req.get('authorization');
  if (!authorization) {
    return res.status(401)
      .send({ error: 'Unauthorized' });
  }

  [, authorization] = authorization.split(' ');
  authorization = Buffer.from(authorization, 'base64')
    .toString('utf-8');
  const [email, password] = authorization.split(':');
  const pwdHash = createHash(password);
  const user = await dbUtils.getUserByCred(
    { email, password: pwdHash },
  );

  if (!user) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  const authToken = uuid4();
  const key = `auth_${authToken}`;
  await cache.set(key, user._id.toString(), 86400);
  return res.send({ token: authToken });
}

// log user out
async function getDisconnect(req, res) {
  const token = req.get('x-token');
  const userId = await cache.getUserId(`auth_${token}`);
  if (!userId) {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  const user = await dbUtils.getUserById(userId);
  if (!user) {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  await cache.delete(`auth_${token}`);
  return res.status(204).send('');
}

export { getConnect, getDisconnect };
