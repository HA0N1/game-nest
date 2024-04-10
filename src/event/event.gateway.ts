// event.gateway.ts
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { onlineMap } from './online-map';
import { ChannelService } from 'src/channel/channel.service';
import { Logger } from '@nestjs/common';
/**
 * channel -> chat
 * socket.nsp.name  으로 접근 가능
 * socket.io의 on = handleMessage
 */
// @WebSocketGateway({ namespace: /channel\/[0-9]+\/chat/ }) //  1:1 DM도 써야하니까 채널말고도 다른 주소도 들어올 수 있게.
// export class EventGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
//   @WebSocketServer() public server: Server;

//   // SubscribeMessage = 커스텀으로 만듦
//   @SubscribeMessage('message')
//   handleMessage(@MessageBody() data: { content: string; chatId: number }, @ConnectedSocket() socket: Socket) {
//     console.log('EventGateway ~ handleMessage ~ data:', data);
//     const { chatId, content } = data;
//     const channelName = `${socket.nsp.name}/${chatId}`;
//     console.log('EventGateway ~ onlineMap', onlineMap);
//     console.log(onlineMap[socket.nsp.name][socket.id]);
//     console.log('EventGateway ~ socket.id', socket.id);
//     console.log('EventGateway ~ handleMessage ~ channelName:', channelName);
//     this.server.to(channelName).emit('message', { sender: onlineMap[socket.nsp.name][socket.id], content });
//   }

//   //OnGatewayInit pair
//   afterInit(server: Server): any {
//     console.log('websocket server init');
//   }
//   //OnGatewayConnection pair
//   handleConnection(@ConnectedSocket() socket: Socket) {
//     console.log('connected', socket.nsp.name);
//     if (!onlineMap[socket.nsp.name]) {
//       onlineMap[socket.nsp.name] = {};
//     }
//     // 지정된 하위 네임스페이스의 모든 클라이언트에게 브로드캐스트
//     socket.emit('hello', socket.nsp.name);
//   }
//   //OnGatewayDisconnect pair
//   handleDisconnect(@ConnectedSocket() socket: Socket) {
//     console.log('disconnected', socket.nsp.name);
//     const newNamespace = socket.nsp;
//     delete onlineMap[socket.nsp.name][socket.id];
//     newNamespace.emit('onlineList', Object.values(onlineMap[socket.nsp.name]));
//   }@WebSocketGateway()
@WebSocketGateway({ namespace: 'channel/chat', cors: '*' })
export class EventGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly channelService: ChannelService) {}
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('EventsGateway');

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() data: { channelId: string; chatId: string }, @ConnectedSocket() client: Socket) {
    const { channelId, chatId } = data;
    const roomName = `channel:${channelId}:chat:${chatId}`;
    client.join(roomName);
    console.log('join', '참여완료');
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() message: { channelId: string; chatId: string; content: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { channelId, chatId, content, userId } = message;
    const roomName = `channel:${channelId}:chat:${chatId}`;
    client.to(roomName).emit('receiveMessage', { userId, content });

    await this.channelService.saveMessage(+channelId, +chatId, +userId, content);
  }
  //OnGatewayInit pair
  afterInit(server: Server) {
    this.logger.log('웹소켓 서버 초기화 ✅');
  }
  //OnGatewayConnection pair
  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client Connected : ${client.id}`);
  }
  //OnGatewayDisconnect pair
  handleDisconnect(client: Socket) {
    this.logger.log(`Client Disconnected : ${client.id}`);
  }
}
