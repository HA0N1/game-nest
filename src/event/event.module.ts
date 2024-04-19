import { Module } from '@nestjs/common';
import { RoomGateway } from './event.gateway';
import { ChannelModule } from 'src/channel/channel.module';
import { User } from 'src/user/entities/user.entity';
import { ChannelDMs } from 'src/channel/entities/channelDMs.entity';
import { ChannelChat } from 'src/channel/entities/channelChat.entity';
import { ChannelMember } from 'src/channel/entities/channelMember.entity';
import { Channel } from 'diagnostics_channel';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET_KEY'),
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Channel, ChannelMember, ChannelChat, ChannelDMs]),
    UserModule,
    ChannelModule,
  ],
  providers: [RoomGateway],
  exports: [],
})
export class EventModule {}
