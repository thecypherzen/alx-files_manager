/* eslint-disable */
const { MongoClient } = require('mongodb');


class DBClient {
  /**
   * Constructor for the cient
   */
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.db = process.env.DB_DATABASE || 'files_manager';
    this.connected = false;
    this.client = new MongoClient(
      `mongodb://${this.host}:${this.port}/${this.db}`)
      .on('open', () => {
        this.connected = true;
      });

    // Connect the client to server
    try {
      this.client.connect();
    } catch (err) {
      console.log(err.message);
    }
  }

  /**
   * @method isAlive - check connection status
   * @returns { boolean } - true if connected. false otherwise.
   */
  isAlive(){
    return this.connected;
  }

  /**
   * @method nbFiles - counts documents in files collection
   * @returns { number } - the number of documents in collection
   */
  async nbFiles() {
    const collection = this.client.db(this.db).collection("files");
    const count = collection.countDocuments();
    return count;
  }
  /**
   * @method nbUsers - checks number of documents in collection
   * `users`
   * @returns { number } - the number of documents in collection.
   */
  async nbUsers(){
    const collection = this.client.db(this.db).collection("users");
    const users = await collection.countDocuments();
    return users;
  }
}


const dbClient = new DBClient();
export default dbClient;
