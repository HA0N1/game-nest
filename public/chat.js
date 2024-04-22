const mediasoupClient = require('mediasoup-client');
document.getElementById('container').style.display = 'none';
document.getElementById('chatBox').style.display = 'none';

document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('createRoomBtn').addEventListener('click', createRoom);

let device;
let rtpCapabilities;
let producerTransport;
let consumerTransport;
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

const token = document.cookie;
console.log('document:', document);
console.log('token:', token);

const socket = io('/chat', { auth: { token: token } });

let currentRoom = '';
const channel = prompt('채널명을 입력해주세요');
function sendMessage() {
  if (currentRoom === '') {
    alert('방을 선택해주세요');
    return;
  }
  const message = $('#message').val();

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
    console.log('chatType:', chatType);
  });
}

function joinRoom(room, chatType) {
  console.log('joinRoom ~ chatType:', chatType);
  socket.emit('joinRoom', { room });
  $('#chat').html('');
  currentRoom = room;
  socket.emit('requestChatHistory', { room });
  socket.emit('chatType', { room });
  socket.emit('broadcastScreenSharing', { room });
}
// 채팅 타입별 디스플레이 설정
socket.on('chatType', type => {
  console.log('type:', type);
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

async function streamSuccess(stream) {
  const localVideo = document.getElementById('localVideo');
  localVideo.srcObject = stream;

  let room = currentRoom;
  audioParams = { track: stream.getAudioTracks()[0], ...audioParams };
  videoParams = { track: stream.getVideoTracks()[0], ...videoParams };
}

const getLocalStream = () => {
  navigator.getUserMedia(
    {
      audio: false,
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
    console.log('도착');
    device = new mediasoupClient.Device();
    console.log('createDevice ~ device:', device);

    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#device-load
    // Loads the device with RTP capabilities of the Router (server side)
    await device.load({
      // see getRtpCapabilities() below
      routerRtpCapabilities: rtpCapabilities,
    });

    console.log('test다', device);
    createSendTransport();
  } catch (error) {
    console.log(error);
    if (error.name === 'UnsupportedError') console.warn('browser not supported');
  }
};

// make a request to the server for Router RTP Capabilities
// see server's socket.on('getRtpCapabilities', ...)
// the server sends back data object which contains rtpCapabilities
socket.on('getRtpCapabilities', data => {
  console.log(`Router RTP Capabilities... ${data}`);

  // we assign to local variable and will be used when
  // loading the client Device (see createDevice above)
  rtpCapabilities = data;

  createDevice();
});

const createSendTransport = () => {
  // see server's socket.on('createWebRtcTransport', sender?, ...)
  // this is a call from Producer, so sender = true
  socket.emit('createWebRtcTransport', { sender: true }, ({ params }) => {
    // The server sends back params needed
    // to create Send Transport on the client side
    if (params.error) {
      console.log(params.error);
      return;
    }

    console.log(params);

    // creates a new WebRTC Transport to send media
    // based on the server's producer transport params
    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#TransportOptions
    producerTransport = device.createSendTransport(params);

    // https://mediasoup.org/documentation/v3/communication-between-client-and-server/#producing-media
    // this event is raised when a first call to transport.produce() is made
    // see connectSendTransport() below
    producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        // Signal local DTLS parameters to the server side transport
        // see server's socket.on('transport-connect', ...)
        await socket.emit('transport-connect', {
          dtlsParameters,
        });

        // Tell the transport that parameters were transmitted.
        callback();
      } catch (error) {
        errback(error);
      }
    });

    producerTransport.on('produce', async (parameters, callback, errback) => {
      console.log(parameters);

      try {
        // tell the server to create a Producer
        // with the following parameters and produce
        // and expect back a server side producer id
        // see server's socket.on('transport-produce', ...)
        await socket.emit(
          'transport-produce',
          {
            kind: parameters.kind,
            rtpParameters: parameters.rtpParameters,
            appData: parameters.appData,
          },
          ({ id }) => {
            // Tell the transport that parameters were transmitted and provide it with the
            // server side producer's id.
            callback({ id });
          },
        );
      } catch (error) {
        errback(error);
      }
    });
  });
};

const connectSendTransport = async () => {
  // we now call produce() to instruct the producer transport
  // to send media to the Router
  // https://mediasoup.org/documentation/v3/mediasoup-client/api/#transport-produce
  // this action will trigger the 'connect' and 'produce' events above
  producer = await producerTransport.produce(params);

  producer.on('trackended', () => {
    console.log('track ended');

    // close video track
  });

  producer.on('transportclose', () => {
    console.log('transport ended');

    // close video track
  });
};

const createRecvTransport = async () => {
  // see server's socket.on('consume', sender?, ...)
  // this is a call from Consumer, so sender = false
  await socket.emit('createWebRtcTransport', { sender: false }, ({ params }) => {
    // The server sends back params needed
    // to create Send Transport on the client side
    if (params.error) {
      console.log(params.error);
      return;
    }

    console.log(params);

    // creates a new WebRTC Transport to receive media
    // based on server's consumer transport params
    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#device-createRecvTransport
    consumerTransport = device.createRecvTransport(params);

    // https://mediasoup.org/documentation/v3/communication-between-client-and-server/#producing-media
    // this event is raised when a first call to transport.produce() is made
    // see connectRecvTransport() below
    consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        // Signal local DTLS parameters to the server side transport
        // see server's socket.on('transport-recv-connect', ...)
        await socket.emit('transport-recv-connect', {
          dtlsParameters,
        });

        // Tell the transport that parameters were transmitted.
        callback();
      } catch (error) {
        // Tell the transport that something was wrong
        errback(error);
      }
    });
  });
};

const connectRecvTransport = async () => {
  // for consumer, we need to tell the server first
  // to create a consumer based on the rtpCapabilities and consume
  // if the router can consume, it will send back a set of params as below
  await socket.emit(
    'consume',
    {
      rtpCapabilities: device.rtpCapabilities,
    },
    async ({ params }) => {
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
    },
  );
};

/**
 * 유저의 미디어 장비에 접근,
 * 오디오, 비디오 stream을 받고 서버에 Router rtpCapabilities 요청
 * */

document.getElementById('localVideoOnBtn').addEventListener('click', getLocalStream);
