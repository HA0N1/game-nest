import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { UserModule } from 'src/user/user.module';
import { Friendship } from 'src/friend/entities/friendship.entity';
import { FriendModule } from 'src/friend/friend.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DMService } from './dm.service';
import { DMController } from './dm.controller';
import { FriendDMs } from './entities/friendDMs.entity';
import { DMRoom } from './entities/DM-room.entity';
import { AwsService } from 'src/aws/aws.service';
import { File } from 'src/aws/entities/file.entity';
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
    TypeOrmModule.forFeature([User, Friendship, FriendDMs, DMRoom, File]),
    UserModule,
    FriendModule,
  ],
  controllers: [DMController],
  providers: [DMService, AwsService, { provide: APP_FILTER, useClass: TokenExpiredFilter }],
  exports: [DMService],
})
export class DMModule {}
