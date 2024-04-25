import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { InterestGenre } from './entities/interestGenre.entity';
import { Redis } from 'ioredis';
import { Genre } from 'src/game/entities/gameGenre.entity';
import { RedisAppModule } from 'src/redis/redis.module';
import { FriendService } from 'src/friend/friend.service';
import { FriendModule } from 'src/friend/friend.module';
import { HttpModule } from '@nestjs/axios';
import { AwsService } from 'src/aws/aws.service';
import { File } from 'src/aws/entities/file.entity';
import { AwsModule } from 'src/aws/aws.module';
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET_KEY'),
      }),
      inject: [ConfigService],
    }),
    HttpModule.registerAsync({
      useFactory: () => ({
        timeout: 5000,
        maxRedirects: 5,
      }),
    }),
    TypeOrmModule.forFeature([User, InterestGenre, Genre, File]),
    RedisAppModule,
  ],
  controllers: [UserController],
  providers: [UserService, AwsService],
  exports: [UserService],
})
export class UserModule {}
