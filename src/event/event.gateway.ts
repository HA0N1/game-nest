// event.gateway.ts
import { InjectRedis } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
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
let worker: mediasoup.types.Worker<mediasoup.types.AppData>;

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
let rooms = {}; // { roomName1: { Router, rooms: [ sicketId1, ... ] }, ...}
let peers = {}; // { socketId1: { roomName1, socket, transports = [id1, id2,] }, producers = [id1, id2,] }, consumers = [id1, id2,], peerDetails }, ...}
let transports = []; // [ { socketId1, roomName1, transport, consumer }, ... ]
let producers = []; // [ { socketId1, roomName1, producer, }, ... ]
let consumers = []; // [ { socketId1, roomName1, consumer, }, ... ]
let socketConnect = {}; //socket 아이디가 key, value는 Bool
let socketAudioProduce: SocketAudioProduce = {}; // socket 아이디가 key, value는 Bool
let socketVideoProduce: SocketVideoProduce = {}; // socket 아이디가 key, value는 Bool
interface SocketAudioProduce {
  id?: boolean;
}
interface SocketVideoProduce {
  id?: boolean;
}
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
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
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
    console.log(`connect!!!!!!!!!!!!!!!!!!!!!!!: ${socket.id}`);
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

      const foundUser = await this.userService.findUserById(+userId);
      const nickname1 = foundUser.nickname;

      const existingMember = await this.MemberRepo.findOne({ where: { userId } });
      if (!existingMember) {
        await this.channelService.createMember(userId, channelId);
      }
      console.log(channelId);
      worker = await this.createWorker();

      socket.emit('connection-success', {
        socketId1: socket.id,
        nickname1,
      });
      return true;
    } catch (error) {
      console.log('에러');
      throw new WsException(error.message);
    }
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    const removeItems = (items, socketId, type) => {
      items.forEach(item => {
        if (item.socketId === socket.id) {
          item[type].close();
        }
      });
      items = items.filter(item => item.socketId !== socket.id);

      return items;
    };

    console.log('peer disconnected');
    consumers = removeItems(consumers, socket.id, 'consumer');
    producers = removeItems(producers, socket.id, 'producer');
    transports = removeItems(transports, socket.id, 'transport');

    try {
      const { room } = peers[socket.id];
      delete peers[socket.id];

      //rooms에서 해당 소켓 정보 삭제
      rooms[room] = {
        router: rooms[room].router,
        peers: rooms[room].peers.filter(socketId => socketId !== socket.id),
      };
      console.log('RoomGateway ~ handleDisconnect ~ peers:', peers);
      console.log('RoomGateway ~ handleDisconnect ~ rooms:', rooms);
    } catch (e) {}
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

    console.log('RoomGateway ~ handleChatType ~ chatType:', chatType);
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
      console.log('RoomGateway ~ handleRequestRooms ~ channelId:', channelId);
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
    const { room, nickname } = data;

    //! 2. server : worker가 router 생성, 서버가 클라이언트에 rtpCapabilities 전달
    // chatType이 voice인 경우에만 Worker와 Router 생성
    const router1 = await this.createRoom(room, socket.id);
    peers[socket.id] = {
      socket,
      room,
      transports: [],
      producers: [],
      consumers: [],
      peerDetails: {
        name: nickname,
      },
    };
    console.log(`${nickname} just joined the Room `);
    // router = await worker.createRouter({ mediaCodecs });
    // RTP Capabilities 가져오기
    const rtpCapabilities = router1.rtpCapabilities;
    // 클라이언트에게 RTP Capabilities 전달
    this.server.emit('getRtpCapabilities', rtpCapabilities);
  }

  createRoom = async (room, socketId) => {
    console.log('RoomGateway ~ createRoom= ~ socketId:', socketId);
    let router1;
    let peers = [];
    if (rooms[room]) {
      router1 = rooms[room].router;
      peers = rooms[room].peers || [];
    } else {
      router1 = await worker.createRouter({ mediaCodecs });
    }

    // console.log(`Router ID: ${router1.id}`, peers.length)

    rooms[room] = {
      router: router1,
      peers: [...peers, socketId],
    };

    return router1;
  };
  //! 5. server :⭐RP (router producer)생성, 생성한 tranport 정보 client에 반환
  @SubscribeMessage('createWebRtcTransport')
  async handleCreateTransport(@ConnectedSocket() socket: Socket, @MessageBody() data) {
    const { consumer } = data;
    console.log('createWebRtcTransport 도착');
    try {
      const room = await peers[socket.id].room;
      const router = await rooms[room].router;
      const [verify] = transports.filter(transport => transport.socketId === socket.id && !transport.consumer);
      if (!consumer) {
        producerTransport = await this.createWebRtcTransport(router);
        this.server.emit('createWebRtcTransport1', {
          consumer,
          params: {
            id: producerTransport.id,
            iceParameters: producerTransport.iceParameters,
            iceCandidates: producerTransport.iceCandidates,
            dtlsParameters: producerTransport.dtlsParameters,
          },
        });
        await this.addTransport(socket, producerTransport, room, consumer);
        console.log('producer로써');
      } else {
        consumerTransport = await this.createWebRtcTransport(router);
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
        console.log('여기 몇번2?');
        await this.addTransport(socket, consumerTransport, room, consumer);
        console.log('consumer로써');
      }
    } catch (error) {
      console.error(error);
    }
  }
  async addTransport(socket, transport, room, consumer) {
    transports = [...transports, { socketId: socket.id, transport, room, consumer }];

    peers[socket.id] = {
      ...peers[socket.id],
      transports: [...peers[socket.id].transports, transport.id],
    };
    //! transports,peers 생성 잘됨
  }

  @SubscribeMessage('getProducers')
  async handleGetProducers(@ConnectedSocket() socket: Socket): Promise<void> {
    const room = peers[socket.id]?.room;
    if (!room) {
      console.error(`No room found for socket ID ${socket.id}`);
      socket.emit('error', 'No associated room found.');
      return;
    }

    console.log(`Fetching producers for room: ${room}`);
    let producerList = [];

    producers.forEach(producerData => {
      // Ensure that we are not sending back the producer of the requesting socket
      if (producerData.socketId !== socket.id && producerData.room === room) {
        producerList.push({
          producerId: producerData.producer.id,
          nickname: peers[producerData.socketId].peerDetails.name,
          socketId: producerData.socketId,
        });
      }
    });

    console.log(`Producer list for room ${room}:`, producerList);

    // Only emit to the requesting client to maintain data privacy
    socket.emit('getProducers', { producerList });
  }

  @SubscribeMessage('transport-connect')
  async transportConnect(@MessageBody() data, @ConnectedSocket() socket: Socket): Promise<void> {
    console.log('오냐');
    const { dtlsParameters } = data;

    const producerTransport = await this.getTransport(socket.id); // Get the transport for this socket ID
    //!잘댐
    if (
      producerTransport &&
      producerTransport.dtlsState !== 'connected' &&
      producerTransport.dtlsState !== 'connecting'
    ) {
      try {
        await producerTransport.connect({ dtlsParameters });
        console.log('producer 연결 성공');
        this.server.emit('transport-connect', { dtlsParameters }); // Notify other clients on successful connection
      } catch (error) {
        console.log('producer 연결 실패:', error);
      }
    } else if (producerTransport) {
      console.log('producer는 이미 연결 중 또는 연결되어 있습니다:', producerTransport.dtlsState);
    } else {
      console.log('No valid producer transport found for socket ID:', socket.id);
    }
  }

  async getTransport(socketId) {
    console.log('getTransport socketId ===  transports socketId', socketId);

    const [producerTransport] = transports.filter(transport => transport.socketId === socketId && !transport.consumer);
    try {
      return producerTransport.transport;
    } catch (e) {
      console.log(`getTransport 도중 에러 발생. details: ${e}`);
    }
  }
  // @SubscribeMessage('transport-produce')
  // async transportProduce(
  //   @ConnectedSocket() socket: Socket,
  //   @MessageBody() { kind, rtpParameters, appData, dtlsParameters },
  // ): Promise<void> {
  //   console.log('transport-produce 도착');
  //   try {
  //     if ((kind == 'audio' && !socketAudioProduce.id) || (kind == 'video' && !socketVideoProduce.id)) {
  //       producer = await this.getTransport(socket.id).produce({
  //         kind,
  //         rtpParameters,
  //       });

  //       if (kind == 'audio') {
  //         socketAudioProduce.id = true;
  //       }
  //       if (kind == 'video') {
  //         socketVideoProduce.id = true;
  //       }
  //       console.log('Producer ID: ', producer.id, producer.kind);

  //       const { room } = await peers[socket.id];

  //       await this.addProducer(socket, producer, room);

  //       await this.informConsumers(room, socket.id, producer.id);
  //       console.log('이상없음');
  //       producer.on('transportclose', () => {
  //         console.log('transport for this producer closed ');
  //         producer.close();
  //       });
  //     }
  //     console.log('RoomGateway ~ socket.id:', socket.id);

  //     this.server.emit('transport-produce', { id: producer.id, producersExist: producers.length > 1 ? true : false });
  //   } catch (error) {
  //     console.log('produce 중 error', error.message);
  //   }
  // }
  @SubscribeMessage('transport-produce')
  async transportProduce(
    @ConnectedSocket() socket: Socket,
    @MessageBody() { kind, rtpParameters, appData, dtlsParameters },
  ): Promise<void> {
    console.log('transport-produce arrived');
    try {
      // Correctly awaiting the getTransport call
      let transport = await this.getTransport(socket.id);
      if (!transport) {
        console.log('No transport available for this socket');
        return;
      }

      // Now you can safely call produce on the transport object
      if (
        (kind === 'audio' && !socketAudioProduce[socket.id]) ||
        (kind === 'video' && !socketVideoProduce[socket.id])
      ) {
        let producer = await transport.produce({
          kind,
          rtpParameters,
        });

        if (kind === 'audio') {
          socketAudioProduce[socket.id] = true; // Correctly index by socket.id
        } else if (kind === 'video') {
          socketVideoProduce[socket.id] = true; // Correctly index by socket.id
        }

        console.log('Producer ID: ', producer.id, producer.kind);

        const { room } = peers[socket.id];
        await this.addProducer(socket, producer, room);
        await this.informConsumers(room, socket.id, producer.id);
        console.log('No issues');

        producer.on('transportclose', () => {
          console.log('transport for this producer closed');
          producer.close();
        });

        // Inform clients about the producer
        this.server.emit('transport-produce', { id: producer.id, producersExist: producers.length > 1 });
      } else {
        console.log(`Producer for ${kind} already exists.`);
      }
    } catch (error) {
      console.log('Error during production:', error.message);
    }
  }

  async addProducer(socket, producer, room) {
    producers = [...producers, { socketId: socket.id, producer, room, name: socket.nsp.name, kind: producer.kind }];
    peers[socket.id] = await {
      ...peers[socket.id],
      producers: [...peers[socket.id].producers, producer.id],
    };
    console.log(`Added producer: ${producer.id} in room: ${room}`);
  }

  async informConsumers(room, socketId, id) {
    //! 일단 작동 안하는게 맞음
    producers.forEach(producerData => {
      if (producerData.socketId !== socketId && producerData.room === room) {
        const producerSocket = peers[producerData.socketId].socket;
        // use socket to send producer id to producer
        const socketName = peers[socketId].peerDetails.name;
        console.log('RoomGateway ~ informConsumers ~ socketName:', socketName);

        console.log(`new-producer emit! socketName: ${socketName}, producerId: ${id}, kind : ${producerData.kind}`);
        producerSocket.emit('new-producer', {
          producerId: id,
          socketName: socketName,
          socketId: socketId,
        });
      }
    });
  }

  async createWebRtcTransport(router) {
    try {
      const webRtcTransport_options = {
        listenInfos: [
          {
            protocol: 'udp',
            ip: this.configService.get<string>('LISTEN_IP'), //사설
            announcedIp: this.configService.get<string>('ANNOUNCED_IP'), //공인
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

  @SubscribeMessage('transport-recv-connect')
  async transportConsumer(@MessageBody() data): Promise<void> {
    const { dtlsParameters, serverConsumerTransportId } = data;
    const consumerTransport = transports.find(
      transportData => transportData.consumer && transportData.transport.id == serverConsumerTransportId,
    ).transport;
    console.log('consumerTransport의 dtlsState 확인 🌼🌼🌼', consumerTransport.dtlsState);
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
    const { rtpCapabilities, remoteProducerId, serverConsumerTransportId } = data;
    try {
      const { room } = peers[socket.id];
      const nickname = peers[socket.id].peerDetails.name;
      const router = rooms[room].router;

      let consumerTransport = transports.find(
        transportData => transportData.consumer && transportData.transport.id == serverConsumerTransportId,
      ).transport;

      if (router.canConsume({ remoteProducerId, rtpCapabilities })) {
        consumer = await consumerTransport.consume({
          producerId: remoteProducerId,
          rtpCapabilities,
          paused: true,
        });

        consumer.on('transportclose', () => {
          console.log('transport close from consumer');
        });

        consumer.on('producerclose', () => {
          console.log('producer of consumer closed');
          socket.emit('producer-closed', { remoteProducerId });

          consumerTransport.close([]);
          transports = transports.filter(transportData => transportData.transport.id !== consumerTransport.id);
          consumer.close();
          consumers = consumers.filter(consumerData => consumerData.consumer.id !== consumer.id);
        });
        await this.addConsumer(consumer, room);
        const params = {
          id: consumer.id,
          producerId: remoteProducerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
          serverConsumerId: consumer.id,
          nickname: nickname,
        };

        this.server.emit('consume', { params });
      }
    } catch (error) {
      console.log('consume 중 error', error);
    }
  }
  async addConsumer(consumer, room) {
    consumers = [...consumers, { socketId: socket.id, consumer, room }];

    peers[socket.id] = {
      ...peers[socket.id],
      consumers: [...peers[socket.id].consumers, consumer.id],
    };
  }

  @SubscribeMessage('consumer-resume')
  async consumerResume(socket: Socket & { user: User }, data): Promise<void> {
    console.log('RoomGateway ~ consumerResume ~ data:', data);
    const { serverConsumerId } = data;
    try {
      console.log('consumer resume');
      const { consumer } = consumers.find(consumerData => consumerData.consumer.id === serverConsumerId);

      await consumer.resume();
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
