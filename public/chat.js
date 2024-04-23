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
const token = document.cookie;
console.log('document:', document);
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

const streamSuccess = async stream => {
  const localVideo = document.getElementById('localVideo');
  localVideo.srcObject = stream;

  let room = currentRoom;
  audioParams = { track: stream.getAudioTracks()[0], ...audioParams };
  console.log('streamSuccess ~ audioParams:', audioParams);
  videoParams = { track: stream.getVideoTracks()[0], ...videoParams };
  socket.emit('joinVoiceRoom', { room });
  await socket.on('getRtpCapabilities', data => {
    console.log(`Router RTP Capabilities... ${data}`);

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

// make a request to the server for Router RTP Capabilities
// see server's socket.on('getRtpCapabilities', ...)
// the server sends back data object which contains rtpCapabilities

// ! LP = SendTransport 생성을 위한 Transport 생성

// const createSendTransport = async () => {
//   console.log('createSendTransport 도착');
//   // on   -  수신
//   // emit -     송신
//   socket.on('createWebRtcTransport', data => {
//     console.log('createSendTransport ~ data:', data);
//   });
//   //! 처리하는 로직
//   socket.emit('createWebRtcTransport', { consumer: true }, ({ params }) => {
//     console.log('실행후 test');

//     if (params.error) {
//       console.log(params.error);
//       return;
//     }
//     console.log('socket.emit ~ params:', params);

//     // 미디어 전송을 위해 webrtc transport 생성
//     // 서버의 producer transport의 매개 변수를 기반.
//     producerTransport = device.createSendTransport(params);
//     console.log('createSendTransport ~ producerTransport:', producerTransport);

//     // https://mediasoup.org/documentation/v3/communication-between-client-and-server/#producing-media
//     // Transport.Produce() 호출 시 발생 아래 connectSendTransport() 참고
//     producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
//       try {
//         // 로컬 DTLS 매개변수를 서버 측 transport에 신호 전달
//         socket.emit('transport-connect', { dtlsParameters });

//         // transport에 parameters들이 전송되었다는 것을 알려주는 역할!
//         callback();
//       } catch (error) {
//         errback(error);
//       }
//     });

//     producerTransport.on('produce', async parameters => {
//       console.log('test----------------------', parameters);

//       try {
//         // 서버에게 파라미터와 함께 Producer 생성 요청. 생성하고 서버 측 Producer id받기
//         // see server's socket.on('transport-produce', ...)
//         socket.emit(
//           'transport-produce',
//           {
//             kind: parameters.kind,
//             rtpParameters: parameters.rtpParameters,
//             appData: parameters.appData,
//           },
//           ({ id }) => {
//             // 성공적으로 produce 이벤트를 처리했을 때의 동작
//             console.log('Producer ID received from server:', id);
//           },
//         );
//       } catch (error) {
//         console.error(error);
//       }
//     });

//     connectSendTransport();
//   });
//   // });
// };

// const connectSendTransport = async () => {
//   console.log('여기가 문제?');
//   // we now call produce() to instruct the producer transport
//   // to send media to the Routeron('connect
//   // https://mediasoup.org/documentation/v3/mediasoup-client/api/#transport-produce
//   // this action will trigger the 'connect' and 'produce' events above
//   audioProducer = await producerTransport.produce(audioParams);
//   console.log('connectSendTransport ~ audioProducer:', audioProducer);
//   videoProducer = await producerTransport.produce(videoParams);
//   console.log('connectSendTransport ~ videoProducer:', videoProducer);
//   audioProducer.on('trackended', () => {
//     console.log('track ended');

//     // close video track
//   });

//   audioProducer.on('transportclose', () => {
//     console.log('transport ended');

//     // close video track
//   });
//   videoProducer.on('trackended', () => {
//     console.log('video track ended');

//     // close video track
//   });

//   videoProducer.on('transportclose', () => {
//     console.log('video transport ended');

//     // close video track
//   });
// };
const createSendTransport = async () => {
  console.log('createSendTransport 도착');

  // Socket event listener for createWebRtcTransport response
  socket.on('createWebRtcTransport', ({ consumer, params }) => {
    if (params.error) {
      console.log(params.error);
      return;
    }

    // If consumer is true, create consumer transport, else create producer transport
    const transport = consumer ? device.createRecvTransport(params) : device.createSendTransport(params);
    console.log('createSendTransport ~ transport:', transport);

    // Handle transport connection
    transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        // Send local DTLS parameters to server-side transport
        socket.emit('transport-connect', { dtlsParameters });

        // Acknowledge that parameters have been sent to the transport
        callback();
      } catch (error) {
        errback(error);
      }
    });

    // Handle media producer
    transport.on('produce', async parameters => {
      try {
        // Request server to create producer with given parameters
        socket.emit(
          'transport-produce',
          {
            kind: parameters.kind,
            rtpParameters: parameters.rtpParameters,
            appData: parameters.appData,
          },
          ({ id }) => {
            console.log('Producer ID received from server:', id);
          },
        );
      } catch (error) {
        console.error(error);
      }
    });

    // Call function to connect the send transport if it's a producer
    if (!consumer) {
      connectSendTransport(transport);
    }
  });

  // Emit request to create a WebRTC transport
  socket.emit('createWebRtcTransport', { consumer: true });
};

