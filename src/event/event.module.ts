import { Module } from '@nestjs/common';
import { ChatGateway, RoomGateway } from './event.gateway';
import { ChannelModule } from 'src/channel/channel.module';
import { User } from 'src/user/entities/user.entity';
import { ChannelDMs } from 'src/channel/entities/channelDMs.entity';
import { ChannelChat } from 'src/channel/entities/channelChat.entity';
import { ChannelMember } from 'src/channel/entities/channelMember.entity';
import { Channel } from 'diagnostics_channel';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User, Channel, ChannelMember, ChannelChat, ChannelDMs]), ChannelModule],
  providers: [ChatGateway, RoomGateway],
})
export class EventModule {}
