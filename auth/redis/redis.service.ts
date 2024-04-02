import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { RedisRepository } from './redis.repository';

@Injectable()
export class RedisService {
  constructor(
    @Inject(RedisRepository)
    private readonly redisRepository: RedisRepository, // RedisRepository 연결
  ) {}

  async getValueFromRedis(key: string) {
    return this.redisRepository.get(key);
  }

  async setValueToRedis(key: string, value: string) {
    return this.redisRepository.set(key, value);
  }
}
