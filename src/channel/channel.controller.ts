import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { CreateChatDto } from './dto/create-chat.dto';

@Controller('channel')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  // channel
  @Post()
  createChannel(@Body() createChannelDto: CreateChannelDto) {
    this.channelService.createChannel(createChannelDto);
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

  @Patch(':id')
  async updateChannel(@Param('id') id: string, @Body() updateChannelDto: UpdateChannelDto) {
    const channel = await this.channelService.updateChannel(+id, updateChannelDto);
    return channel;
  }
  // TODO: 추후 관리자일때만 삭제하게 수정해야 함
  @Delete(':id')
  async removeChannel(@Param('id') id: string) {
    await this.channelService.deleteChannel(+id);
    return { message: '성공적으로 삭제되었습니다.' };
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
