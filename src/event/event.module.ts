import { Module, forwardRef } from '@nestjs/common';
import { EventGateway } from './event.gateway';
import { ChannelModule } from 'src/channel/channel.module';
import { ChannelService } from 'src/channel/channel.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from 'src/channel/entities/channel.entity';
import { ChannelMember } from 'src/channel/entities/channelMember.entity';
import { ChannelChat } from 'src/channel/entities/channelChat.entity';
import { ChannelDMs } from 'src/channel/entities/channelDMs.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Channel, ChannelMember, ChannelChat, ChannelDMs, User]), ChannelModule],
  providers: [EventGateway, ChannelService],
  exports: [EventGateway],
})
export class EventModule {}