const connectSendTransport = async transport => {
  console.log('connectSendTransport 도착');

  // Call produce() to instruct the producer transport to send media
  // to the Router on('connect')
  const audioProducer = await transport.produce(audioParams);
  console.log('connectSendTransport ~ audioProducer:', audioProducer);

  const videoProducer = await transport.produce(videoParams);
  console.log('connectSendTransport ~ videoProducer:', videoProducer);

  // Event listeners for track and transport closure
  audioProducer.on('trackended', () => {
    console.log('track ended');
    // Close audio track
  });

  audioProducer.on('transportclose', () => {
    console.log('transport ended');
    // Close audio track
  });

  videoProducer.on('trackended', () => {
    console.log('video track ended');
    // Close video track
  });

  videoProducer.on('transportclose', () => {
    console.log('video transport ended');
    // Close video track
  });
};

// const createRecvTransport = async () => {
//   // see server's socket.on('consume', sender?, ...)
//   // this is a call from Consumer, so sender = false
//   await socket.emit('createWebRtcTransport', { sender: false }, ({ params }) => {
//     // The server sends back params needed
//     // to create Send Transport on the client side
//     if (params.error) {
//       console.log(params.error);
//       return;
//     }

//     console.log(params);

//     // creates a new WebRTC Transport to receive media
//     // based on server's consumer transport params
//     // https://mediasoup.org/documentation/v3/mediasoup-client/api/#device-createRecvTransport
//     consumerTransport = device.createRecvTransport(params);

//     // https://mediasoup.org/documentation/v3/communication-between-client-and-server/#producing-media
//     // this event is raised when a first call to transport.produce() is made
//     // see connectRecvTransport() below
//     consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
//       try {
//         // Signal local DTLS parameters to the server side transport
//         // see server's socket.on('transport-recv-connect', ...)
//         await socket.emit('transport-recv-connect', {
//           dtlsParameters,
//         });

//         // Tell the transport that parameters were transmitted.
//         callback();
//       } catch (error) {
//         // Tell the transport that something was wrong
//         errback(error);
//       }
//     });
//   });
// };

// const connectRecvTransport = async () => {
//   // for consumer, we need to tell the server first
//   // to create a consumer based on the rtpCapabilities and consume
//   // if the router can consume, it will send back a set of params as below
//   await socket.emit(
//     'consume',
//     {
//       rtpCapabilities: device.rtpCapabilities,
//     },
//     async ({ params }) => {
//       if (params.error) {
//         console.log('Cannot Consume');
//         return;
//       }

//       console.log(params);
//       // then consume with the local consumer transport
//       // which creates a consumer
//       consumer = await consumerTransport.consume({
//         id: params.id,
//         producerId: params.producerId,
//         kind: params.kind,
//         rtpParameters: params.rtpParameters,
//       });

//       // destructure and retrieve the video track from the producer
//       const { track } = consumer;

//       remoteVideo.srcObject = new MediaStream([track]);

//       // the server consumer started with media paused
//       // so we need to inform the server to resume
//       socket.emit('consumer-resume');
//     },
//   );
// };

/**
 * 유저의 미디어 장비에 접근,
 * 오디오, 비디오 stream을 받고 서버에 Router rtpCapabilities 요청
 * */
document.getElementById('localVideoOnBtn').addEventListener('click', getLocalStream);
