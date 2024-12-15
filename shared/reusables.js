import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { dbClient, redisClient } from '../utils';

function createHash(data, type = 'sha1') {
  return crypto.createHash(type).update(data).digest('hex');
}

const dbUtils = {
  getUserByCred: async (credentials) => {
    const db = dbClient.client.db(dbClient.db);
    const collection = db.collection('users');
    const user = await collection.findOne(credentials);
    return user;
  },

  getUserById: async(id) => {
    const db = dbClient.client.db(dbClient.db);
    const collection = db.collection('users');
    const userId = new ObjectId(id);
    const user = await collection.findOne({ _id: userId });
    return user;
  },
};

const cache = {
  set: async (key, value, duration) => {
    const res = await redisClient.set(key, value, duration);
    return res;
  },
};

export { cache, createHash, dbUtils };
