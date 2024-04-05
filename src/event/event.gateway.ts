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
/**
 * channel -> chat
 * socket.nsp.name  으로 접근 가능
 * socket.io의 on = handleMessage
 */
@WebSocketGateway({ namespace: /\/ws-.+/ }) //  1:1 DM도 써야하니까 채널말고도 다른 주소도 들어올 수 있게.
export class EventGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() public server: Server;
  // SubscribeMessage = 커스텀으로 만듦
  @SubscribeMessage('test')
  handletest(@MessageBody() data: string) {
    console.log('test', data);
  }

  // @SubscribeMessage('login')
  // handleLogin(@MessageBody() data: { id: number; channels: number[] }, @ConnectedSocket() socket: Socket) {
  //   const newNamespace = socket.nsp;
  //   console.log('login', newNamespace);
  //   onlineMap[socket.nsp.name][socket.id] = data.id;
  //   newNamespace.emit('onlineList', Object.values(onlineMap[socket.nsp.name]));
  //   data.channels.forEach(channel => {
  //     console.log('join', socket.nsp.name, channel);
  //     socket.join(`${socket.nsp.name}-${channel}`);
  //   });
  // }

  @SubscribeMessage('message')
  handleMessge(@MessageBody() data: { channel: number; message: string }, @ConnectedSocket() socket: Socket) {
    console.log('message received', data);
    const { channel, message } = data;
    const channelName = `${socket.nsp.name}-${channel}`;

    this.server.to(channelName).emit('message', { sender: onlineMap[socket.nsp.name][socket.id], message });
  }
  //OnGatewayInit pair
  afterInit(server: Server): any {
    console.log('websocket server init');
  }
  //OnGatewayConnection pair
  handleConnection(@ConnectedSocket() socket: Socket) {
    console.log('connected', socket.nsp.name);
    if (!onlineMap[socket.nsp.name]) {
      onlineMap[socket.nsp.name] = {};
    }
    // 지정된 하위 네임스페이스의 모든 클라이언트에게 브로드캐스트
    socket.emit('hello', socket.nsp.name);
  }
  //OnGatewayDisconnect pair
  handleDisconnect(@ConnectedSocket() socket: Socket) {
    console.log('disconnected', socket.nsp.name);
    const newNamespace = socket.nsp;
    delete onlineMap[socket.nsp.name][socket.id];
    newNamespace.emit('onlineList', Object.values(onlineMap[socket.nsp.name]));
  }
}
