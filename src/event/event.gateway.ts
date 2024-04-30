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
import { ChannelMember } from 'src/channel/entities/channelMember.entity';

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
let producerTransport: {
  id: any;
  iceParameters: any;
  iceCandidates: any;
  dtlsParameters: any;
  connect: (arg0: { dtlsParameters: any }) => any;
  produce: (arg0: { kind: any; rtpParameters: any }) => any;
};
let consumerTransport: {
  id: any;
  iceParameters: any;
  iceCandidates: any;
  dtlsParameters: any;
  connect: (arg0: { dtlsParameters: any }) => any;
  consume: (arg0: { producerId: any; rtpCapabilities: any; paused: boolean }) => any;
};
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

let channelId;
@WebSocketGateway({ namespace: 'chat' })
export class RoomGateway implements OnGatewayConnection {
  constructor(
    private readonly channelService: ChannelService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,

    @InjectRepository(ChannelDMs)
    private DMsRepo: Repository<ChannelDMs>,
    @InjectRepository(ChannelMember)
    private MemberRepo: Repository<ChannelMember>,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  rooms = [];

  @WebSocketServer() server: Server;
  nextMediasoupWorkerIdx = 0;

  async handleConnection(socket: Socket & { user: User }, data: any) {
    console.log(`connect: ${socket.id}`);
    const cookie = socket.handshake.headers.cookie;
    const cookieParts = cookie.split(';');
    const authorizationCookie = cookieParts[0].trim().split('=');
    if (!cookie) {
      throw new WsException('토큰이 없습니다.');
    }
    try {
      const token = authorizationCookie[1];
      const payload = this.jwtService.verify(token, { secret: this.configService.get<string>('JWT_SECRET_KEY') });
      const user = await this.userService.findUserByEmail(payload.email);
      socket.user = user;
      const userId = socket.user.id;
      await this.redis.set(`socketId:${socket.id}`, +userId);
      const refererUrl = socket.handshake.headers.referer;
      const url = new URL(refererUrl);
      const path = url.pathname;
      const parts = path.split('/');
      channelId = +parts[2];
      const existingMember = await this.MemberRepo.findOne({ where: { userId } });
      if (!existingMember) {
        await this.channelService.createMember(userId, channelId);
      }
      console.log(channelId);
      return true;
    } catch (error) {
      console.log('에러');
      throw new WsException(error.message);
    }
  }
  // server 연결 시 worker 생성

  async createWorker() {
    worker = await mediasoup.createWorker({
      logLevel: config.mediasoup.worker.logLevel,
      logTags: config.mediasoup.worker.logTags,
      rtcMinPort: config.mediasoup.worker.rtcMinPort,
      rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
    });
    console.log(`worker pid ${worker.pid}`);

    worker.on('died', error => {
      console.error('mediasoup worker has died');
      setTimeout(() => process.exit(1), 2000); // exit in 2 seconds
    });

    return worker;
  }
  // on // 수신
  // emit // 발신
  @SubscribeMessage('createRoom')
  async handleMessage(socket: Socket & { user: User }, data) {
    const { room, createChatDto } = data;
    console.log('RoomGateway ~ handleMessage ~ data:', data);

    const { title, chatType, maximumPeople } = createChatDto;
    try {
      const chat = await this.channelService.findOneChat(room);
      console.log('RoomGateway ~ handleMessage ~ chat:', chat);
      if (chat) throw new WsException('채팅방 이름이 중복되었습니다.');
      // 채널 서비스의 createChat 함수 호출
      await this.channelService.createChat(channelId, { title: room, chatType, maximumPeople });
      const rooms = await this.channelService.findAllChat(channelId);

      this.server.emit('rooms', rooms);
    } catch (error) {
      throw new WsException(error.message);
    }
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

    socket.broadcast.to(room).emit(`message`, { message: `${nickname}: ${message}` });
  }

  @SubscribeMessage('requestRooms')
  async handleRequestRooms(socket: Socket) {
    try {
      const refererUrl = socket.handshake.headers.referer;
      const url = new URL(refererUrl);
      const path = url.pathname;
      const parts = path.split('/');
      const channelId = +parts[2];
      const rooms = await this.channelService.findAllChat(channelId);

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
    this.server.to(room).emit('getRtpCapabilities', rtpCapabilities);
  }

  //! 5. server :⭐RP (router producer)생성, 생성한 tranport 정보 client에 반환
  @SubscribeMessage('createWebRtcTransport')
  async handleCreateTransport(@MessageBody() data) {
    const { consumer } = data;
    console.log('RoomGateway ~ handleCreateTransport ~ consumer:', consumer);

    try {
      if (!consumer) {
        producerTransport = await this.createWebRtcTransport();
        this.server.emit('createWebRtcTransport1', {
          consumer,
          params: {
            id: producerTransport.id,
            iceParameters: producerTransport.iceParameters,
            iceCandidates: producerTransport.iceCandidates,
            dtlsParameters: producerTransport.dtlsParameters,
          },
        });
        console.log('producer로써');
      } else {
        consumerTransport = await this.createWebRtcTransport();
        //! 잘만들어짐
        this.server.emit('createWebRtcTransport2', {
          consumer,
          params: {
            id: consumerTransport.id,
            iceParameters: consumerTransport.iceParameters,
            iceCandidates: consumerTransport.iceCandidates,
            dtlsParameters: consumerTransport.dtlsParameters,
          },
        });
        console.log('consumer로써');
      }
    } catch (error) {
      console.error(error);
    }
  }

  async createWebRtcTransport() {
    try {
      const webRtcTransport_options = {
        listenInfos: [
          {
            protocol: 'udp',
            ip: '0.0.0.0',
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
      console.log(error);
    }
  }

  @SubscribeMessage('transport-connect')
  async transportConnect(@MessageBody() data): Promise<void> {
    const { dtlsParameters } = data;

    try {
      await producerTransport.connect({ dtlsParameters });
      console.log('producer 연결 성공');
      this.server.emit('transport-connect', { dtlsParameters });
    } catch (error) {
      console.log('producer 연결 실패:', error);
    }
  }

  @SubscribeMessage('transport-produce')
  async transportProduce(@MessageBody() { kind, rtpParameters, appData, dtlsParameters }): Promise<void> {
    try {
      producer = await producerTransport.produce({
        kind,
        rtpParameters,
      });

      producer.on('transportclose', () => {
        console.log('transport for this producer closed ');
        producer.close();
      });

      this.server.emit('transport-produce', { id: producer.id });
    } catch (error) {
      console.log('produce 중 error', error.message);
    }
  }

  @SubscribeMessage('transport-recv-connect')
  async transportConsumer(@MessageBody() data): Promise<void> {
    const { dtlsParameters } = data;
    try {
      await consumerTransport.connect({ dtlsParameters });
      console.log('consumer연결 성공');
      this.server.emit('transport-recv-connect', { dtlsParameters });
    } catch (error) {
      console.log('consumer연결 실패', error);
    }
  }

  @SubscribeMessage('consume')
  async consume(socket: Socket & { user: User }, data: any): Promise<void> {
    const { rtpCapabilities, producerId } = data;
    try {
      if (router.canConsume({ producerId, rtpCapabilities })) {
        consumer = await consumerTransport.consume({
          producerId,
          rtpCapabilities,
          paused: true,
        });
        consumer.on('transportclose', () => {
          console.log('transport close from consumer');
        });

        consumer.on('producerclose', () => {
          console.log('producer of consumer closed');
        });

        const params = {
          id: consumer.id,
          producerId: producer.id,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        };

        this.server.emit('consume', { params });
      }
    } catch (error) {
      console.log('consume 중 error', error);
    }
  }

  @SubscribeMessage('consumer-resume')
  async consumerResume(socket: Socket & { user: User }): Promise<void> {
    try {
      console.log('consumer resume');
      consumer.resume();
    } catch (error) {
      console.error('Error resuming consumer:', error);
    }
  }

  //! 화면 공유
  async handleBroadcastScreenSharing(socket: Socket, data: any): Promise<void> {
    const { room, stream } = data;
    console.log('RoomGateway ~ handleBroadcastScreenSharing ~ room:', room);
    console.log('RoomGateway ~ handleBroadcastScreenSharing ~ stream:', stream);

    socket.to(room).emit('screenSharingStream', { stream });
  }
}
