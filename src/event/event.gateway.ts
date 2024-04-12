// event.gateway.ts
import { InjectRepository } from '@nestjs/typeorm';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChannelService } from 'src/channel/channel.service';
import { CreateChatDto } from 'src/channel/dto/create-chat.dto';
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
export class EventGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly channelService: ChannelService) {}

  @WebSocketServer() server: Server;

  // 새로운 클라이언트가 웹소켓 서버에 연결될 때 호출되는 메소드
  afterInit(): void {
    console.log('준비완료');
  }

  // 웹소켓 서버에 연결될 때 호출되는 메소드
  handleConnection(socket: Socket) {
    console.log(`Client connected: ${socket.id}`);
  }

  // 웹소켓 연결이 종료되었을 때 호출되는 메소드
  handleDisconnect(socket: Socket) {
    console.log(`Client disconnected: ${socket.id}`);
  }

  // @SubscribeMessage('createChat')
  // async handleCreateChat(
  //   client: Socket,
  //   payload: { channelMemberId: number; channelId: number; createChatDto: CreateChatDto },
  // ): Promise<void> {
  //   try {
  //     const chat = await this.channelService.createChat(
  //       payload.channelMemberId,
  //       payload.channelId,
  //       payload.createChatDto,
  //     );
  //     this.server.emit('chatCreated', chat);
  //   } catch (error) {
  //     client.emit('exception', { message: error.message });
  //   }
  // }

  @SubscribeMessage('message')
  handleMessage(socket: Socket, data: any): void {
    this.server.emit('message', `client-${socket.id.substring(0, 4)}: ${data}`);
  }
}
