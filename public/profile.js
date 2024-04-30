const token = window.localStorage.getItem('authorization');
const profileImage = document.getElementById('profileImage');
const nickname = document.getElementById('nickname');
const email = document.getElementById('email');
const userId = document.getElementById('userId');
const interestGenres = document.getElementById('interestGenres');
const dmBtn = document.getElementById('dmBtn');
const findFriends = document.getElementById('findFriends');
const registerFriends = document.getElementById('registerFriend');

window.onload = function () {
  checkLoginStatus();
  UserProfiles();
};

dmBtn.addEventListener('click', function () {
  window.location.href = 'https://chunsik.store:3000/dm';
});

findFriends.addEventListener('click', function () {
  window.location.href = 'https://chunsik.store:3000/user/findFriends';
});

registerFriends.addEventListener('click', function () {
  window.location.href = 'https://chunsik.store:3000/user/getFriends';
});

function checkLoginStatus() {
  fetch('https://chunsik.store:3000/user/checkLogin', {
    method: 'GET',
  })
    .then(res => {
      if ((res.status = 200)) {
        return;
      } else {
        alert('로그인을 하지 않은 유저입니다. 쿠키를 확인해주십시오.');
        window.location.href = 'https://chunsik.store:3000/main';
      }
    })
    .catch(error => {
      console.error('Profile checkLogin에서 일어난 에러: ', error);
    });
}

function UserProfiles() {
  fetch('https://chunsik.store:3000/user/userinfo', {
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
      const filePath = json.file;
      const returnNickname = json.nickname;
      const returnId = json.id;
      const returnEmail = json.email;
      const returnInterestGenre = json.interestGenre;

      function showImage(filePath) {
        const img = document.createElement('img');
        img.setAttribute('src', filePath);
        img.setAttribute('alt', '프로필 이미지');
        profileImage.appendChild(img);
        return;
      }

      function setNickname(input) {
        const p = document.createElement('p');
        p.innerText = input;
        nickname.appendChild(p);
        return;
      }

      function setEmail(input) {
        const p = document.createElement('p');
        p.innerText = input;
        email.appendChild(p);
        return;
      }

      function setUserId(input) {
        const p = document.createElement('p');
        p.innerText = input;
        userId.appendChild(p);
        return;
      }

      //TODO interestGenre도 나타나도록 함수 구현하기
      function setInterestGenres(input) {}

      showImage(filePath);
      setNickname(returnNickname);
      setEmail(returnEmail);
      setUserId(returnId);
    })
    .catch(err => {
      console.log('profile userinfo 연결 중의 에러: ', err);
    });
}
