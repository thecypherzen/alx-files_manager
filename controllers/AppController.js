import dbClient from '../utils/db';
import redisClient from '../utils/redis';

function getStatus(req, res) {
  if (dbClient.isAlive() && redisClient.isAlive()) {
    res.send({ redis: true, db: true });
  } else {
    res.status(500).send(
      {
        redis: redisClient.isAlive(),
        db: dbClient.isAlive(),
      },
    );
  }
}

function getStats(req, res) {
  (async () => {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();
    res.send({ users, files });
  })();
}

function appController(req, res) {
  if (req.baseUrl === '/stats') {
    return getStats(req, res);
  }
  return getStatus(req, res);
}

export default appController;
