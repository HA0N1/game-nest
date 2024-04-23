// event.gateway.ts
import { InjectRedis } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import {
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import Redis from 'ioredis';
import { Server, Socket } from 'socket.io';
import { ChannelService } from 'src/channel/channel.service';
import { ChannelDMs } from 'src/channel/entities/channelDMs.entity';
import { ChatType } from 'src/channel/type/channel-chat.type';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import * as mediasoup from 'mediasoup';
import { config } from 'media-soup/config';
import { Router } from 'mediasoup/node/lib/types';

/**
 * 게이트 웨이 설정
 * WebSocketGateway() : 기본 포트 3000
 * WebSocketGateway(port) : 원하는 포트 사용
 * WebSocketGateway(options) : 기본 3000 + 원하는 옵션
 * WebSocketGateway(port, options) : 원하는 포트 + 원하는 옵션
 *
 * 웹소켓 서버 인스턴스 접근
 * WebSocketServer()
 */
let worker;
let router;
let producerTransport;
let consumerTransport;
let producer;
let consumer;
const mediaCodecs = config.mediasoup.router.mediaCodecs;
interface CreateRoomData {
  room: string;
  createChatDto: {
    title: string;
    chatType: ChatType;
    maximumPeople: number;
    channelId: number;
  };
}

interface JoinRoomData {
  room: string;
}

interface ChatMessageData {
  message: string;
  room: string;
}

interface ScreenSharingData {
  room: string;
  stream: MediaStream;
}
@WebSocketGateway({ namespace: 'chat' })
export class RoomGateway implements OnGatewayConnection {
  constructor(
    private readonly channelService: ChannelService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,

    @InjectRepository(ChannelDMs)
    private DMsRepo: Repository<ChannelDMs>,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  rooms = [];
  @WebSocketServer() server: Server;

  nextMediasoupWorkerIdx = 0;

  async handleConnection(socket: Socket & { user: User }, data: any) {
    console.log(`connect: ${socket.id}`);
    const cookie = socket.handshake.headers.cookie;

    if (!cookie) {
      throw new WsException('토큰이 없습니다.');
    }
    try {
      const token = cookie.split('=')[1];
      const payload = this.jwtService.verify(token, { secret: this.configService.get<string>('JWT_SECRET_KEY') });
      const user = await this.userService.findUserByEmail(payload.email);

      socket.user = user;
      const userId = socket.user.id;
      await this.redis.set(`socketId:${socket.id}`, +userId);
      // TODO: 브라우저에서 서버 연결 시 채널멤버 추가 해야 함
      // await this.channelService.createMember(userId, channelId);
      return true;
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('createRoom')
  async handleMessage(socket: Socket & { user: User }, data: CreateRoomData) {
    const { room, createChatDto } = data;
    const { title, chatType, channelId, maximumPeople } = createChatDto;
    try {
      const chat = await this.channelService.findOneChat(room);
      console.log('RoomGateway ~ handleMessage ~ chat:', chat);
      if (chat) throw new WsException('채팅방 이름이 중복되었습니다.');
      // 채널 서비스의 createChat 함수 호출
      await this.channelService.createChat(channelId, { title: room, chatType, maximumPeople });
      const rooms = await this.channelService.findAllChat();
      // rooms.map(room => {
      //   if (room.chatType === 'talk') {
      //     this.server.emit('chatRooms', room);
      //   } else if (room.chatType === 'voice') {
      //     this.server.emit('voiceRooms', room);
      //   }
      // });
      this.server.emit('rooms', rooms);
    } catch (error) {
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('requestRooms')
  async handleRequestRooms(socket: Socket) {
    try {
      const rooms = await this.channelService.findAllChat();

      this.server.emit('rooms', rooms);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    }
  }

  @SubscribeMessage('requestChatHistory')
  async handleRequestChatHistory(socket: Socket, data: any): Promise<void> {
    const { room } = data;

    try {
      // 채널 정보 조회
      const channelRoom = await this.channelService.findOneChat(room);
      const channelChatId = channelRoom.id;

      // 해당 채널의 채팅 내역 조회
      const dms = await this.DMsRepo.createQueryBuilder('dm')
        .leftJoinAndSelect('dm.user', 'user')
        .where('dm.channelChatId = :channelChatId', { channelChatId })
        .getMany();

      // 발신자 닉네임과 함께 클라이언트에 전송
      const dmsWithNickname = dms.map(dm => ({
        ...dm,
        senderNickname: dm.user.nickname,
      }));

      // 클라이언트에게 채팅 내역 전송
      socket.emit('dmHistory', dmsWithNickname);
    } catch (error) {
      // 에러 처리
      console.error('Error fetching chat history:', error);
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(socket: Socket & { user: User }, data: any) {
    const { room } = data;

    // 방에 입장하는 사용자의 정보 가져오기
    const senderId = +(await this.redis.get(`socketId:${socket.id}`));
    const foundUser = await this.userService.findUserById(+senderId);
    const nickname = foundUser.nickname;

    // 사용자에게 입장 알림 보내기
    this.server.emit('notice', { message: `${nickname} joined ${room} room` });
    // 방에 입장
    socket.join(room);
    // 채팅 타입 가져오기
    const channelRoom = await this.channelService.findOneChat(room);
    const chatType = channelRoom.chatType;

    //! 2. server : worker가 router 생성, 서버가 클라이언트에 rtpCapabilities 전달
    // chatType이 voice인 경우에만 Worker와 Router 생성
    // if (chatType === 'voice') {
    //   worker = await this.createWorker();
    //   router = await worker.createRouter({ mediaCodecs });
    //   // RTP Capabilities 가져오기
    //   const rtpCapabilities = router.rtpCapabilities;
    //   // 클라이언트에게 RTP Capabilities 전달
    //   this.server.emit('getRtpCapabilities', rtpCapabilities);
    // }
  }
  @SubscribeMessage('joinVoiceRoom')
  async handleJoinVoiceRoom(socket: Socket & { user: User }, data: any) {
    const { room } = data;
    socket.join(room);

    //! 2. server : worker가 router 생성, 서버가 클라이언트에 rtpCapabilities 전달
    // chatType이 voice인 경우에만 Worker와 Router 생성

    worker = await this.createWorker();
    router = await worker.createRouter({ mediaCodecs });
    // RTP Capabilities 가져오기
    const rtpCapabilities = router.rtpCapabilities;
    // 클라이언트에게 RTP Capabilities 전달
    this.server.emit('getRtpCapabilities', rtpCapabilities);
  }
  //! 5. server :⭐RP (router producer)생성, 생성한 tranport 정보 client에 반환
  @SubscribeMessage('createWebRtcTransport')
  async handleCreateTransport(@MessageBody() data) {
    const { consumer } = data;

    try {
      let transport;
      if (consumer) {
        transport = await this.createWebRtcTransport();
        console.log('RoomGateway ~ handleCreateTransport ~ producerTransport:', transport);
      } else {
        transport = await this.createWebRtcTransport();
        console.log('RoomGateway ~ handleCreateTransport ~ consumerTransport:', transport);
      }

      if (transport) {
        this.server.emit('createWebRtcTransport', {
          consumer,
          params: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
          },
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  async createWebRtcTransport() {
    try {
      const webRtcTransport_options = {
        listenIps: [
          {
            ip: '0.0.0.0', // replace with relevant IP address
            announcedIp: '127.0.0.1',
          },
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      };

      let transport = await router.createWebRtcTransport(webRtcTransport_options);
      console.log(`transport id: ${transport.id}`);

      transport.on('dtlsstatechange', dtlsState => {
        if (dtlsState === 'closed') {
          transport.close();
        }
      });

      transport.on('close', () => {
        console.log('transport closed');
      });

      return transport;
    } catch (error) {
      console.error(error);
    }
  }
  // async handleCreateTransport(@MessageBody() data) {
  //   const { consumer } = data;

  //   try {
  //     // const initialAvailableOutgoingBitrate = config.mediasoup.WebRtcTransport.initialAvailableOutgoingBitrate;
  //     if (consumer) {
  //       producerTransport = await this.createWebRtcTransport(callback);
  //       console.log('RoomGateway ~ handleCreateTransport ~ producerTransport:', producerTransport);

  //       this.server.emit('createWebRtcTransport', {
  //         params: {
  //           id: producerTransport.id,
  //           iceParameters: producerTransport.iceParameters,
  //           iceCandidates: producerTransport.iceCandidates,
  //           dtlsParameters: producerTransport.dtlsParameters,
  //         },
  //       });
  //       console.log('잇다');
  //     } else {
  //       consumerTransport = await this.createWebRtcTransport(callback);
  //       console.log('RoomGateway ~ handleCreateTransport ~ consumerTransport:', consumerTransport);
  //       console.log('업당');
  //       this.server.emit('createWebRtcTransport', {
  //         params: {
  //           id: consumerTransport.id,
  //           iceParameters: consumerTransport.iceParameters,
  //           iceCandidates: consumerTransport.iceCandidates,
  //           dtlsParameters: consumerTransport.dtlsParameters,
  //         },
  //       });
  //     }
  //   } catch (error) {}
  // }
  // async createWebRtcTransport(callback) {
  //   try {
  //     // https://mediasoup.org/documentation/v3/mediasoup/api/#WebRtcTransportOptions
  //     const webRtcTransport_options = {
  //       listenIps: [
  //         {
  //           ip: '0.0.0.0', // replace with relevant IP address
  //           announcedIp: '127.0.0.1',
  //         },
  //       ],
  //       enableUdp: true,
  //       enableTcp: true,
  //       preferUdp: true,
  //     };

  //     // https://mediasoup.org/documentation/v3/mediasoup/api/#router-createWebRtcTransport
  //     let transport = await router.createWebRtcTransport(webRtcTransport_options);
  //     console.log(`transport id: ${transport.id}`);

  //     transport.on('dtlsstatechange', dtlsState => {
  //       if (dtlsState === 'closed') {
  //         transport.close();
  //       }
  //     });

  //     transport.on('close', () => {
  //       console.log('transport closed');
  //     });
  //     return {
  //       params: {
  //         id: transport.id,
  //         iceParameters: transport.iceParameters,
  //         iceCandidates: transport.iceCandidates,
  //         dtlsParameters: transport.dtlsParameters,
  //       },
  //     };
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }
  @SubscribeMessage('transport-connect')
  async transportConnect(@MessageBody() { dtlsParameters }) {
    // console.log('DTLS PARAMS...:', dtlsParameters);
    // console.log('RoomGateway ~ transportConnect ~ dtlsParameters:', dtlsParameters);
    await producerTransport.connect({ dtlsParameters });
  }

  @SubscribeMessage('transport-produce')
  async transportProduce(@MessageBody() { kind, rtpParameters, appData }) {
    // const { kind, rtpParameters, appData } = data;

    producer = await producerTransport.produce({
      kind,
      rtpParameters,
    });

    console.log('Producer ID: ', producer.id, producer.kind);

    producer.on('transportclose', () => {
      console.log('transport for this producer closed ');
      producer.close();
    });

    this.server.emit('transport-produce', { id: producer.id });
  }
  async createWorker() {
    worker = await mediasoup.createWorker({
      logLevel: config.mediasoup.worker.logLevel,
      logTags: config.mediasoup.worker.logTags,
      rtcMinPort: config.mediasoup.worker.rtcMinPort,
      rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
    });
    console.log(`worker pid ${worker.pid}`);

    worker.on('died', error => {
      // This implies something serious happened, so kill the application
      console.error('mediasoup worker has died');
      setTimeout(() => process.exit(1), 2000); // exit in 2 seconds
    });

    return worker;
  }

  @SubscribeMessage('chatType')
  async handleChatType(socket: Socket, data: any) {
    const { room } = data;
    const channelRoom = await this.channelService.findOneChat(room);
    const chatType = channelRoom.chatType;

    this.server.emit('chatType', chatType);
  }

  @SubscribeMessage('message')
  async handleMessageToRoom(socket: Socket & { user: User }, data: ChatMessageData): Promise<void> {
    const { message, room } = data;
    console.log(data);

    const userId = socket.user.id;

    const channelRoom = await this.channelService.findOneChat(room);
    const foundUser = await this.userService.findUserById(+userId);
    const nickname = foundUser.nickname;

    // 메시지 저장
    const dm = this.DMsRepo.create({
      content: message,
      senderId: socket.user.id,
      channelChatId: +channelRoom.id,
    });
    await this.DMsRepo.save(dm);
    socket.broadcast.to(room).emit('message', { message: `${nickname}: ${message}` });
  }
}
