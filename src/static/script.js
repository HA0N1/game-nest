const socket = io('http://localhost:3000/chat');
socket.on('connect', () => {
  console.log('connected');
});
function sendMessage() {
  const message = $('#message').val();
  socket.emit('message', message);
}

socket.on('message', message => {
  $('#chat').append(`<div>${message}</div>`);
});
