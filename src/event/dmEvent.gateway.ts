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
import { UserService } from 'src/user/user.service';

@WebSocketGateway(81, { cors: 'localhost:3000', namespace: 'direct_message' })
export class DMGateway {
  @WebSocketServer()
  server: Server;
  private logger: Logger = new Logger('DMsGateway');

  constructor(
    private readonly dmService: DMService,
    private readonly userService: UserService,
  ) {}

  wsClients = [];

  @SubscribeMessage('joinDM')
  handleJoinDM(@MessageBody() data: { dmRoomId: number }, @ConnectedSocket() client: Socket) {
    const { dmRoomId } = data;
    const dmRoomName = `DMRoom: ${dmRoomId}`;
    client.join(dmRoomName);
    console.log('join', '참여 완료');
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() message: { dmRoomId: string; content: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { dmRoomId, content, userId } = message;
    const dmRoomName = `DMRoom: ${dmRoomId}`;
    client.to(dmRoomName).emit('receiveMessage', { userId, content });

    await this.dmService.saveDM(dmRoomId, content, userId);
  }
  // TODO: mongoDB 연결하기
}
