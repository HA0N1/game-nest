const mediasoupClient = require('mediasoup-client');
document.getElementById('container').style.display = 'none';
document.getElementById('chatBox').style.display = 'none';

document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('createRoomBtn').addEventListener('click', openModal);
document.querySelector('.close').addEventListener('click', closeModal);
document.getElementById('createRoomForm').addEventListener('submit', createRoomWithModal);
const preferredDisplaySurface = document.getElementById('displaySurface');
const startButton = document.getElementById('startButton');
const remoteColum = document.querySelector('.remoteColum');
document.getElementById('myModal').style.display = 'none';
let device;
let rtpCapabilities;
let producerTransport;
let consumerTransports = [];
let audioProducer;
let videoProducer;
let producerId;
let socketId;
let nickname;
let roomName;
// let remoteVideo;
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
    window.location.href = 'https://chunsik.store/main';
  }
}
const socket = io('/chat', { auth: { token: token } });

let currentRoom = '';

socket.on('connection-success', ({ socketId1, nickname1 }) => {
  socketId = socketId1;
  nickname = nickname1;
});

document.addEventListener('DOMContentLoaded', function () {
  const currentUrl = window.location.href;
  console.log('currentUrl:', currentUrl);

  const urlParts = currentUrl.split('/');
  const channelId = urlParts[urlParts.indexOf('channel') + 1];
  console.log('channelId:', channelId);
});

function createRoomWithModal(event) {
  event.preventDefault(); // 폼 제출 기본 동작 방지
  roomName = document.getElementById('roomName').value;
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

    joinRoom(room); // 선택한 방 이름을 인자로 전달하여 joinRoom 함수 호출
  });
}

function joinRoom(room) {
  socket.emit('joinRoom', { room });
  $('#chat').html('');
  currentRoom = room;
  socket.on('chatType', type => {
    if (type === 'voice') {
      document.getElementById('container').style.display = 'block';
      document.getElementById('chatBox').style.display = 'none';
      getLocalStream();
    } else {
      document.getElementById('container').style.display = 'none';
      document.getElementById('chatBox').style.display = 'block';
    }
  });
  socket.emit('requestChatHistory', { room });
  socket.emit('broadcastScreenSharing', { room });
  socket.emit('chatType', { room });
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

// socket.on('connect', () => {
//   console.log('connected', socket.id);
// });

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
let consumingTransports = [];
let room;

const streamSuccess = async stream => {
  const localVideo = document.getElementById('localVideo');
  localVideo.srcObject = stream;

  audioParams = { track: stream.getAudioTracks()[0], ...audioParams };
  videoParams = { track: stream.getVideoTracks()[0], ...videoParams };
  room = currentRoom;

  joinVoiceRoom(room);
};

async function joinVoiceRoom() {
  await socket.on('getRtpCapabilities', data => {
    // we assign to local variable and will be used when
    // loading the client Device (see createDevice above)
    rtpCapabilities = data;

    createDevice();
  });
  socket.emit('joinVoiceRoom', { room, nickname });
}

const getLocalStream = () => {
  document.getElementById('localVideoOnBtn').style.display = 'none';
  console.log('연결');
  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: {
        width: 720,
        height: 600,
      },
    })
    .then(streamSuccess)
    .catch(error => {
      console.log(error.message);
    });
};

