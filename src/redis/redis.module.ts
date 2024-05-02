import { RedisModule } from '@nestjs-modules/ioredis';
import { Module } from '@nestjs/common';
import { configDotenv } from 'dotenv';

configDotenv();

@Module({
  imports: [
    RedisModule.forRootAsync({
      useFactory: () => ({
        type: 'single',
        url: process.env.REDIS_URL,
        password: process.env.REDIS_PASSWORD,
        name: process.env.REDIS_USERNAME,
      }),
    }),
  ],
})
export class RedisAppModule {}
