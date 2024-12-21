import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { dbClient, redisClient } from '../utils';

// hash creating function
function createHash(data, type = 'sha1') {
  return crypto.createHash(type).update(data).digest('hex');
}

// database utilities
const dbUtils = {
  addDocument: async (data, coll = 'users') => {
    const db = dbClient.client.db(dbClient.db);
    const collection = coll === 'users'
      ? db.collection('users')
      : db.collection('files');
    const result = await collection.insertOne(data);
    return result;
  },

  /**
   * @function getDocumentsIn - counts files in a folder
   * @param { string | number }
   */
  getDocumentsIn: async (parentId) => {
    const db = dbClient.client.db(dbClient.db);
    const collection = db.collection('files');
    const folder = await collection.find({ parentId });
    return Array.from(folder);
  },

  /**
   * @function getUserByCred - gets a user from database based on
   * credentials
   * @param { object } credentials - an object of credentials to use.
   * @returns { object } - a promise that resolves to the found
   * user or null.
   */
  getUserByCred: async (credentials) => {
    const db = dbClient.client.db(dbClient.db);
    const collection = db.collection('users');
    const user = await collection.findOne(credentials);
    return user;
  },

  /**
   * @function getUserById - retrieves a user from the database
   * based on user's id only.
   * @param {string} id - the user's id string
   * @returns {object} - a promise that resolves to the found user
   * or null.
   */
  getItemById: async (id, coll = 'users') => {
    const db = dbClient.client.db(dbClient.db);
    const collection = coll === 'users'
      ? db.collection('users')
      : db.collection('files');
    const item = await collection.findOne({ _id: new ObjectId(id) });
    return item;
  },
};

// cache utilities
const cache = {
  /**
   * @function set - adds a value to the cache by key
   * @param {string} key - the key to use
   * @param {string} value - the value to be saved
   * @param {number} duration - the time after which saved value
   * expires(in seconds);
   * @returns {object} - a promise object containing redis cache's
   * response after deletion - usually 'OK'
   */
  set: async (key, value, duration) => {
    const res = await redisClient.set(key, value, duration);
    return res;
  },

  /**
   * @function delete - deletes a value from the cache
   *
   * @param {string} key - the key of value to delete
   * @returns {object} - promise that resolveds to cache response
   * after deletion - usually 'OK'.
   */
  delete: async (key) => {
    const res = await redisClient.del(key);
    return res;
  },

  /**
   * @function getUserId - retrives a userId by key
   *
   * @param {string} key - the key associated with userId.
   * @returns {object} - promise that resolves to the userId.
   */
  getUserId: async (key) => {
    const userId = await redisClient.get(key);
    return userId;
  },
};

async function getUserFromToken(req) {
  const token = req.get('x-token');
  if (!token) {
    return ({ error: true });
  }
  const userId = await cache.getUserId(`auth_${token}`);

  if (!userId) {
    return ({ error: true });
  }

  const user = await dbUtils.getItemById(userId);
  return user;
}

export {
  cache, createHash, dbUtils, getUserFromToken,
};
