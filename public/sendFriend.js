const token = window.localStorage.getItem('authorization');
const toMain = document.getElementById('toMain');
toMain.addEventListener('click', function () {
  window.location.href = 'http://localhost:3000/main';
});
const toFriends = document.getElementById('toFriends');
toFriends.addEventListener('click', function () {
  window.location.href = 'http://localhost:3000/friend/findFriends';
});

const nickBtn = document.getElementById('nickBtn');
nickBtn.addEventListener('click', searchUsers);

const toFriendReq = document.getElementById('toFriendReq');
toFriendReq.addEventListener('click', function () {
  window.location.href = 'http://localhost:3000/friend/friendRequest';
});

function searchUsers() {
  const nickname = $('#nickname').val();
  fetch(`http://localhost:3000/user/findUser?input=${nickname}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(res => {
      return res.json();
    })
    .then(json => {
      json.map(e => {
        userBox(e.nickname, e.email);
      });
    });
}

function userBox(nickname, email) {
  $('#results').append(`<li id='${email}'>${nickname}<br>${email}<br> <button id='request'>친구 신청</button></li>`);
}

const requestBtn = document.getElementById('request');
$(document).on('click', '#results li button', function () {
  const email = $(this).closest('li').attr('id');
  sendFriendRequest(email);
});

function sendFriendRequest(sendEmail) {
  fetch('http://localhost:3000/friend/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email: sendEmail }),
  })
    .then(res => {
      return res.json();
    })
    .then(json => {
      alert(json.message);
    })
    .catch(err => {
      console.error('친구 신청 버튼 누를 때 에러: ', err);
    });
}
