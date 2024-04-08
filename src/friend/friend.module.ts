import { Module } from '@nestjs/common';
import { FriendService } from './friend.service';
import { FriendController } from './friend.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Friendship } from './entities/friendship.entity';
import { FriendDMs } from './entities/friendDMs.entity';
import { DMRoom } from './entities/DM-room.entity';
import { UserModule } from 'src/user/user.module';
import { JwtStrategy } from 'src/auth/jwt.strategy';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Friendship, FriendDMs, DMRoom]), UserModule],
  controllers: [FriendController],
  providers: [FriendService, JwtStrategy, UserService],
})
export class FriendModule {}
