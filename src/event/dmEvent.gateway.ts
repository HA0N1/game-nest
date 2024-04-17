import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
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
  WsException,
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
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  wsClients = [];

  async handleConnection(@ConnectedSocket() socket: Socket) {
    console.log('dm connected!');

    const socketId = socket.id;
    this.addClient(socketId);
  }

  async findUserByCookie(cookie: string) {
    // const cookie = socket.handshake.headers.cookie; 로 미리 받아와야함

    const token = cookie.split('=')[1];
    const payload = this.jwtService.verify(token, { secret: this.config.get<string>('JWT_SECRET_KEY') });
    const user = await this.userService.findUserByEmail(payload.email);

    return user;
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
  async handleJoinDM(@ConnectedSocket() socket: Socket, @MessageBody() roomData: any) {
    console.log('백엔드: ', roomData);
    const dmRoomName = `DMRoom: ${roomData}`;

    const cookie = socket.handshake.headers.cookie;
    const user = await this.findUserByCookie(cookie);

    this.server.emit('welcome', { user: user });

    socket.join(dmRoomName);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() content: string, @ConnectedSocket() socket: Socket) {
    const cookie = socket.handshake.headers.cookie;
    const user = await this.findUserByCookie(cookie);

    const userId = user.id;

    console.log('sendMessage', content);

    // const dmRoomName = `DMRoom: ${dmRoomId}`;
    // socket.emit('receiveMessage', { userId, content });

    // await this.dmService.saveDM(dmRoomId, userId, content);
  }
}
