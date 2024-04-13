// event.gateway.ts
import { InjectRepository } from '@nestjs/typeorm';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChannelService } from 'src/channel/channel.service';
import { ChannelDMs } from 'src/channel/entities/channelDMs.entity';
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
@WebSocketGateway({ namespace: 'chat' })
export class ChatGateway {
  constructor(
    private readonly channelService: ChannelService,
    @InjectRepository(ChannelDMs)
    private DMsRepo: Repository<ChannelDMs>,
  ) {}
  @WebSocketServer() server: Server;

  @SubscribeMessage('message')
  handleMessage(socket: Socket, data: any): void {
    const { message, nickname } = data;
    socket.broadcast.emit('message', `${nickname}: ${message}`); // 브로드캐스트
    // this.server.emit('message', `client-${socket.id.substring(0, 4)}: ${data}`);
  }
}
//* ROOM
@WebSocketGateway({ namespace: 'room' })
export class RoomGateway {
  constructor(private readonly chatGateway: ChatGateway) {}
  rooms = [];

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('createRoom')
  handleMessage(@MessageBody() data) {
    const { nickname, room } = data;
    console.log('RoomGateway ~ handleMessage ~ room:', room);
    // 방 생성 시 이벤트
    this.chatGateway.server.emit('notice', { message: `${nickname}님이 ${room}방을 만들었습니다.` });
    this.rooms.push(room);
    this.server.emit('rooms', this.rooms);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(socket: Socket, data) {
    const { nickname, room } = data;
    this.chatGateway.server.emit('notice', { message: `${nickname}님이 ${room}방에 입장하였습니다` });
    socket.join(room);
  }

  @SubscribeMessage('message')
  handleMessageToRoom(socket: Socket, data: any): void {
    const { message, room, nickname } = data;
    console.log(data);
    socket.broadcast.to(room).emit('message', { message: `${nickname}: ${message}` });
  }
}
