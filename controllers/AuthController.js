import { v4 as uuid4 } from 'uuid';
import { cache, createHash, dbUtils } from '../shared';

function getConnect(req, res) {
  let authorization = req.get('authorization');
  if (!authorization) {
    return res.status(401)
      .send({ error: 'Unauthorized' });
  }
  console.log(authorization);
  [, authorization] = authorization.split(' ');
  authorization = Buffer.from(authorization, 'base64')
    .toString('utf-8');
  const [email, password] = authorization.split(':');
  const pwdHash = createHash(password);
  const user = dbUtils.getUserByCred({ email, password: pwdHash });

  if (!user) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  const authToken = uuid4();
  const key = `auth_${authToken}`;
  const value = cache.set(key, authToken, 86400);
  console.log('set response: ', value);

  return res.send({ token: authToken });
}

const someFunc = null;

export { getConnect, someFunc };
