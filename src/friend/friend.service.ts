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
  async beFriend(user: User, email: string) {
    // 친구할 유저의 이메일로 조회
    const friend = await this.userRepository.findOneBy({ email });

    if (!friend) {
      throw new NotFoundException('해당 이메일을 가진 유저가 존재하지 않습니다.');
    }

    // TODO: 튜터님께 디엠 오면 다시 확인!
    // /* 이전에 친구 맺었던 적이 있는지 확인 -> 있다면 soft delete된 상태이므로 되돌리고 soft delete 취소함 */
    // await this.friendshipRepository
    //   .createQueryBuilder()
    //   .restore()
    //   .where('user_id = :user_id', { user_id: user.id })
    //   .execute();

    await this.friendshipRepository.save({
      user,
      friend,
    });

    return { message: `${friend.nickname}님께 친구 신청을 보냈습니다.` };
  }

  /* 친구창 조회 */
  async allFriend(user: User) {
    return await this.friendshipRepository
      .createQueryBuilder('me')
      .select(['me.id', 'me.is_friend', 'us.id', 'us.nickname', 'fr.id', 'fr.nickname'])
      .where('me.user_id = :user_id', { user_id: user.id })
      .andWhere('me.is_friend = true')
      .leftJoin('me.user', 'us')
      .leftJoin('me.friend', 'fr')
      .addSelect(['us.id', 'us.nickname', 'fr.id', 'fr.nickname'])
      .getMany();
  }

  /* 내가 보낸 친구 요청 조회 */
  async sent(user: User) {
    return await this.friendshipRepository
      .createQueryBuilder('me')
      .where('me.user_id = :user_id', { user_id: user.id })
      .andWhere('me.is_friend = false')
      .leftJoin('me.user', 'us')
      .leftJoin('me.friend', 'fr')
      .select(['me.id', 'me.is_friend', 'us.id', 'us.nickname', 'fr.id', 'fr.nickname'])
      .getMany();
  }

  /* 나에게 온 친구 요청 조회 */
  async requests(user: User) {
    return await this.friendshipRepository
      .createQueryBuilder('me')
      .where('me.friend_id = :friend_id', { friend_id: user.id })
      .andWhere('me.is_friend = false')
      .leftJoin('me.user', 'us')
      .leftJoin('me.friend', 'fr')
      .select(['me.id', 'me.is_friend', 'us.id', 'us.nickname', 'fr.id', 'fr.nickname'])
      .getMany();
  }

  /* 친구 수락 */
  async accept(user: User, id: number) {
    const resistRequest = await this.friendshipRepository.findOneBy({ id });
    if (!resistRequest) {
      throw new NotFoundException('존재하지 않는 친구 신청입니다.');
    }

    await this.friendshipRepository
      .createQueryBuilder()
      .update(Friendship)
      .set({ is_friend: true })
      .where('me.friend_id = :friend_id', { friend_id: user.id })
      .andWhere('id = :id', { id })
      .execute();

    return { message: '친구 수락이 완료되었습니다.' };
  }

  /* 친구 삭제 */
  async deleteFriend(user: User, email: string) {}
}
