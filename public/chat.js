const mediasoupClient = require('mediasoup-client');
document.getElementById('container').style.display = 'none';
document.getElementById('chatBox').style.display = 'none';

document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('createRoomBtn').addEventListener('click', createRoom);

let device;
let rtpCapabilities;
let producerTransport;
let consumerTransport = [];
let audioProducer;
let videoProducer;
let producer;
let consumer;

let params = {
  encoding: [
    { rid: 'r0', maxBitrate: 100000, scalabiltyMode: 'S1T3' },
    { rid: 'r1', maxBitrate: 100000, scalabiltyMode: 'S1T3' },
    { rid: 'r2', maxBitrate: 100000, scalabiltyMode: 'S1T3' },
  ],
  codecOptions: {
    videoGoogleStartBitrate: 1000,
  },
};
const token = window.localStorage.getItem('authorization');
console.log('token:', token);

const socket = io('/chat', { auth: { token: token } });

let currentRoom = '';
// const channel = prompt('채널명을 입력해주세요');
function sendMessage() {
  if (currentRoom === '') {
    alert('방을 선택해주세요');
    return;
  }
  const message = $('#message').val();
  $('#message').val('');
  const data = { message, room: currentRoom };
  $('#chat').append(`<div>나:${message}</div>`);
  socket.emit('message', data);
  return false;
}

function createRoom() {
  const room = prompt('방이름을 입력해주세요.');
  const chatType = prompt('채팅 타입을 입력해주세요.');
  const maximumPeople = prompt('최대 인원을 입력해주세요.');
  const channelId = prompt('만드려는 채팅의 채널ID를 입력해주세요.');
  socket.emit('createRoom', {
    room,
    createChatDto: { title: room, chatType, maximumPeople, channelId },
  });
}

function updateRoomList(rooms) {
  $('#rooms').empty();
  rooms.forEach(room => {
    $('#rooms').append(
      `<li>${room.chatType} room :${room.title} <button class="joinBtn" data-room="${room.title}">join</button></li>`,
    );
  });

  $('.joinBtn').click(async function () {
    const room = $(this).data('room');
    const chatType = await socket.on('chatType', type => {
      return type;
    });
    joinRoom(room, chatType); // 선택한 방 이름을 인자로 전달하여 joinRoom 함수 호출
  });
}

function joinRoom(room, chatType) {
  socket.emit('joinRoom', { room });
  $('#chat').html('');
  currentRoom = room;
  socket.emit('requestChatHistory', { room });
  socket.emit('chatType', { room });
  socket.emit('broadcastScreenSharing', { room });
}
// 채팅 타입별 디스플레이 설정
socket.on('chatType', type => {
  if (type === 'voice') {
    document.getElementById('container').style.display = 'block';
    document.getElementById('chatBox').style.display = 'none';
  } else {
    document.getElementById('container').style.display = 'none';
    document.getElementById('chatBox').style.display = 'block';
  }
});

socket.on('notice', data => {
  $('#notice').append(`<div>${data.message}</div>`);
});

socket.on('message', data => {
  $('#chat').append(`<div>${data.message}</div>`);
});

$(document).ready(function () {
  socket.emit('requestRooms');

  socket.on('rooms', function (data) {
    updateRoomList(data);
  });
});

socket.on('connect', () => {
  console.log('connected', socket.id);
});

socket.on('dmHistory', function (dms) {
  $('#chat').html('');
  dms.forEach(dm => {
    // 각 메시지의 발신자 닉네임을 사용하여 표시
    $('#chat').append(`<div>${dm.senderNickname}: ${dm.content}</div>`);
  });
});

//! 1. client : 미디어 수신 정보 서버에 요청
let audioParams;
let videoParams = { params };

const streamSuccess = async stream => {
  const localVideo = document.getElementById('localVideo');
  localVideo.srcObject = stream;
  console.log('streamSuccess ~ stream:', stream);

  let room = currentRoom;
  audioParams = { track: stream.getAudioTracks()[0], ...audioParams };
  videoParams = { track: stream.getVideoTracks()[0], ...videoParams };

  socket.emit('joinVoiceRoom', { room });
  await socket.on('getRtpCapabilities', data => {
    // we assign to local variable and will be used when
    // loading the client Device (see createDevice above)
    rtpCapabilities = data;

    createDevice();
  });
};

const getLocalStream = () => {
  console.log('연결');
  navigator.getUserMedia(
    {
      audio: true,
      video: {
        width: {
          min: 640,
          max: 1920,
        },
        height: {
          min: 400,
          max: 1080,
        },
      },
    },
    streamSuccess,
    error => {
      console.log(error.message);
    },
  );
};

const createDevice = async () => {
  try {
    device = new mediasoupClient.Device();

    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#device-load
    // Loads the device with RTP capabilities of the Router (server side)
    await device.load({
      // see getRtpCapabilities() below
      routerRtpCapabilities: rtpCapabilities,
    });

    createSendTransport();
  } catch (error) {
    console.log(error);
    if (error.name === 'UnsupportedError') console.warn('browser not supported');
  }
};

