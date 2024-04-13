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
import { DMService } from 'src/dm/dm.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway(81, { namespace: 'direct_message' })
export class DMGateway {
  constructor(private readonly dmService: DMService) {}
  @WebSocketServer()
  server: Server;
  private logger: Logger = new Logger('DMsGateway');

  wsClients = [];

  @SubscribeMessage('joinDM')
  handleJoinDM(@MessageBody() data: { dmRoomId: number }, @ConnectedSocket() client: Socket) {
    const { dmRoomId } = data;
    const dmRoomName = `DMRoom: ${dmRoomId}`;
    client.join(dmRoomName);
    console.log('join', '참여 완료');
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() message: { dmRoomId: number }, @ConnectedSocket() client: Socket) {
    const { dmRoomId } = message;
    const dmRoomName = `DMRoom: ${dmRoomId}`;
  }
  // TODO: mongoDB 연결하기
}
