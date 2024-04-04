import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { CreateChatDto } from './dto/create-chat.dto';
import { UseGuards } from '@nestjs/common';
import redisCache from 'src/redis/config';
import { User } from 'src/user/entities/user.entity';
import { UserInfo } from 'src/utils/decorators/userInfo';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guard/member-role';

@Controller('channel')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  // channel
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createChannel(@UserInfo() user: User, @Body() createChannelDto: CreateChannelDto) {
    await this.channelService.createChannel(user.id, createChannelDto);
    return { message: '채널 생성이 완료되었습니다.' };
  }

  @Get()
  findAllChannel() {
    return this.channelService.findAllChannel();
  }

  @Get(':id')
  findOneChannel(@Param('id') id: string) {
    return this.channelService.findOneChannel(+id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async updateChannel(@UserInfo() user: User, @Param('id') id: string, @Body() updateChannelDto: UpdateChannelDto) {
    const channel = await this.channelService.updateChannel(user.id, +id, updateChannelDto);
    return channel;
  }
  // TODO: 추후 관리자일때만 삭제하게 수정해야 함

  @UseGuards(AuthGuard('jwt'))
  @UseGuards(RolesGuard)
  @Delete(':id')
  async removeChannel(@UserInfo() user: User, @Param('id') id: string) {
    await this.channelService.deleteChannel(+id);
    return { message: '성공적으로 삭제되었습니다.' };
  }
  // 채널 초대
  @Post('invite/:id')
  async inviteChannel(@Param('id') id: string, @Body('email') email: string) {
    const url = await this.channelService.linkToInvite(+id, email);
    return { url };
  }
  // 수락
  @Post('accept')
  async acceptInvite(@Query('code') code: string) {
    await this.channelService.getUserIdAndChannelIdFromLink(code);
    return { message: '채널에 정상적으로 입장하였습니다.' };
  }

  // chat
  @Post(':id/chat')
  async createChat(@Param('id') id: string, @Body() createChatDto: CreateChatDto) {
    await this.channelService.createChat(+id, createChatDto);
    return { message: '채팅방 생성이 완료되었습니다.' };
  }

  @Delete(':channelId/chat/:chatId')
  async removeChat(@Param('channelId') channelId: string, @Param('chatId') chatId: string) {
    await this.channelService.deleteChat(+channelId, +chatId);
    return { message: '성공적으로 삭제되었습니다.' };
  }
}
