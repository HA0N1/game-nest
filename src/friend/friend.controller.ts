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
  @UseGuards(AuthGuard('jwt'))
  @Post('send')
  async beFriend(@UserInfo() user: User, @Body() beFriendDto: BeFriendDto) {
    return await this.friendService.beFriend(user, beFriendDto.email);
  }

  /* 친구창 조회 */
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async allFriend(@UserInfo() user: User) {
    return await this.friendService.allFriend(user);
  }

  /* 내가 보낸 친구 요청 조회 */
  @UseGuards(AuthGuard('jwt'))
  @Get('sentFriends')
  async sent(@UserInfo() user: User) {
    return await this.friendService.sent(user);
  }

  /* 나에게 온 친구 요청 조회 */
  @UseGuards(AuthGuard('jwt'))
  @Get('beFriends')
  async findRequests(@UserInfo() user: User) {
    return await this.friendService.requests(user);
  }

  /* 친구 수락 */
  @UseGuards(AuthGuard('jwt'))
  @Patch('accept')
  async accept(@UserInfo() user: User, @Param() id: number) {
    return await this.friendService.accept(user, id);
  }

  /* 친구 삭제 */
  @UseGuards(AuthGuard('jwt'))
  @Delete()
  async deleteFriend(@Param() id: number) {
    return await this.friendService.deleteFriend(id);
  }
}
