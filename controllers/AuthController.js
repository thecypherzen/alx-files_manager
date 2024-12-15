import { v4 as uuid4 } from 'uuid';
import { cache, createHash, dbUtils } from '../shared';

async function getConnect(req, res) {
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
  const value = await cache.set(key, user._id.toString(), 86400);
  console.log('set response: ', value);

  return res.send({ token: authToken });
}


export { getConnect, getDisconnect };
