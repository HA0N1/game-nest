import { RedisModule } from '@nestjs-modules/ioredis';
import { Module } from '@nestjs/common';
import { UserController } from 'src/user/user.controller';
import { configDotenv } from 'dotenv';
import { User } from 'src/user/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { InterestGenre } from 'src/user/entities/interestGenre.entity';
import { Genre } from 'src/game/entities/game-genre.entity';
configDotenv();

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET_KEY'),
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, InterestGenre, Genre]),
    RedisModule.forRootAsync({
      useFactory: () => ({
        type: 'single',
        url: process.env.REDIS_URL,
        password: process.env.REDIS_PASSWORD,
        name: process.env.REDIS_USERNAME,
      }),
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class RedisAppModule {}
