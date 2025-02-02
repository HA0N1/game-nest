import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { InterestGenre } from './entities/interestGenre.entity';
import { Genre } from 'src/game/entities/game-genre.entity';
import { RedisAppModule } from 'src/redis/redis.module';
import { FriendService } from 'src/friend/friend.service';
import { FriendModule } from 'src/friend/friend.module';
import { HttpModule } from '@nestjs/axios';
import { AwsService } from 'src/aws/aws.service';
import { File } from 'src/aws/entities/file.entity';
import { AwsModule } from 'src/aws/aws.module';
import { APP_FILTER } from '@nestjs/core';
import { TokenExpiredFilter } from 'src/auth/guard/exception.filter';

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
  providers: [UserService, AwsService, { provide: APP_FILTER, useClass: TokenExpiredFilter }],
  exports: [UserService],
})
export class UserModule {}