// ! LP = SendTransport 생성을 위한 Transport 생성
const createSendTransport = () => {
  // Socket event listener for createWebRtcTransport response
  socket.on('createWebRtcTransport', ({ consumer, params }) => {
    if (params.error) {
      console.log(params.error);
      return;
    }

    producerTransport = device.createSendTransport(params);
    console.log('socket.on ~ params:', params);
    console.log('test1');
    //! 잘만들어짐

    producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        socket.on('transport-connect', data => {
          const { dtlsParameters } = data;
        });

        socket.emit('transport-connect', { dtlsParameters });
        //LP 생성. Send transport
        callback();
      } catch (error) {
        errback(error);
      }
    });

    producerTransport.on('produce', async (parameters, callback, errback) => {
      try {
        socket.on('transport-produce', data => {
          const { id } = data;
          callback({ id });
        });

        await socket.emit('transport-produce', {
          kind: parameters.kind,
          rtpParameters: parameters.rtpParameters,
          appData: parameters.appData,
          dtlsParameters: parameters.dtlsParameters,
        });
      } catch (error) {
        errback(error);
      }
    });

    connectSendTransport();
    createRecvTransport();
  });
  socket.emit('createWebRtcTransport', { consumer: false });
};

const connectSendTransport = async () => {
  try {
    videoProducer = await producerTransport.produce(videoParams);
    console.log('connectSendTransport ~ videoProducer:', videoProducer);
  } catch (error) {
    console.log(error);
  }
  try {
    audioProducer = await producerTransport.produce(audioParams);
    console.log('connectSendTransport ~ audioProducer:', audioProducer);
  } catch (error) {
    console.log(error);
  }

  // track 닫기
  videoProducer.on('trackended', () => {
    console.log('video track ended');
    // Close video track
  });

  videoProducer.on('transportclose', () => {
    console.log('video transport ended');
    // Close video track
  });
  audioProducer.on('trackended', () => {
    console.log('track ended');
  });

  audioProducer.on('transportclose', () => {
    console.log('transport ended');
    // Close audio track
  });
};

//! consumer
const createRecvTransport = async () => {
  // 서버에게 Consumer Transport를 생성하도록 요청
  socket.emit('joinVoiceRoom', { room });

  await socket.on('createWebRtcTransport', ({ consumer, params }) => {
    // 서버로부터 Consumer Transport 생성에 필요한 매개변수를 받음
    if (params.error) {
      console.log(params.error);
      return;
    }

    console.log('params !!!!', params);
    console.log('consumer !!!!', consumer);

    console.log('awaitsocket.emit ~ consumerTransport111111:', consumerTransport);
    // 서버의 Consumer Transport 매개변수를 기반으로 새로운 Consumer Transport를 생성
    consumerTransport = device.createRecvTransport(params);
    console.log('awaitsocket.emit ~ consumerTransport222:', consumerTransport);

    // Consumer Transport의 연결(connect) 이벤트 처리
    consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        socket.on('transport-recv-connect', data => {
          const { dtlsParameters } = data;
        });

        // 서버 측 Transport에 로컬 DTLS 매개변수를 신호로 전송
        await socket.emit('transport-recv-connect', { dtlsParameters });

        // Transport에 매개변수가 전송되었음을 알림
        callback();
      } catch (error) {
        errback(error);
      }
      connectRecvTransport();
    });
  });
  // 서버에서 RC 생성
  socket.emit('createWebRtcTransport', { consumer: true });
};

const connectRecvTransport = async () => {
  // for consumer, we need to tell the server first
  // to create a consumer based on the rtpCapabilities and consume
  // if the router can consume, it will send back a set of params as below
  await socket.emit('consume', { rtpCapabilities: device.rtpCapabilities }, async ({ params }) => {
    if (params.error) {
      console.log('Cannot Consume');
      return;
    }

    console.log(params);
    // then consume with the local consumer transport
    // which creates a consumer
    consumer = await consumerTransport.consume({
      id: params.id,
      producerId: params.producerId,
      kind: params.kind,
      rtpParameters: params.rtpParameters,
    });

    // destructure and retrieve the video track from the producer
    const { track } = consumer;

    remoteVideo.srcObject = new MediaStream([track]);

    // the server consumer started with media paused
    // so we need to inform the server to resume
    socket.emit('consumer-resume');
  });
};

/**
 * 유저의 미디어 장비에 접근,
 * 오디오, 비디오 stream을 받고 서버에 Router rtpCapabilities 요청
 * */
document.getElementById('localVideoOnBtn').addEventListener('click', getLocalStream);
document.getElementById('remoteVideoOnBtn').addEventListener('click', createRecvTransport);
document.getElementById('btnConnectRecvTransport').addEventListener('click', connectRecvTransport);
