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
import { CreateChatDto } from 'src/channel/dto/create-chat.dto';
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

  // @SubscribeMessage('message')
  // handleMessage(socket: Socket, data: any): void {
  //   const { message, nickname } = data;
  //   socket.broadcast.emit('message', `${nickname}: ${message}`); // 브로드캐스트
  // this.server.emit('message', `client-${socket.id.substring(0, 4)}: ${data}`);
}
// }
//* ROOM
@WebSocketGateway({ namespace: 'room' })
export class RoomGateway {
  constructor(
    private readonly chatGateway: ChatGateway,
    private readonly channelService: ChannelService,
    @InjectRepository(ChannelDMs)
    private DMsRepo: Repository<ChannelDMs>,
  ) {}
  rooms = [];

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('createRoom')
  async handleMessage(@MessageBody() data) {
    const { room, nickname, createChatDto } = data; // createChatDto도 받아옴
    const { title, chatType, channelId, maximumPeople } = createChatDto; // createChatDto에서 필요한 데이터 추출
    console.log('RoomGateway ~ handleMessage ~ room:', room);
    // 방 생성 시 이벤트
    this.chatGateway.server.emit('notice', { message: `${nickname}님이 ${room}방을 만들었습니다.` });
    this.rooms.push(room);
    const rooms = await this.channelService.findAllChat();
    this.server.emit('roomCreated', { room: room });
    this.server.emit('rooms', rooms);
    // 채널 서비스의 createChat 함수 호출
    await this.channelService.createChat(channelId, { title: room, chatType, maximumPeople });
  }

  @SubscribeMessage('requestRooms')
  async handleRequestRooms(client: Socket) {
    try {
      const rooms = await this.channelService.findAllChat();
      console.log('RoomGateway ~ handleRequestRooms ~ rooms:', rooms);

      this.server.emit('rooms', rooms);
    } catch (error) {
      // Handle error
      console.error('Error fetching chat rooms:', error);
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(socket: Socket, data) {
    const { nickname, room } = data;
    this.chatGateway.server.emit('notice', { message: `${nickname}님이 ${room}방에 입장하였습니다` });
    socket.join(room);
  }

  @SubscribeMessage('message')
  async handleMessageToRoom(socket: Socket, data: any): Promise<void> {
    const { message, room, nickname } = data;
    console.log(data);
    const dm = this.DMsRepo.create({
      content: message,
      senderId: 1,
      channelChatId: 37,
    });
    await this.DMsRepo.save(dm);
    socket.broadcast.to(room).emit('message', { message: `${nickname}: ${message}` });
  }
}
