import * as Joi from 'joi';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from './user/entities/user.entity';
import { FriendDMs } from './dm/entities/friendDMs.entity';
import { Friendship } from './friend/entities/friendship.entity';
import { Channel } from './channel/entities/channel.entity';
import { ChannelModule } from './channel/channel.module';
import { ChannelChat } from './channel/entities/channelChat.entity';
import { ChannelMember } from './channel/entities/channelMember.entity';
import { ChannelDMs } from './channel/entities/channelDMs.entity';
import { DMRoom } from './dm/entities/DM-room.entity';
import { Like } from './user/entities/like.entity';
import { Post } from './post/entities/post.entity';
import { Game } from './game/entities/game.entity';
import { GameService } from './game/game.service';
import { Genre } from './game/entities/game-genre.entity';
import { InterestGenre } from './user/entities/interestGenre.entity';
import { GameComment } from './game/entities/game-comment.entity';
import { CommentModule } from './comment/comment.module';
import { PostModule } from './post/post.module';
import { PostComment } from './comment/entities/comment.entity';
import { DMModule } from './dm/dm.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { RedisAppModule } from './redis/redis.module';
import { FriendModule } from './friend/friend.module';
import { EventModule } from './event/event.module';
import { AppController } from './app.controller';
import { DmEventModule } from './event/dmEvent.module';
import { StoreModule } from './store/store.module';
import { AwsModule } from './aws/aws.module';
import { File } from './aws/entities/file.entity';
import { APP_FILTER } from '@nestjs/core';
import { TokenExpiredFilter } from './auth/guard/exception.filter';
import { GameModule } from './game/game.module';
import { ScheduleModule } from '@nestjs/schedule';

const typeOrmModuleOptions = {
  useFactory: async (configService: ConfigService): Promise<TypeOrmModuleOptions> => ({
    namingStrategy: new SnakeNamingStrategy(), // 자동으로 DB에 스네이프 케이스로
    type: 'mysql',
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    database: configService.get('DB_NAME'),
    entities: [
      User,
      FriendDMs,
      Friendship,
      Channel,
      ChannelChat,
      ChannelMember,
      ChannelDMs,
      DMRoom,
      Like,
      Post,
      PostComment,
      Game,
      Genre,
      InterestGenre,
      GameComment,
      File,
    ],
    synchronize: configService.get('DB_SYNC'),
    logging: true, // row query 출력
  }),
  inject: [ConfigService],
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 전역에서 사용 => 별도로 다른곳에서 import 하지 않아도 됨
      // 환경변수 유효성 검사
      validationSchema: Joi.object({
        JWT_SECRET_KEY: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_NAME: Joi.string().required(),
        DB_SYNC: Joi.boolean().required(),
      }),
    }),
    TypeOrmModule.forRootAsync(typeOrmModuleOptions),
    ChannelModule,
    UserModule,
    AuthModule,
    PostModule,
    CommentModule,
    RedisAppModule,
    FriendModule,
    DMModule,
    EventModule,
    DmEventModule,
    StoreModule,
    AwsModule,
    GameModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [GameService, { provide: APP_FILTER, useClass: TokenExpiredFilter }],
})
export class AppModule {}
