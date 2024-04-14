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
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';

@WebSocketGateway({ cors: 'localhost:3000', namespace: 'direct_message' })
export class DMGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly dmService: DMService,
    private readonly userService: UserService,
    @InjectRepository(FriendDMs)
    private friendDMRepo: Repository<FriendDMs>,
  ) {}

  // connectedClients: { [socketId: string]: boolean } = {};
  // clientNickname: { [socketId: string]: string } = {};
  // roomUsers: { [key: string]: string[] } = {};

  // wsClients = [];

  @SubscribeMessage('joinDM')
  handleJoinDM(socket: Socket, data) {
    const { dmRoomId } = data;
    const dmRoomName = `DMRoom: ${dmRoomId}`;
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

    await this.dmService.saveDM(dmRoomId, content, userId);
  }
  // TODO: mongoDB 연결하기
}
