import * as Joi from 'joi';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from './user/entities/user.entity';
import { ChannelModule } from './channel/channel.module';
import { FriendDMs } from './user/entities/friendDMs.entity';
import { Friendship } from './user/entities/friendship.entity';
import { ChannelChat } from './channel/entities/channelChat.entity';
import { Channel } from './channel/entities/channel.entity';
import { DMRoom } from './user/entities/DM-room.entity';
import { Like } from './user/entities/like.entity';
import { Post } from './post/entities/post.entity';
import { PostComment } from './post/entities/postComment.entity';
import { Game } from './game/entities/game.entity';
import { ChannelMember } from './channel/entities/channelMember.entity';
import { ChannelDMs } from './channel/entities/channelDMs.entity';
import { GameService } from './game/game.service';
import { UserModule } from './user/user.module';

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
  ],
  controllers: [],
  providers: [GameService],
})
export class AppModule {}
