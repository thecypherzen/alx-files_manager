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
    console.log('getUserByCred: ',user);
    return user;
  },

  getUserById: async (id) => {
    const db = dbClient.client.db(dbClient.db);
    const collection = db.collection('users');
    const user = await collection.findOne({ _id: new ObjectId(id) });
    return user;
  },
};

const cache = {
  set: async (key, value, duration) => {
    const res = await redisClient.set(key, value, duration);
    return res;
  },

  delete: async (key) => {
    const res = await redisClient.del(key);
    return res;
  },

  getUserId: async (key) => {
    const userId = await redisClient.get(key);
    return userId;
  },
};

export { cache, createHash, dbUtils };
