import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { User } from 'src/user/entities/user.entity';
import { Friendship } from 'src/friend/entities/friendship.entity';
import _ from 'lodash';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendDMs } from './entities/friendDMs.entity';
import { DMRoom } from './entities/DM-room.entity';

@Injectable()
export class DMService {
  constructor(
    @InjectRepository(FriendDMs)
    private friendDMsRepository: Repository<FriendDMs>,
    @InjectRepository(DMRoom)
    private dmRoomRepository: Repository<DMRoom>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Friendship)
    private friendshipRepository: Repository<Friendship>,
  ) {}

  /* friendshipId로 디엠 방 생성 함수 */
  async createDMRoom(userId: number, friendshipId: number) {}

  /* userId로 디엠 방 전체 조회 */
  async getDMRooms(userId: number) {}

  /* dmroomId로 디엠 상세 조회*/
  // 디엠 내역들 조회하는 함수
  async findDMRoom(userId: number, dmRoomId: number) {}

  /* 텍스트 채팅 보내기 */
  async sendTextDM(userId: number, dmRoomId: number) {}

  /* 디엠 삭제 */
  async deleteRoom(userId: number, dmRoomId: number) {}
}