const createDevice = async () => {
  try {
    console.log('디바이스만드나');
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
  // Request to create a new WebRTC Transport
  socket.off('createWebRtcTransport1').on('createWebRtcTransport1', ({ consumer, params }) => {
    if (params.error) {
      console.log(params.error);
      return;
    }
    producerTransport = device.createSendTransport(params);

    producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        socket.on('transport-connect', data => {
          const { dtlsParameters } = data;
        });
        await socket.emit('transport-connect', { dtlsParameters });
        callback();
      } catch (error) {
        errback(error);
      }
    });

    producerTransport.on('produce', async (parameters, callback, errback) => {
      console.log('오라ㅏ제발');
      //! 여기 두번
      try {
        // Tell the server to create a Producer with the provided parameters
        socket.off('transport-produce');

        socket.once('transport-produce', data => {
          console.log('producerTransport.on ~ data:', data);
          console.log('프로듀스와라이');
          const { id, producersExist } = data;
          console.log('producerTransport.on ~ producersExist:', producersExist);
          //! 여기 안 이 맞아
          callback({ id });
          if (producersExist) {
            console.log('Other producers exist, initiating room join process or similar action.');
            getProducers();
          }
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

const getProducers = () => {
  // 서버로부터 'getProducers' 응답을 처리하는 리스너
  socket.on('getProducers', data => {
    const { producerList } = data;
    console.log('getProducers ~ producerList:', producerList);

    // 해당 데이터를 사용하여 필요한 작업 수행
    producerList.forEach(producer => {
      const [producerId, producerName, socketId] = producer;
      console.log(`Producer ID: ${producerId}, Name: ${producerName}, Socket ID: ${socketId}`);
      signalNewConsumerTransport(producerId, socketId);
    });
  });

  // 서버에 'getProducers' 이벤트를 요청
  socket.emit('getProducers');
};

const connectRecvTransport = async (consumerTransport, remoteProducerId, serverConsumerTransportId, socketName) => {
  console.log('connectRecvTransport');

  socket.on('consume', async ({ params }) => {
    console.log('socket.on ~ params:', params);
    if (params.error) {
      console.log('Cannot Consume');
      return;
    }

    let consumer = await consumerTransport.consume({
      id: params.id,
      producerId: params.producerId,
      kind: params.kind,
      rtpParameters: params.rtpParameters,
    });

    consumerTransports = [
      ...consumerTransports,
      {
        consumerTransport,
        serverConsumerTransportId: params.id,
        producerId: remoteProducerId,
        consumer,
      },
    ];

    const { track } = consumer;
    // remoteVideo.srcObject = new MediaStream([track]);

    const wrapper = document.createElement('div');
    const newElem = document.createElement('div'); // 비디오 화면
    const newSpan = document.createElement('span');

    wrapper.setAttribute('id', `td-${remoteProducerId}`);

    newElem.setAttribute('class', 'remoteVideo');
    newElem.innerHTML =
      '<video id="' + remoteProducerId + '" autoplay class="video"></video> <p>' + socketName + '</p>';

    wrapper.appendChild(newElem);
    wrapper.appendChild(newSpan);
    videoContainer.appendChild(wrapper);

    document.getElementById(remoteProducerId).srcObject = new MediaStream([track]);

    await socket.emit('consumer-resume', { serverConsumerId: params.serverConsumerId });
  });

  socket.emit('consume', { rtpCapabilities: device.rtpCapabilities, remoteProducerId, serverConsumerTransportId });
};
const connectSendTransport = async () => {
  console.log('connectSendTransport 도착');

  audioProducer = await producerTransport.produce(audioParams);
  console.log('connectSendTransport ~ audioProducer:', audioProducer);

  videoProducer = await producerTransport.produce(videoParams);
  console.log('connectSendTransport ~ videoProducer:', videoProducer);

  audioProducer.on('trackended', () => {
    console.log('track ended');
  });

  audioProducer.on('transportclose', () => {
    console.log('transport ended');
  });
  videoProducer.on('trackended', () => {
    console.log('video track ended');
  });

  videoProducer.on('transportclose', () => {
    console.log('video transport ended');
  });
};

//! consumer
const signalNewConsumerTransport = async (remoteProducerId, socketName) => {
  console.log('createRecvTransport 도착');
  if (consumingTransports.includes(remoteProducerId)) return;
  consumingTransports.push(remoteProducerId);

  socket.on('createWebRtcTransport2', async ({ consumer, params }) => {
    console.log('socket.on ~ consumer:', consumer);
    if (params.error) {
      console.log(params.error);
      return;
    }

    console.log(`PARAMS... ${params}`);
    let consumerTransport;
    try {
      consumerTransport = device.createRecvTransport(params);
    } catch (error) {
      console.log(error);
      return;
    }

    consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        socket.on('transport-recv-connect', async data => {
          const { dtlsParameters } = data;
          console.log('consumerTransport.on ~ dtlsParameters:', dtlsParameters);
        });

        await socket.emit('transport-recv-connect', {
          dtlsParameters,
          serverConsumerTransportId: params.id,
        });

        // Tell the transport that parameters were transmitted.
        callback();
      } catch (error) {
        // Tell the transport that something was wrong
        errback(error);
      }
    });
    connectRecvTransport(consumerTransport, remoteProducerId, params.id, socketName);
  });
  socket.emit('createWebRtcTransport', { consumer: true });
};

socket.on('producer-closed', ({ remoteProducerId }) => {
  // server notification is received when a producer is closed
  // we need to close the client-side consumer and associated transport
  const producerToClose = consumerTransports.find(transportData => transportData.producerId === remoteProducerId);
  producerToClose.consumerTransport.close();
  producerToClose.consumer.close();

  // remove the consumer transport from the list
  consumerTransports = consumerTransports.filter(transportData => transportData.producerId !== remoteProducerId);

  // remove the video div element
  videoContainer.removeChild(document.getElementById(`td-${remoteProducerId}`));
});

function videoOff() {
  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo'); // Assuming this is the ID of your remote video element

  // Stop all tracks in the local video stream
  const localStream = localVideo.srcObject;
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }

  // Stop all tracks in the remote video stream
  const remoteStream = remoteVideo.srcObject;
  if (remoteStream) {
    remoteStream.getTracks().forEach(track => track.stop());
  }

  // Remove the video streams from the video elements
  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
}

// 화면공유

if (adapter.browserDetails.browser === 'chrome' && adapter.browserDetails.version >= 107) {
  document.getElementById('options').style.display = 'block';
} else if (adapter.browserDetails.browser === 'firefox') {
  adapter.browserShim.shimGetDisplayMedia(window, 'screen');
}

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
document.getElementById('localVideoOffBtn').addEventListener('click', videoOff);
document.getElementById('recv').addEventListener('click', connectRecvTransport);
