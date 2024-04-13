import { Module } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { DMGateway } from './dmEvent.gateway';
import { Friendship } from 'src/friend/entities/friendship.entity';
import { FriendDMs } from 'src/dm/entities/friendDMs.entity';
import { DMRoom } from 'src/dm/entities/DM-room.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DMModule } from 'src/dm/dm.module';
import { DMService } from 'src/dm/dm.service';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Friendship, FriendDMs, DMRoom]), DMModule],
  providers: [DMGateway, DMService, UserService],
  exports: [DMGateway],
})
export class DmEventModule {}
