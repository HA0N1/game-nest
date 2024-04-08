import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { Friendship } from './entities/friendship.entity';
import { FriendDMs } from './entities/friendDMs.entity';
import { DMRoom } from './entities/DM-room.entity';
import _ from 'lodash';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Friendship)
    private friendshipRepository: Repository<Friendship>,
    @InjectRepository(FriendDMs)
    private friendDMsRepository: Repository<FriendDMs>,
    @InjectRepository(DMRoom)
    private dmRoomRepository: Repository<DMRoom>,
  ) {}

  /* 친구 요청 */
  async beFriend(user: User, email: string) {}

  /* 친구 수락 */
  async accept(user: User) {}

  /* 친구 조회 */
  async findFriends(user: User) {}

  /* 친구 삭제 */
  async deleteFriend(user: User, email: string) {}
}
