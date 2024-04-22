const token = document.cookie;

const socket = io('http://localhost:3000/friendDM',{ auth: { token: token } });

const dmMain = document.getElementById('dmMain');
const rooms = dmMain.querySelector('#rooms');
const dmRoom = document.getElementById('dmRoom');
dmRoom.hidden = true;

const messageForm = dmRoom.querySelector('#message');
messageForm.addEventListener('submit', handleDMSubmit);

let currentRoom = '';

const toMain = document.getElementById('toMain');
toMain.addEventListener('click', toDMRooms);

function toDMRooms() {
  sayBye();
  dmRoom.hidden = true;
  dmMain.hidden = false;
}

function sayBye() {
  const room = document.querySelector('#room h3');
  const inTitle = room.innerText;
  const dmRoomId = inTitle.split(' ')[1];
  socket.emit('sayBye', dmRoomId);
  const message = document.querySelector('#dmRoom ul li');
  console.log(message);
}

function goBack() {
  window.location.href = 'main.html';
}

socket.on('dmRoomsList', function () {
  socket.emit('dmRoomList');
});

function sendDM(message, dmRoomId) {
  const ul = dmRoom.querySelector('ul');
  const li = document.createElement('li');
  li.innerText = message;
  ul.appendChild(li);
}

function handleDMSubmit(event) {
  event.preventDefault();
  const input = dmRoom.querySelector('#message input');
  const value = input.value;

  const dmRoomName = dmRoom.querySelector('h3').textContent;
  const dmRoomId = dmRoomName.split(' ')[1];

  const data = { value, dmRoomId };

  socket.emit('sendMessage', data);
  // sendDM(`나: ${value}`);
  input.value = '';
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

$(document).on('click','#rooms li button',function(){const liId=$(this).closest('li').attr('id'); joinDM(liId)})

function joinDM(room) {
  // currentRoom = room;
  dmRoom.hidden = false;
  dmMain.hidden = true;
  $('#room').html('');
  $('#room').append(`<h3>DMRoom: ${room}</h3>`);
  console.log('프론드 join: ', room);
  socket.emit('joinDM', room);
}

socket.on('welcome', data => {
  const { user, dmRoomId } = data;

  sendDM(`${user.nickname}님이 입장했습니다.`, dmRoomId);
});

socket.on('bye', data => {
  const { user, dmRoomId } = data;
  const h3 = dmRoom.querySelector('h3');
  sendDM(`${user.nickname}이 퇴장했습니다.`, dmRoomId);
});

socket.on('message', data => {
  const { dmRoomId, nickname, content } = data;

  sendDM(`${nickname}:${content}`, dmRoomId);
});

// socket.on('DMRoom_change', dmRooms => {
//   const dmRoomList = dmMain.querySelector('ul');
//   dmRoomList.innerHTML = '';
//   if (dmRooms.length === 0) {
//     dmRoomList.innerHTML = '';
//     return;
//   }

//   dmRooms.forEach(room => {
//     const li = document.createElement('li');
//     li.innerText = room;
//     dmRoomList.append(li);
//   });
// });