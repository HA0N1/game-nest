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
import { nextTick } from 'process';
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
    if (!cookie) {
      throw new WsException('토큰이 없습니다.');
    }
    try {
      const token = cookie.split('=')[1];
      const payload = this.jwtService.verify(token, { secret: this.config.get<string>('JWT_SECRET_KEY') });
      const user = await this.userService.findUserByEmail(payload.email);

      socket.user = user;
      const userId = socket.user.id;
      await this.redis.set(`socketId:${socket.id}`, +userId);
      // const user = await this.redis.get(`socketId:${socket.id}`);
      return true;
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('createRoom')
  async handleMessage(@MessageBody() data) {
    const { room, createChatDto } = data;
    const { title, chatType, channelId, maximumPeople } = createChatDto;
    console.log('RoomGateway ~ handleMessage ~ room:', room);
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

  @SubscribeMessage('requestChatHistory')
  async handleRequestChatHistory(socket: Socket, data: any): Promise<void> {
    const { room } = data;

    try {
      // 채널 정보 조회
      const channelRoom = await this.channelService.findOneChat(room);
      const channelChatId = channelRoom.id;

      // 해당 채널의 채팅 내역 조회
      const dms = await this.DMsRepo.createQueryBuilder('dm')
        .leftJoinAndSelect('dm.user', 'user')
        .where('dm.channelChatId = :channelChatId', { channelChatId })
        .getMany();

      // 발신자 닉네임과 함께 클라이언트에 전송
      const dmsWithNickname = dms.map(dm => ({
        ...dm,
        senderNickname: dm.user.nickname,
      }));

      // 클라이언트에게 채팅 내역 전송
      socket.emit('dmHistory', dmsWithNickname);
    } catch (error) {
      // 에러 처리
      console.error('Error fetching chat history:', error);
    }
  }
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(socket: Socket & { user: User }, data: any) {
    const { room } = data;

    const senderId = +(await this.redis.get(`socketId:${socket.id}`));
    const foundUser = await this.userService.findUserById(+senderId);
    const nickname = foundUser.nickname;

    this.server.emit('notice', { message: `${nickname}님이 ${room}방에 입장하였습니다` });
    socket.join(room);
  }

  @SubscribeMessage('chatType')
  async handleChatType(socket: Socket, data: any) {
    const { room } = data;
    const channelRoom = await this.channelService.findOneChat(room);
    console.log('RoomGateway ~ handleJoinRoom ~ channelRoom:', channelRoom);
    const chatType = channelRoom.chatType;

    this.server.emit('chatType', chatType);
  }

  @SubscribeMessage('message')
  async handleMessageToRoom(socket: Socket & { user: User }, data: any): Promise<void> {
    const { message, room } = data;
    console.log(data);

    const userId = socket.user.id;

    const channelRoom = await this.channelService.findOneChat(room);
    const foundUser = await this.userService.findUserById(+userId);
    const nickname = foundUser.nickname;

    // 메시지 저장
    const dm = this.DMsRepo.create({
      content: message,
      senderId: socket.user.id,
      channelChatId: +channelRoom.id,
    });
    await this.DMsRepo.save(dm);
    socket.broadcast.to(room).emit('message', { message: `${nickname}: ${message}` });
  }
}
