import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { Friendship } from './entities/friendship.entity';
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
  ) {}

  /* 친구 요청 */
  async beFriend(user: User, email: string) {
    // 친구할 유저의 이메일로 조회
    const friend = await this.userRepository.findOneBy({ email });
    console.log(email);

    if (!friend) {
      throw new NotFoundException('해당 이메일을 가진 유저가 존재하지 않습니다.');
    }

    await this.friendshipRepository.save({
      user,
      friend,
    });

    return { message: `${friend.nickname}님께 친구 신청을 보냈습니다.` };
  }

  /* 친구창 조회 */
  async allFriend(user: User) {
    const myId = user.id;
    const data = await this.friendshipRepository
      .createQueryBuilder('friendship')
      .select(['friendship.id', 'us.id', 'us.nickname', 'us.email', 'fr.id', 'fr.nickname', 'fr.email'])
      .where('friendship.user_id = :user_id', { user_id: myId })
      .orWhere('friendship.friend_id = :friend_id', { friend_id: myId })
      .andWhere('friendship.is_friend = true')
      .leftJoin('friendship.user', 'us')
      .leftJoin('friendship.friend', 'fr')
      .getRawMany();

    const dataValue = Object.values(data);

    const friendData = dataValue.map(e => {
      if (e.us_id === myId) {
        return {
          friendshipId: e.friendship_id,
          friendId: e.fr_id,
          friendEmail: e.fr_email,
          friendNickname: e.fr_nickname,
        };
      } else {
        return {
          friendshipId: e.friendship_id,
          friendId: e.us_id,
          friendEmail: e.us_email,
          friendNickname: e.us_nickname,
        };
      }
    });

    return friendData;
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
      .getRawMany();
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
      .getRawMany();
  }

  /* 친구 수락 */
  async accept(user: User, friendshipId: number) {
    // 내가 받은 요청인지 확인
    const check = await this.friendshipRepository
      .createQueryBuilder('fs')
      .select(['fs.id', 'fr.id'])
      .leftJoin('fs.friend', 'fr')
      .where('fs.id = :id', { id: friendshipId })
      .getRawOne();

    if (check.fr_id !== user.id) {
      throw new BadRequestException('본인이 받은 친구 신청이 아닙니다.');
    }

    // is_friend true로 수정
    await this.friendshipRepository
      .createQueryBuilder()
      .update(Friendship)
      .set({ is_friend: true })
      .where('friend_id = :friend_id', { friend_id: user.id })
      .andWhere('id = :id', { id: friendshipId })
      .execute();

    return { message: '친구 수락이 완료되었습니다.' };
  }

  /* 친구 취소 */
  async deleteFriend(id: number) {
    const resist = await this.friendshipRepository.findOneBy({ id });
    if (!resist) {
      throw new NotFoundException('존재하지 않는 친구입니다.');
    }

    await this.friendshipRepository.delete({ id });

    return { message: '친구 관계를 취소했습니다.' };
  }
}
