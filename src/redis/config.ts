import * as redis from 'redis';
import { configDotenv } from 'dotenv';
configDotenv();
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
  },
  password: process.env.REDIS_PASSWORD,
  legacyMode: true,
});

redisClient.connect();

redisClient.on('ready', () => {
  console.log('redis is ready');
});

redisClient.on('error', err => {
  console.error(err);
});

export default redisClient;
