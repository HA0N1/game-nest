import { InjectRepository } from '@nestjs/typeorm';
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
import { FriendDMs } from 'src/dm/entities/friendDMs.entity';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';

@WebSocketGateway({ namespace: 'friendDM' })
export class DMGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly dmService: DMService,
    private readonly userService: UserService,
  ) {}

  wsClients = [];

  async handleConnection(@ConnectedSocket() client: Socket) {
    console.log(`dm connect:${client.id}`);

    const socketId = client.id;
    this.addClient(socketId);
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const socketId = client.id;
    this.removeClient(socketId);
  }

  addClient(client) {
    this.wsClients.push(client);
  }

  removeClient(client) {
    const index = this.wsClients.indexOf(client);
    if (index !== -1) {
      this.wsClients.splice(index, 1);
    }
  }

  @SubscribeMessage('joinDM')
  handleJoinDM(@ConnectedSocket() socket: Socket, @MessageBody() roomData: any) {
    console.log('백엔드: ', roomData);
    const dmRoomName = `DMRoom: ${roomData}`;
    socket.join(dmRoomName);
    console.log('join', '참여 완료');
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() message: { dmRoomId: string; content: string; userId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const { dmRoomId, content, userId } = message;
    const dmRoomName = `DMRoom: ${dmRoomId}`;
    socket.to(dmRoomName).emit('receiveMessage', { userId, content });

    // await this.dmService.saveDM(dmRoomId, userId, content);
  }
}
