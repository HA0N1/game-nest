const token = window.localStorage.getItem('authorization');
const socket = io('http://localhost:3000/friendDM', { auth: { token: token } });

const dmMain = document.getElementById('dmMain');
const rooms = dmMain.querySelector('#rooms');
const dmRoom = document.getElementById('dmRoom');
dmRoom.hidden = true;

const gotoMain = document.getElementById('gotoMain');
gotoMain.addEventListener('click', goBack);

const messageForm = dmRoom.querySelector('#message');
messageForm.addEventListener('submit', handleDMSubmit);

const fileBtn = document.getElementById('fileBtn');
fileBtn.addEventListener('click', handleImageSubmit);

let currentRoom = '';

const toMain = document.getElementById('toMain');
toMain.addEventListener('click', toDMRooms);

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

function toDMRooms() {
  sayBye();
  // 이전 채팅 내역들 삭제하기
  const newChats = document.getElementById('newChats');
  const pastChats = newChats.querySelectorAll('li');
  const chatsArray = Array.from(pastChats);
  chatsArray.forEach(li => {
    li.remove();
  });

  const exist = document.getElementById('exist');
  const existTexts = exist.querySelectorAll('li');
  const existArray = Array.from(existTexts);
  existArray.forEach(li => {
    li.remove();
  });

  dmRoom.hidden = true;
  dmMain.hidden = false;
}

function sayBye() {
  const room = document.querySelector('#room h3');
  const inTitle = room.innerText;
  const dmRoomId = inTitle.split(' ')[1];
  socket.emit('sayBye', dmRoomId);
  const message = document.querySelector('#dmRoom ul li');
}

function goBack() {
  window.location.href = 'http://localhost:3000/main';
}

socket.on('dmRoomsList', function () {
  socket.emit('dmRoomList');
});

function sendDM(message) {
  const ul = dmRoom.querySelector('#newChats');
  const li = document.createElement('li');
  li.innerText = message;
  ul.appendChild(li);
}

function showExist(message) {
  const ul = dmRoom.querySelector('#exist');
  const li = document.createElement('li');
  li.innerText = message;
  ul.appendChild(li);
}

function handleDMSubmit(event) {
  event.preventDefault();
  const input = dmRoom.querySelector('#message input');
  const value = input.value;

  if (value.length === 0) {
    return;
  }

  const dmRoomName = dmRoom.querySelector('h3').textContent;
  const dmRoomId = dmRoomName.split(' ')[1];

  const data = { value, dmRoomId };

  socket.emit('sendMessage', data);

  input.value = '';
}

function handleImageSubmit(event) {
  event.preventDefault();
  const fileInputs = document.getElementById('inputFile');
  const ul = dmRoom.querySelector('#newChats');
  // console.log('file input: ',fileInputs);
  // const fileName = fileInputs[0].name;
  // console.log('file name: ',fileName);
  const file = fileInputs.files[0];
  console.log(file);
  const data = new FormData();

  data.append('file', file);

  const dmRoomName = dmRoom.querySelector('h3').textContent;
  const dmRoomId = dmRoomName.split(' ')[1];

  //TODO: 아래 fetch에서 400 bad request
  fetch(`http://localhost:3000/dm/file?dmRoomId=${dmRoomId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: data,
    credentials: 'include',
  })
    .then(res => {
      res.json();
    })
    .then(json => {
      console.log(json.filePath);
    })
    .catch(err => {
      console.error('이미지 채팅 진행 중의 오류: ', err);
    });
}

function createElement(e, file) {
  const li = document.createElement('li');
  const img = document.createElement('img');
  img.setAttribute('src', e.target.result);
  img.setAttribute('data-file', file.name);
  li.appendChild(img);
}

function showRooms() {
  socket.emit('dmRoomList');

  socket.on('rooms', function (data) {
    updateRoomList(data);
  });
}

function updateRoomList(data) {
  const dmRoomIds = data.map(dmRoom => {
    return dmRoom.id;
  });

  const nicknames = data.map(dmRoom => {
    return dmRoom.nickname;
  });
  data.forEach(e => {
    // 아이디별로 list, 입장하기 버튼 생성
    $('#rooms').append(`<li id=${e.id}>${e.nickname} <button id='enter'>입장하기</button></li>`);
  });
}

showRooms();

$(document).on('click', '#rooms li button', function () {
  const liId = $(this).closest('li').attr('id');
  joinDM(liId);
});

function joinDM(room) {
  dmRoom.hidden = false;
  dmMain.hidden = true;
  $('#room').html('');
  $('#room').append(`<h3>DMRoom: ${room}</h3>`);

  socket.emit('joinDM', room);

  history(+room);

  function prepare() {
    window.setTimeout(scrollUI, 50);
  }

  prepare();
}

function scrollUI() {
  const chatUI = document.querySelector('#newChats');
  chatUI.scrollTop = chatUI.scrollHeight;
}

socket.on('welcome', data => {
  const { nickname, dmRoomId } = data;

  showExist(`${nickname}님이 입장했습니다.`);
});

socket.on('bye', data => {
  const { nickname, dmRoomId } = data;

  showExist(`${nickname}이 퇴장했습니다.`);
});

socket.on('message', data => {
  const { nickname, content, time } = data;

  sendDM(`${nickname}:${content} ${time}`);

  function prepare() {
    window.setTimeout(scrollUI, 50);
  }

  prepare();
});

function history(dmRoomId) {
  fetch(`http://localhost:3000/dm/history/${dmRoomId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then(res => res.json())
    .then(data =>
      data.map(chat => {
        sendDM(`${chat.us_nickname}:${chat.chat_content} ${chat.chat_created_at}`);
      }),
    )
    .catch(err => console.error('채팅 내역 가져오는데 오류 발생: ', err));
}

socket.on('userDisconnected', () => {
  alert('소켓 연결이 종료되었습니다. 로그인을 다시 해주세요.');

  window.location.href = 'http://localhost:3000/user/login';
});
