import io from 'socket.io-client';

// 서버 주소와 포트에 맞게 수정해주세요
const socket = io('http://chunsik.store:3000/channel/chat', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
});

socket.on('connect', () => {
  console.log('서버에 연결되었습니다');
});

socket.on('receiveMessage', data => {
  console.log('메시지를 받았습니다:', data);
  // 받은 메시지를 처리하는 로직을 추가할 수 있습니다
});

// 방에 참여하는 로직
const joinRoom = (channelId, chatId) => {
  socket.emit('joinRoom', { channelId, chatId });
};

// 메시지를 보내는 로직
const sendMessage = (channelId, chatId, content, userId) => {
  socket.emit('sendMessage', { channelId, chatId, content, userId });
};

export { socket, joinRoom, sendMessage };
