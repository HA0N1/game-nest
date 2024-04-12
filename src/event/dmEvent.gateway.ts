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
import { Logger } from '@nestjs/common';

@WebSocketGateway(81, { namespace: 'direct_message' })
export class DMGateway {
  @WebSocketServer()
  server;

  wsClients = [];

  @SubscribeMessage('joinDM')
  handleJoinDM(@MessageBody() data: {}, @ConnectedSocket() client: Socket) {}
}
