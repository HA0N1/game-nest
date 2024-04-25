import { RtpCodecCapability, TransportListenInfo, WorkerLogTag } from 'mediasoup/node/lib/types';
import os from 'os';

export const config = {
  listenIP: '0.0.0.0',
  listenPort: 3016,
  mediasoup: {
    // 실행중인 워커 수 내 컴은 최대 6개
    numWorkers: Object.keys(os.cpus()).length,
    worker: {
      // * EC2 올릴 때 포트 범위 보안 그룹 열기
      rtcMinPort: 2000,
      rtcMaxPort: 2100,
      logLevel: 'debug',
      logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'] as WorkerLogTag[],
    },
    // 생성된 Transport Instance를 통해 미디어 스트림 삽입, 선택, 전달 가능
    router: {
      mediaCodecs: [
        {
          kind: 'audio', // 미디어 종류
          mimeType: 'audio/opus', // 하위 파일 변환?
          clockRate: 48000, // 코텍 클럭 속도 (hertz)
          channels: 2, // 채널 제한
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
          parameters: {
            'x-google-start-bitrate': 1000,
          },
        },
      ] as RtpCodecCapability[], // RTP 코덱 능력
    },
    //websocket transport settings
    WebRtcTransport: {
      listenIps: [
        {
          ip: '127.0.0.1',
          announcedIp: null,
        },
      ], // 동일한 호스트에 있는 두 라우터 연결을 위한 정보 수신
      maxIncomingBitrate: 1500000,
      initialAvailableOutgoingBitrate: 1000000,
    },
  },
  // stun: {
  //   hostname: 'stun:stun.l.google.com',
  //   port: 19302,
  // },
} as const;
