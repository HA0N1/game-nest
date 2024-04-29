const signUp = document.getElementById('sign-up');
const login = document.getElementById('login');
const channel = document.getElementById('channel');
const dm = document.getElementById('dm');
const profile = document.getElementById('profile');
const post = document.getElementById('post');

signUp.addEventListener('click', goSignup);
login.addEventListener('click', goLogin);
channel.addEventListener('click', goChannel);
dm.addEventListener('click', goDM);
profile.addEventListener('click', goProgile);
post.addEventListener('click', goPost);

window.onload = function () {
  checkLoginStatus();
};

function checkLoginStatus() {
  fetch('http://localhost:3000/user/checkLogin', {
    method: 'GET',
  })
    .then(res => {
      return res.json();
    })
    .then(json => {
      if (json.isLoggedIn) {
        showLoggedInUI();
      } else {
        showLoggedOutUI();
      }
    })
    .catch(error => {
      console.error('mainPage checkLogin에서 일어난 에러: ', error);
    });
}

function showLoggedInUI() {
  document.getElementById('logout').style.display = 'block';
  document.getElementById('profile').style.display = 'block';
  document.getElementById('dm').style.display = 'block';
  document.getElementById('sign-up').style.display = 'none';
  document.getElementById('login').style.display = 'none';
}

function showLoggedOutUI() {
  document.getElementById('logout').style.display = 'none';
  document.getElementById('profile').style.display = 'none';
  document.getElementById('dm').style.display = 'none';
  document.getElementById('sign-up').style.display = 'block';
  document.getElementById('login').style.display = 'block';
}

function goSignup(event) {
  console.log('회원 가입');
  window.location.href = 'http://localhost:3000/user/sign-up';
}

async function goLogin(event) {
  console.log('로그인');
  window.location.href = 'http://localhost:3000/user/login';
}

function goChannel(event) {
  console.log('채널 입장');
  window.location.href = 'http://localhost:3000/channel/list';
}

function goDM(event) {
  console.log('dm 입장');
  window.location.href = 'http://localhost:3000/dm';
}

function goProgile(event) {
  console.log('프로필 이동');
  window.location.href = 'http://localhost:3000/user/userinfo';
}

function goPost(event) {
  console.log('커뮤니티 이동');
  window.location.href = 'http://localhost:3000/post/page';
}
