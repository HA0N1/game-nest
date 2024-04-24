import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
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
import { UserInfo } from 'src/utils/decorators/userInfo';
import { Repository } from 'typeorm';
import axios from 'axios';

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

  @SubscribeMessage('sayBye')
  async leaveDMRoom(@ConnectedSocket() socket: Socket, @MessageBody() dmRoomId: string) {
    const cookie = socket.handshake.headers.cookie;
    const user = await this.findUserByCookie(cookie);
    console.log(dmRoomId);

    socket.join(dmRoomId);

    this.server.to(dmRoomId).emit('bye', { user: user, dmRoomId });
  }

  @SubscribeMessage('joinDM')
  async handleJoinDM(@ConnectedSocket() socket: Socket, @MessageBody() dmRoomId: any) {
    const cookie = socket.handshake.headers.cookie;
    const user = await this.findUserByCookie(cookie);

    const chats = await this.dmService.textHistory(+dmRoomId);

    socket.join(dmRoomId);

    this.server.to(dmRoomId).emit('welcome', { user: user, dmRoomId });
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() data, @ConnectedSocket() socket: Socket) {
    const cookie = socket.handshake.headers.cookie;
    const user = await this.findUserByCookie(cookie);

    const userId = user.id;
    const nickname = user.nickname;
    const content = data.value;
    const dmRoomId = +data.dmRoomId;
    console.log('!!!!!!!!!!!!!!');
    console.log(dmRoomId, userId, content);

    await this.dmService.saveDM(dmRoomId, userId, content);

    socket.join(data.dmRoomId);
    console.log('socket 백엔드: ', data.dmRoomId);

    const time = new Date();

    this.server.to(data.dmRoomId).emit('message', { dmRoomId, nickname, content, time });
  }

  @SubscribeMessage('dmRoomList')
  async dmRoomList(socket: Socket) {
    const cookie = socket.handshake.headers.cookie;
    const user = await this.findUserByCookie(cookie);
    const userId = user.id;

    const dmRooms = await this.dmService.getDMRooms(user.id);

    const promiseDmRoomIds = dmRooms.map(async e => {
      const id = e.dmRoom_id;
      const nickname1 = e.fr_nickname;
      const nickname2 = e.us_nickname;
      const userNickname = user.nickname;

      if (userNickname === nickname1) {
        return { id, nickname: nickname2 };
      } else if (userNickname === nickname2) {
        return { id, nickname: nickname1 };
      }
    });

    const dmRoomIds = await Promise.all(promiseDmRoomIds);

    socket.emit('rooms', dmRoomIds);
  }
}
