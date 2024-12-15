import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { dbClient, redisClient } from '../utils';

// hash creating function
function createHash(data, type = 'sha1') {
  return crypto.createHash(type).update(data).digest('hex');
}

// database utilities
const dbUtils = {
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
  getUserById: async (id) => {
    const db = dbClient.client.db(dbClient.db);
    const collection = db.collection('users');
    const user = await collection.findOne({ _id: new ObjectId(id) });
    return user;
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

export { cache, createHash, dbUtils };
