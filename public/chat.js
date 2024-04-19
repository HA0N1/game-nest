// import { io } from 'https://cdn.socket.io/4.7.5/socket.io.esm.min.js';
document.getElementById('container').style.display = 'none';
document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('createRoomBtn').addEventListener('click', createRoom);
document.getElementById('toggleVideoBtn').addEventListener('click', toggleCamera);

const token = document.cookie;
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
    $('#rooms').append(`<li>${room.title} <button class="joinBtn" data-room="${room.title}">join</button></li>`);
  });

  $('.joinBtn').click(function () {
    const room = $(this).data('room');
    joinRoom(room); // 선택한 방 이름을 인자로 전달하여 joinRoom 함수 호출
  });
}

function joinRoom(room) {
  socket.emit('joinRoom', { room });
  $('#chat').html('');
  currentRoom = room;
  socket.emit('requestChatHistory', { room });
  socket.emit('chatType', { room });
  socket.emit('broadcastScreenSharing', { room });
}

socket.on('chatType', type => {
  console.log('type:', type);
  if (type === 'voice') {
    document.getElementById('container').style.display = 'block';
  } else {
    document.getElementById('container').style.display = 'none';
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

socket.on('screenSharingStream', data => {
  const stream = data.stream;
  console.log('스트림 테스트', stream);
});
const constraints = (window.constraints = {
  audio: true,
  video: true,
});
let isCameraOn = true;

function toggleCamera() {
  const video = document.querySelector('video');
  if (isCameraOn) {
    // 카메라 켜져 있으면 끄기
    video.srcObject = null;
    isCameraOn = false;
    document.querySelector('#toggleVideoBtn').textContent = '카메라 켜기';
  } else {
    // 꺼져 있으면 켜기
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(stream => {
        video.srcObject = stream;
        isCameraOn = true;
        document.querySelector('#toggleVideoBtn').textContent = '카메라 끄기';
      })
      .catch(error => {
        console.error('Error accessing camera:', error);
      });
  }
}
const preferredDisplaySurface = document.getElementById('displaySurface');
const startButton = document.getElementById('startButton');

if (adapter.browserDetails.browser === 'chrome' && adapter.browserDetails.version >= 107) {
  // See https://developer.chrome.com/docs/web-platform/screen-sharing-controls/
  document.getElementById('options').style.display = 'block';
} else if (adapter.browserDetails.browser === 'firefox') {
  // Polyfill in Firefox.
  // See https://blog.mozilla.org/webrtc/getdisplaymedia-now-available-in-adapter-js/

  adapter.browserShim.shimGetDisplayMedia(window, 'screen');
}

function handleError(error) {
  errorMsg(`디스플레이를 불러오지 못하였습니다.: ${error.name}`, error);
}

function errorMsg(msg, error) {
  const errorElement = document.querySelector('#errorMsg');
  errorElement.innerHTML += `<p>${msg}</p>`;
  if (typeof error !== 'undefined') {
    console.error(error);
  }
}

function handleSuccess(stream) {
  startButton.disabled = true;

  preferredDisplaySurface.disabled = true;
  const video = document.getElementById('video2');

  video.srcObject = stream;
  const room = currentRoom;
  // 스트림의 id만을 전송
  socket.emit('broadcastScreenSharing', { room, stream });
  console.log('handleSuccess ~ stream:', stream);
  // 사용자가 멈췄는지 감지하는 방법
  // 브라우저 UI를 통해 화면을 공유
  stream.getVideoTracks()[0].addEventListener('ended', () => {
    errorMsg('사용자가 화면 공유를 종료했습니다.');

    startButton.disabled = false;
    //

    preferredDisplaySurface.disabled = false;
  });
}
startButton.addEventListener('click', () => {
  const options = { audio: true, video: true };

  const displaySurface = preferredDisplaySurface.options[preferredDisplaySurface.selectedIndex].value;
  if (displaySurface !== 'default') {
    options.video = { displaySurface };
  }

  // Start screen sharing
  navigator.mediaDevices
    .getDisplayMedia(options)
    .then(handleSuccess) // Pass the stream to handleSuccess function
    .catch(handleError);
});

// Check if screen sharing is supported
if (navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) {
  startButton.disabled = false;
} else {
  errorMsg('getDisplayMedia is not supported');
}
