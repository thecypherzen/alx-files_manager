/* eslint-disable */
const redis = require('redis');
const { execSync } = require('child_process');
const deasync = require('deasync');
const promisify = require('util').promisify;

class RedisClient {
  constructor(){
    this.connected = false;
    this.client = redis.createClient()
      .on('error', (err) => {console.log(err)})
      .on('connect', () => {
        this.connected = true;
      });
    this._waitInit(0.5);
  }

  /**
   * @method (protected) _waitInit - waits for client to init
   * @param {number} - Number of seconds
   * @returns - undefined.
   */
  _waitInit(timeout) {
    const startTime = Date.now();
    while(!this.connected && Date.now() - startTime < timeout) {
      deasync.runLoopOnce();
    }
  }

  /**
   * @method del - deletes a key from the database
   * @param {string} key - the key to delete
   * @returns {number} - the number of keys deleted on success.
   * null otherwise.
   */
  async del(key) {
    return promisify(this.client.del).bind(this.client)(key);
  }
  /**
   * @method get - retrieves the value for a stored key
   * @param {string} key - the key to fetch its value from db
   * @returns {bytes} - the value for key if exists. null otherwise
   */
  async get(key) {
    return promisify(this.client.get).bind(this.client)(key);
  }

  /**
   * @method isAlive - checks if client is connected
   * @returns {Boolean} - true if client is connected. false otherwise.
   */
  isAlive() {
    return this.client.connected;
  }

  /**
   * @method set - saves a given value with a key in db
   * @param {string} key - the key to use
   * @param {*} value  - the value to save
   * @param {number} - the duration(in seconds) which the value is to
   * last
   * @returns {string || null } - string if successful else null
   */
  async set(key, value, duration) {
    return promisify(this.client.setex)
      .bind(this.client)(key, duration, value);
  }
}


const myClient = new RedisClient();
export default myClient;
