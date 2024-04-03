import { Cache } from 'cache-store-manager';
import { configDotenv } from 'dotenv';
configDotenv();

const redisCache = Cache.create('redis', {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  db: 0,
});

export default redisCache;
