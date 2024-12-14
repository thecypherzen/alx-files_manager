import crypto from 'crypto';

function createHash(data, type='sha1') {
  return crypto.createHash(type).update(data).digest('hex');
}

export default createHash;
