const token = window.localStorage.getItem('authorization');

const toMain = document.getElementById('toMain');
toMain.addEventListener('click', function () {
  window.location.href = 'https://chunsik.store/main';
});
const toProfile = document.getElementById('toProfile');
toProfile.addEventListener('click', function () {
  window.location.href = 'https://chunsik.store/user/profile';
});

const toDM = document.getElementById('toDM');
toDM.addEventListener('click', function () {
  window.location.href = 'https://chunsik.store/dm';
});

const friends = document.getElementById('friends');
const sendFriend = document.getElementById('sendFriend');
sendFriend.addEventListener('click', function () {
  window.location.href = 'https://chunsik.store/friend/sendFriend';
});

const receiveFriend = document.getElementById('receiveFriend');
receiveFriend.addEventListener('click', function () {
  window.location.href = 'https://chunsik.store/friend/friendRequest';
});

window.onload = function () {
  loadFriends();
};

function loadFriends() {
  fetch('https://chunsik.store/friend/find', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
  })
    .then(res => {
      return res.json();
    })
    .then(json => {
      json.map(e => {
        makeBox(e.friendshipId, e.friendId, e.friendEmail, e.friendNickname);
      });
    })
    .catch(err => {
      console.error('친구 조회 중의 에러: ', err);
    });
}

function makeBox(relationId, id, email, nickname) {
  $('#friends').append(
    `<li id=${relationId}>${nickname}<br>${id}, ${email} <button id='delete'>친구 취소</button></li>`,
  );
}

function makeBox(relationId, id, email, nickname) {
  $('#friends').append(
    `<li id=${relationId}>${nickname}<br>${id}, ${email} <button id='dmRoom'>채팅방</button> <button id='delete'>친구 취소</button></li>`,
  );
}

$(document).on('click', '#dmRoom', function () {
  const relationshipId = $(this).closest('li').attr('id');
  fetch(`https://chunsik.store/dm/create/${relationshipId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
  })
    .then(res => {
      return res.json();
    })
    .then(json => {
      alert(json.message);
      window.location.href = 'https://chunsik.store/dm';
    })
    .catch(err => {
      console.error('DMRoom 생성: ', err);
    });
});
