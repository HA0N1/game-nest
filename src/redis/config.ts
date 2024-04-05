// import { createClient } from 'redis';
// import { configDotenv } from 'dotenv';
// configDotenv();
// // const redisClient = redis.createClient({
// //   socket: {
// //     host: process.env.REDIS_HOST,
// //     port: parseInt(process.env.REDIS_PORT),
// //     timeout: 2000,
// //   },
// //   password: process.env.REDIS_PASSWORD,

// //   legacyMode: true,
// // });

// // redisClient.on('ready', () => {
// //   console.log('redis is ready');
// // });

// // redisClient.on('error', err => {
// //   console.error(err);
// // });

// // redisClient.connect().catch(err => console.error(err));
// // const start = Date.now();
// // while (Date.now() - start < 2000) {}

// // export default redisClient;

// const client = createClient({ url: process.env.REDIS_URL }).on('error', err => console.log('Redis Client Error', err));

// const test = async () => {
//   await client.connect();
//   await client.set('key', 'value');
//   const value = await client.get('key');
//   console.log(value);

//   await client.quit();
// };
// test();
