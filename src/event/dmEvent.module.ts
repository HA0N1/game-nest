import { Module } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { DMGateway } from './dmEvent.gateway';
import { Friendship } from 'src/friend/entities/friendship.entity';
import { FriendDMs } from 'src/dm/entities/friendDMs.entity';
import { DMRoom } from 'src/dm/entities/DM-room.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DMModule } from 'src/dm/dm.module';
import { DMService } from 'src/dm/dm.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET_KEY'),
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Friendship, FriendDMs, DMRoom]),
    DMModule,
    UserModule,
  ],
  providers: [DMGateway],
})
export class DmEventModule {}
