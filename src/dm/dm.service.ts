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
  async createDMRoom(userId: number, friendshipId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });

    // 해당 friendshipId에 userId가 포함되어있는지 확인
    const resistFriend = await this.friendshipRepository
      .createQueryBuilder('fs')
      .select(['fs.id', 'us.id', 'us.nickname', 'fr.id', 'fr.nickname'])
      .leftJoin('fs.user', 'us')
      .leftJoin('fs.friend', 'fr')
      .where('fs.id=:id', { id: friendshipId })
      .getRawOne();

    if (!(resistFriend.us_id === userId || resistFriend.fr_id == userId)) {
      throw new BadRequestException('본인이 포함된 friendshipId를 작성해야 합니다.');
    }

    const friendship = await this.friendshipRepository.findOneBy({ id: friendshipId });

    // 이미 디엠방이 존재하는지 확인
    const resistDmRoom = await this.dmRoomRepository.findOneBy({ friendship });

    if (resistDmRoom) {
      throw new BadRequestException('이미 존재하는 디엠방입니다.');
    }

    // friendshipId로 dmRoom 생성
    const dmRoom = await this.dmRoomRepository.save({
      friendship,
    });

    await this.friendshipRepository
      .createQueryBuilder()
      .update(Friendship)
      .set({ DMroom: dmRoom })
      .where('id = :id', { id: friendshipId })
      .execute();

    return { message: 'DMroom을 생성했습니다.' };
  }

  /* userId로 디엠 방 전체 조회 */
  async getDMRooms(userId: number) {
    // friendship 아이디들 먼저 조회
    const friendshipIds = await this.friendshipRepository
      .createQueryBuilder('friendship')
      .select('friendship.id')
      .where('friendship.user_id = :user_id', { user_id: userId })
      .orWhere('friendship.friend_id = :friend_id', { friend_id: userId })
      .andWhere('friendship.is_friend = true')
      .getMany();

    console.log(friendshipIds);

    // map 사용해서 해당 friendship 아이디마다 찾아오기
    // const dmRooms = friendshipIds.map(async fId => {
    //   return await this.dmRoomRepository
    //     .createQueryBuilder('dmRoom')
    //     // .select(['dmRoom.id', 'us.id', 'us.nickname', 'fr.id', 'fr.nickname'])
    //     .select()
    //     .where('fs.id = :friendship_id', { friendship_id: fId })
    //     .leftJoinAndSelect('dmRoom.friendship', 'fs')
    //     .leftJoinAndSelect('fs.user', 'us')
    //     .leftJoinAndSelect('fs.friend', 'fr')
    //     .getRawMany();
    // });

    // return dmRooms;
  }

  /* dmroomId로 디엠 상세 조회*/
  // 디엠 내역들 조회하는 함수
  async findDMRoom(userId: number, dmRoomId: number) {}

  /* 텍스트 채팅 보내기 */
  async sendTextDM(userId: number, dmRoomId: number) {}

  /* 디엠 삭제 */
  async deleteRoom(userId: number, dmRoomId: number) {
    // 본인이 소속된 방인지 확인
    // const check = await this.dmRoomRepository.createQueryBuilder().select().where
    // dmRoom 삭제
  }
}
