// event.gateway.ts
import { InjectRedis } from '@nestjs-modules/ioredis';
import { UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import Redis from 'ioredis';
import { Server, Socket } from 'socket.io';
import { WsGuard } from 'src/auth/guard/ws.guard';
import { ChannelService } from 'src/channel/channel.service';
import { CreateChatDto } from 'src/channel/dto/create-chat.dto';
import { ChannelDMs } from 'src/channel/entities/channelDMs.entity';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';

/**
 * 게이트 웨이 설정
 * WebSocketGateway() : 기본 포트 3000
 * WebSocketGateway(port) : 원하는 포트 사용
 * WebSocketGateway(options) : 기본 3000 + 원하는 옵션
 * WebSocketGateway(port, options) : 원하는 포트 + 원하는 옵션
 *
 * 웹소켓 서버 인스턴스 접근
 * WebSocketServer()
 */

@WebSocketGateway({ namespace: 'room' })
export class RoomGateway implements OnGatewayConnection {
  constructor(
    private readonly channelService: ChannelService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,

    @InjectRepository(ChannelDMs)
    private DMsRepo: Repository<ChannelDMs>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRedis() private readonly redis: Redis,
  ) {}
  rooms = [];
  @WebSocketServer() server: Server;

  async handleConnection(socket: Socket & { user: User }) {
    console.log(`connect: ${socket.id}`);

    const cookie = socket.handshake.headers.cookie;
    if (!cookie) throw new WsException('no쿠키');
    // const headers = socket.handshake.headers;
    // const rawToken = headers['authorization'];
    // if (!rawToken) {
    //   throw new WsException('토큰이 없습니다.');
    // }
    // try {
    //   const token = rawToken.split(' ')[1];

    //   const payload = this.jwtService.verify(token, { secret: this.config.get<string>('JWT_SECRET_KEY') });
    //   const user = await this.userService.findUserByEmail(payload.email);

    //   socket.user = user;
    //   return true;
    // } catch (error) {
    //   socket.disconnect();
    //   throw new WsException(error.message);
    // }
  }

  @SubscribeMessage('createRoom')
  async handleMessage(@MessageBody() data) {
    const { room, nickname, createChatDto } = data;
    const { title, chatType, channelId, maximumPeople } = createChatDto;
    console.log('RoomGateway ~ handleMessage ~ room:', room);
    this.server.emit('notice', { message: `${nickname}님이 ${room}방을 만들었습니다.` });
    // 채널 서비스의 createChat 함수 호출
    await this.channelService.createChat(channelId, { title: room, chatType, maximumPeople });
    const rooms = await this.channelService.findAllChat();
    this.server.emit('rooms', rooms);
  }

  @SubscribeMessage('requestRooms')
  async handleRequestRooms(socket: Socket) {
    try {
      const rooms = await this.channelService.findAllChat();

      this.server.emit('rooms', rooms);
    } catch (error) {
      // Handle error
      console.error('Error fetching chat rooms:', error);
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(socket: Socket, data) {
    const { nickname, room } = data;
    this.server.emit('notice', { message: `${nickname}님이 ${room}방에 입장하였습니다` });
    socket.join(room);
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('message')
  async handleMessageToRoom(socket: Socket & { user: User }, data: any): Promise<void> {
    const { message, room } = data;
    console.log(data);

    const userId = socket.user.id;
    await this.redis.set(`socketId:${socket.id}`, +userId);
    const user = await this.redis.get(`socketId:${socket.id}`);
    const foundUser = await this.userService.findUserById(+user);
    console.log('RoomGateway ~ handleMessageToRoom ~ foundUser:', foundUser);
    const channelRoom = await this.channelService.findOneChat(room);
    const nickname = foundUser.nickname;
    const dm = this.DMsRepo.create({
      content: message,
      senderId: socket.user.id,
      channelChatId: +channelRoom.id,
    });
    await this.DMsRepo.save(dm);
    socket.broadcast.to(room).emit('message', { message: `${nickname}: ${message}` });
  }
}
