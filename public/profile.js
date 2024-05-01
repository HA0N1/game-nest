const token = window.localStorage.getItem('authorization');
const profileImage = document.getElementById('profileImage');
const nickname = document.getElementById('nickname');
const email = document.getElementById('email');
const userId = document.getElementById('userId');
const interestGenres = document.getElementById('interestGenres');
const dmBtn = document.getElementById('dmBtn');
const findFriends = document.getElementById('findFriends');
const registerFriends = document.getElementById('registerFriend');
const changeImage = document.getElementById('changeImage');
const originalImage = document.getElementById('originalImage');

// const imageBox = document.querySelector('#imageBox');
// imageBox.style.display = 'none';

window.onload = function () {
  checkLoginStatus();
  UserProfiles();
};


const imageWrapper = document.getElementById('imageWrapper');
imageWrapper.style.display='none';

changeImage.addEventListener('click', changeProfileImage)

dmBtn.addEventListener('click', function () {
  window.location.href = 'https://chunsik.store/dm';
});

findFriends.addEventListener('click', function () {
  window.location.href = 'https://chunsik.store/friend/findFriends';
});

registerFriends.addEventListener('click', function () {
  window.location.href = 'https://chunsik.store/friend/sendFriend';
});

function checkLoginStatus() {
  fetch('https://chunsik.store/user/checkLogin', {
    method: 'GET',
  })
    .then(res => {
      if ((res.status = 200)) {
        return;
      } else {
        alert('로그인을 하지 않은 유저입니다. 쿠키를 확인해주십시오.');
        window.location.href = 'https://chunsik.store/main';
      }
    })
    .catch(error => {
      console.error('Profile checkLogin에서 일어난 에러: ', error);
    });
}

function UserProfiles() {
  fetch('https://chunsik.store/user/userinfo', {
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
      console.log(returnInterestGenre);

      function showImage(filePath) {
        const img = document.createElement('img');
        img.setAttribute('src', filePath);
        img.setAttribute('alt', '프로필 이미지');
        profileImage.appendChild(img);
        return;
      }

      function setNickname(input) {
        const p = document.createElement('p');
        p.innerText = `닉네임: ${input}`;
        nickname.appendChild(p);
        return;
      }

      function setEmail(input) {
        const p = document.createElement('p');
        p.innerText = `이메일: ${input}`;
        email.appendChild(p);
        return;
      }

      function setUserId(input) {
        const p = document.createElement('p');
        p.innerText = `아이디: ${input}`;
        userId.appendChild(p);
        return;
      }

      function setInterestGenres(input) {
        input.map(e=>{
          const ul = document.createElement('ul');
          ul.innerText = e;
          interestGenres.appendChild(ul);
          return;

        })
      }

      showImage(filePath);
      setNickname(returnNickname);
      setEmail(returnEmail);
      setUserId(returnId);
      setInterestGenres(returnInterestGenre);
    })
    .catch(err => {
      console.log('profile userinfo 연결 중의 에러: ', err);
    });
}

function changeProfileImage(event){
  event.preventDefault();
  imageWrapper.style.display='block';
}

fileBtn.addEventListener('click', sendImage);

function sendImage(event){
  event.preventDefault();
const idData = document.querySelector("#userId p");
const text = idData.textContent;

const idValue = text.replace('아이디: ','');

const userId = +idValue

const fileBtn = document.getElementById('fileBtn');

const inputFile = document.getElementById('inputFile');
const file = inputFile.files[0];
const data = new FormData();

data.append('filePath', file);

fetch(`https://chunsik.store/user/image?userId=${userId}`,{
  method:'PATCH',
  body: data,
  credentials: 'include'
})
.then(res=>{
  return res.json();
})
.then(json=>{
  alert(json.message);
  location.reload(true);
})
.catch(err=>{
  console.error('프로필 이미지 변경 중의 에러: ', err);
})
}

originalImage.addEventListener('click', goOriginalImage);

function goOriginalImage(event){
  event.preventDefault();
 
  fetch('https://chunsik.store/user/defaultImage',{
    method:'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
  })
  .then(res=>{return res.json()})
  .then(json=>{
    alert(json.message);
    location.reload(true);
  })
  .catch(err=>{
    console.error('기본 이미지로 변경 중의 에러: ', err);
  })
  
}