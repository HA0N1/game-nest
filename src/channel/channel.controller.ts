import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Render } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { CreateChatDto } from './dto/create-chat.dto';
import { UseGuards } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { UserInfo } from 'src/utils/decorators/userInfo';
import { AuthGuard } from '@nestjs/passport';

@Controller('channel')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  //* channel
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createChannel(@UserInfo() user: User, @Body() createChannelDto: CreateChannelDto) {
    await this.channelService.createChannel(user.id, createChannelDto);
    return { message: '채널 생성이 완료되었습니다.' };
  }

  @Get()
  @Render('chat')
  findAllChannel() {
    return this.channelService.findAllChannel();
  }

  @Get(':ichannelIdd')
  findOneChannel(@Param('channelId') channelId: string) {
    return this.channelService.findOneChannel(+channelId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':channelId')
  async updateChannel(
    @UserInfo() user: User,
    @Param('channelId') channelId: string,
    @Body() updateChannelDto: UpdateChannelDto,
  ) {
    const channel = await this.channelService.updateChannel(user.id, +channelId, updateChannelDto);
    return channel;
  }

  @UseGuards(AuthGuard('jwt'))
  // @Roles(MemberRole.Admin)
  // @UseGuards(RolesGuard)
  @Delete(':channelId')
  async removeChannel(@UserInfo() user: User, @Param('channelId') channelId: string) {
    await this.channelService.deleteChannel(+user.id, +channelId);
    return { message: '성공적으로 삭제되었습니다.' };
  }
  // 채널 초대
  @Post('invite/:channelId')
  async inviteChannel(@Param('channelId') channelId: string, @Body('email') email: string) {
    const url = await this.channelService.linkToInvite(+channelId, email);
    return { url };
  }
  // 수락
  @Post('accept')
  async acceptInvite(@Query('code') code: string) {
    await this.channelService.getUserIdAndChannelIdFromLink(code);
    return { message: '채널에 정상적으로 입장하였습니다.' };
  }

  //* chat
  @UseGuards(AuthGuard('jwt'))
  @Post(':channelId/chat')
  async createChat(
    @UserInfo() user: User,
    @Param('channelId') channelId: string,
    @Body() createChatDto: CreateChatDto,
  ) {
    await this.channelService.createChat(+channelId, createChatDto);
    return { message: '채팅방 생성이 완료되었습니다.' };
  }

  @Delete(':channelId/chat/:chatId')
  async removeChat(@Param('channelId') channelId: string, @Param('chatId') chatId: string) {
    await this.channelService.deleteChat(+channelId, +chatId);
    return { message: '성공적으로 삭제되었습니다.' };
  }

  //* dms
  // @UseGuards(AuthGuard('jwt'))
  // @Post(':channelId/chat/:chatId')
  // async sendMessage(
  //   @Param('channelId') channelId: string,
  //   @Param('chatId') chatId: string,
  //   @UserInfo() user: User,
  //   @Body() content: string,
  // ) {
  //   console.log('ChannelController ~ sendMessage ~ user:', user);
  //   await this.channelService.sendMessage(+channelId, +chatId, user.id, content);
  // }
}
