const mediasoupClient = require('mediasoup-client');
document.getElementById('container').style.display = 'none';
document.getElementById('chatBox').style.display = 'none';

document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('createRoomBtn').addEventListener('click', openModal);
document.querySelector('.close').addEventListener('click', closeModal);
document.getElementById('createRoomForm').addEventListener('submit', createRoomWithModal);

const preferredDisplaySurface = document.getElementById('displaySurface');
const startButton = document.getElementById('startButton');
const screenShareBtn = document.getElementById('screenShareBtn');
document.getElementById('myModal').style.display = 'none';
let device;
let rtpCapabilities;
let producerTransport;
let consumerTransport;
let audioProducer;
let videoProducer;
let producer;
let consumer;
let producerId;
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
window.onload = function () {
  checkLogin();
};

function checkLogin() {
  if (!token) {
    socket.disconnect();
    alert('로그인을 해야 할 수 있는 서비스입니다.');
    window.location.href = 'http://localhost:3000/user/login';
  }
}
const socket = io('/chat', { auth: { token: token } });

let currentRoom = '';

document.addEventListener('DOMContentLoaded', function () {
  const currentUrl = window.location.href;
  console.log('currentUrl:', currentUrl);

  const urlParts = currentUrl.split('/');
  const channelId = urlParts[urlParts.indexOf('channel') + 1];
  console.log('channelId:', channelId);
});

function createRoomWithModal(event) {
  event.preventDefault(); // 폼 제출 기본 동작 방지
  const roomName = document.getElementById('roomName').value;
  const chatType = document.getElementById('chatType').value;
  const maximumPeople = document.getElementById('maximumPeople').value;

  // 입력 값으로 채팅방 생성 로직
  socket.emit('createRoom', {
    room: roomName,
    createChatDto: { title: roomName, chatType, maximumPeople },
  });

  closeModal(); // 모달 창 닫기
}

function openModal() {
  console.log('모달창 뜸');
  document.getElementById('myModal').style.display = 'block';
}

function closeModal() {
  document.getElementById('myModal').style.display = 'none';
}
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
    await device.load({
      routerRtpCapabilities: rtpCapabilities,
    });

    createSendTransport();
  } catch (error) {
    console.log(error);
    if (error.name === 'UnsupportedError') console.warn('browser not supported');
  }
};

// ! LP = SendTransport 생성을 위한 Transport 생성
const createSendTransport = async () => {
  // Socket event listener for createWebRtcTransport response
  socket.on('createWebRtcTransport', ({ consumer, params }) => {
    if (params.error) {
      console.log(params.error);
      return;
    }

    producerTransport = device.createSendTransport(params);

    //! 잘만들어짐

    producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        socket.on('transport-connect', data => {
          const { dtlsParameters } = data;
          console.log('producerTransport.on ~ dtlsParameters:', dtlsParameters);
          console.log('도착');
        });

        await socket.emit('transport-connect', { dtlsParameters });
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
          producerId = id;
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
  });
  socket.emit('createWebRtcTransport', { consumer: false });
};

const connectSendTransport = async () => {
  videoProducer = await producerTransport.produce(videoParams);
  console.log('connectSendTransport ~ videoProducer:', videoProducer);

  audioProducer = await producerTransport.produce(audioParams);
  console.log('connectSendTransport ~ audioProducer:', audioProducer);

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
  console.log('createRecvTransport 만듦');
  createRecvTransport();
};

//! consumer
const createRecvTransport = async () => {
  // Handle the response from the server to create Consumer Transport
  socket.on('createWebRtcTransport', async ({ consumer, params }) => {
    if (params.error) {
      console.log(params.error);
      return;
    }

    consumerTransport = device.createRecvTransport(params);
    // ! 잘만들어짐
    console.log('여기는 문제없지?');

    // consumer 연결
    consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      console.log('여기가 잘돼야함');
      try {
        socket.on('transport-recv-connect', data => {
          const { consumerTransport } = data;
          console.log('consumerTransport.on ~ data:', data);
        });

        socket.emit('transport-recv-connect', { dtlsParameters });
        // callback();
      } catch (error) {
        errback(error);
      }
    });
    connectRecvTransport();
  });
  // 서버에 consumerTransport 생성 요청
  socket.emit('createWebRtcTransport', { consumer: true });
};

const connectRecvTransport = async () => {
  // Emit the 'consume' event to the server with the RTP capabilities of the device
  await socket.emit('consume', { rtpCapabilities: device.rtpCapabilities, producerId }, async ({ params }) => {
    console.log('awaitsocket.emit ~ rtpCapabilities:', rtpCapabilities);
    console.log('awaitsocket.emit ~ params:', params);
    if (params.error) {
      console.log('Cannot Consume');
      return;
    }
  });
  console.log('안녕', rtpCapabilities);

  if (params.error) {
    console.log('Cannot Consume');
    return;
  }

  // Consume with the local consumer transport to create a consumer
  consumer = await consumerTransport.consume({
    id: params.id,
    producerId: params.producerId,
    kind: params.kind,
    rtpParameters: params.rtpParameters,
  });

  // Retrieve the video track from the producer and set it to the remote video element
  const { track } = consumer;
  remoteVideo.srcObject = new MediaStream([track]);

  // Inform the server to resume the consumer
  socket.emit('consumer-resume');
};

if (adapter.browserDetails.browser === 'chrome' && adapter.browserDetails.version >= 107) {
  // See https://developer.chrome.com/docs/web-platform/screen-sharing-controls/
  document.getElementById('options').style.display = 'block';
} else if (adapter.browserDetails.browser === 'firefox') {
  // Polyfill in Firefox.
  // See https://blog.mozilla.org/webrtc/getdisplaymedia-now-available-in-adapter-js/
  adapter.browserShim.shimGetDisplayMedia(window, 'screen');
}
// 화면공유
function screenShare() {
  const options = {
    audio: false,
    video: {
      width: 1080,
      height: 720,
    },
  };
  const displaySurface = preferredDisplaySurface.options[preferredDisplaySurface.selectedIndex].value;
  if (displaySurface !== 'default') {
    options.video = { displaySurface };
  }
  navigator.mediaDevices.getDisplayMedia(options).then(handleSuccess);
}

if (navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) {
  // startButton.disabled = false;
} else {
  errorMsg('getDisplayMedia is not supported');
}

function handleSuccess(stream) {
  // startButton.disabled = true;
  preferredDisplaySurface.disabled = true;
  const video = document.getElementById('screenShare');
  video.srcObject = stream;

  // demonstrates how to detect that the user has stopped
  // sharing the screen via the browser UI.
  stream.getVideoTracks()[0].addEventListener('ended', () => {
    errorMsg('The user has ended sharing the screen');
    startButton.disabled = false;
    preferredDisplaySurface.disabled = false;
  });
}
/**
 * 유저의 미디어 장비에 접근,
 * 오디오, 비디오 stream을 받고 서버에 Router rtpCapabilities 요청
 * */
document.getElementById('screenShareBtn').addEventListener('click', screenShare);
document.getElementById('localVideoOnBtn').addEventListener('click', getLocalStream);
document.getElementById('remoteVideoOnBtn').addEventListener('click', createRecvTransport);
// document.getElementById('btnConnectRecvTransport').addEventListener('click', connectRecvTransport);
