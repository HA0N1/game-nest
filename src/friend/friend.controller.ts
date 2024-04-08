import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { FriendService } from './friend.service';
import { UserService } from 'src/user/user.service';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/user/entities/user.entity';
import { UserInfo } from 'src/utils/decorators/userInfo';
import { BeFriendDto } from './dto/be-friend.dto';

@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  /* 친구 요청 */
  @Post('request')
  async beFriend(@UserInfo() user: User, @Body() beFriendDto: BeFriendDto) {
    return await this.friendService.beFriend(user, beFriendDto.email);
  }

  /* 친구 수락 */
  @UseGuards(AuthGuard('jwt'))
  @Patch('accept')
  async accept(@UserInfo() user: User) {
    return await this.friendService.accept(user);
  }

  /* 친구 조회 */
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findFriends(@UserInfo() user: User) {
    return await this.friendService.findFriends(user);
  }

  /* 친구 삭제 */
  @UseGuards(AuthGuard('jwt'))
  @Delete()
  async deleteFriend(@UserInfo() user: User, @Body() email: string) {
    return await this.friendService.deleteFriend(user, email);
  }
}
