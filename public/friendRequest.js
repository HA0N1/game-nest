const token = window.localStorage.getItem('authorization');
const toMain = document.getElementById('toMain');
toMain.addEventListener('click', function () {
  window.location.href = 'https://chunsik.store/main';
});
const toFriends = document.getElementById('toFriends');
toFriends.addEventListener('click', function () {
  window.location.href = 'https://chunsik.store/friend/findFriends';
});
const toProfile = document.getElementById('toProfile');
toProfile.addEventListener('click', function () {
  window.location.href = 'https://chunsik.store/user/profile';
});

window.onload = function () {
  checkRequests();
};

function checkRequests() {
  fetch('https://chunsik.store/friend/acceptFriends', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then(res => {
      return res.json();
    })
    .then(json => {
      console.log(json);
      json.map(e => {
        reqBox(e.me_id, e.us_nickname);
      });
    })
    .catch(err => {
      console.error('친구 요청 나열 중의 에러: ', err);
    });
}

function reqBox(relationId, friendNickname) {
  $('#requests').append(`<li id='${relationId}'>${friendNickname}의 친구 신청 <button>수락</button></li>`);
}

$(document).on('click', '#requests li button', function () {
  const relationshipId = $(this).closest('li').attr('id');
  acceptFriend(relationshipId);
});

function acceptFriend(relationshipId) {
  fetch(`https://chunsik.store/friend/accept?id=${relationshipId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then(res => {
      return res.json();
    })
    .then(json => {
      alert(json.message);
    })
    .catch(err => {
      console.error('친구 수락 중의 에러: ', err);
    });
}
