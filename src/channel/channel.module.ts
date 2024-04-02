import { Module } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { ChannelController } from './channel.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { ChannelMember } from './entities/channelMember.entity';
import { ChannelChat } from './entities/channelChat.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Channel, ChannelMember, ChannelChat])],
  controllers: [ChannelController],
  providers: [ChannelService],
})
export class ChannelModule {}
