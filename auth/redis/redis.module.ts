import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';
import { UserController } from 'src/user/user.controller';
import { RedisRepository } from './redis.repository';

@Module({
  imports: [ConfigModule, RedisRepository],
  controllers: [UserController],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
