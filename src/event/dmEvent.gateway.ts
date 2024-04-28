import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
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

  connectedClients: { [socketId: string]: boolean } = {};
  clientNickname: { [socketId: string]: string } = {};
  roomUsers: { [key: string]: string[] } = {};

  async handleConnection(@ConnectedSocket() socket: Socket) {
    if (this.connectedClients[this.clientNickname.id]) {
      socket.disconnect(true);
      return;
    }

    this.connectedClients[socket.id] = true;

    const cookies = socket.handshake.headers.cookie;

    const user = await this.findUserByCookie(cookies, socket);
    if (user === undefined) {
      socket.emit('userDisconnected');
      socket.disconnect();
      return;
    }

    this.clientNickname[socket.id] = user.nickname;

    console.log('dm connected!');
  }

  async findUserByCookie(cookies: string, socket: Socket) {
    // const cookie = socket.handshake.headers.cookie; 로 미리 받아와야함
    const access = cookies.split(';')[0];

    const token = access.split('=')[1];

    try {
      const payload = this.jwtService.verify(token, { secret: this.config.get<string>('JWT_SECRET_KEY') });
      const user = await this.userService.findUserByEmail(payload.email);

      return user;
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        console.log('catch err');
        socket.emit('userDisconnected');
        socket.disconnect();

        return;
      }
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    delete this.connectedClients[client.id];

    Object.keys(this.roomUsers).forEach(room => {
      const index = this.roomUsers[room]?.indexOf(this.clientNickname[client.id]);

      if (index !== -1) {
        this.roomUsers[room].splice(index, 1);
      }
    });
  }

  @SubscribeMessage('sayBye')
  async leaveDMRoom(@ConnectedSocket() socket: Socket, @MessageBody() dmRoomId: string) {
    if (!socket.rooms.has(dmRoomId)) {
      return;
    }

    socket.leave(dmRoomId);

    const index = this.roomUsers[dmRoomId]?.indexOf(this.clientNickname[socket.id]);
    if (index !== -1) {
      this.roomUsers[dmRoomId].splice(index, 1);
      this.server.to(dmRoomId).emit('bye', { nickname: this.clientNickname[socket.id], dmRoomId });
    }

    this.server.to(dmRoomId).emit('bye', { nickname: this.clientNickname[socket.id], dmRoomId });
  }

  @SubscribeMessage('joinDM')
  async handleJoinDM(@ConnectedSocket() socket: Socket, @MessageBody() dmRoomId: any) {
    if (socket.rooms.has(dmRoomId)) {
      return;
    }
    const cookies = socket.handshake.headers.cookie;

    const user = await this.findUserByCookie(cookies, socket);

    socket.join(dmRoomId);

    if (!this.roomUsers[dmRoomId]) {
      this.roomUsers[dmRoomId] = [];
    }

    this.roomUsers[dmRoomId].push(this.clientNickname[socket.id]);

    this.server.to(dmRoomId).emit('welcome', { nickname: this.clientNickname[socket.id], dmRoomId });
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() data, @ConnectedSocket() socket: Socket) {
    const cookies = socket.handshake.headers.cookie;

    const user = await this.findUserByCookie(cookies, socket);

    const userId = user.id;
    const nickname = user.nickname;
    const content = data.value;
    const dmRoomId = +data.dmRoomId;

    await this.dmService.saveDM(dmRoomId, userId, content);

    socket.join(data.dmRoomId);

    const time = new Date();

    this.server.to(data.dmRoomId).emit('message', { dmRoomId, nickname, content, time });
  }

  @SubscribeMessage('sendImage')
  async handleImage(@MessageBody() data, @ConnectedSocket() socket: Socket) {
    const cookies = socket.handshake.headers.cookie;

    const user = await this.findUserByCookie(cookies, socket);
    const nickname = user.nickname;
    const dmRoomId = +data.dmRoomId;

    const content = data.value;

    console.log('백엔드 sendImage test: ', content);

    socket.join(data.dmRoomId);

    this.server.to(data.dmRoomId).emit('messageWithImage', { dmRoomId, nickname, content });
  }

  @SubscribeMessage('dmRoomList')
  async dmRoomList(socket: Socket) {
    const cookies = socket.handshake.headers.cookie;

    const user = await this.findUserByCookie(cookies, socket);

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

  @SubscribeMessage('userInfo')
  async userInfo(socket: Socket) {
    const cookie = socket.handshake.headers.cookie;

    const user = await this.findUserByCookie(cookie, socket);

    socket.emit('receiveUserInfo', user);
    console.log('유저 정보 전송 완료');
  }
}
