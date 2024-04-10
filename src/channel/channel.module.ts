import { Module } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { ChannelController } from './channel.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelMember } from './entities/channelMember.entity';
import { ChannelChat } from './entities/channelChat.entity';
import { User } from 'src/user/entities/user.entity';
import { UserModule } from 'src/user/user.module';
import { JwtStrategy } from 'src/auth/jwt.strategy';
import { EventModule } from 'src/event/event.module';
import { ChannelDMs } from './entities/channelDMs.entity';
import { Channel } from './entities/channel.entity';
import { RedisAppModule } from 'src/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Channel, ChannelMember, ChannelChat, ChannelDMs]),
    UserModule,
    RedisAppModule,
  ],
  controllers: [ChannelController],
  //EventGateway를 providers에 넣으면 채팅을 만들 때마다 웹소켓 서버가 생김
  providers: [ChannelService, JwtStrategy],
  exports: [ChannelService],
})
export class ChannelModule {}
