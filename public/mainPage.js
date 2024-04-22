let isLogin;

    const signUp = document.getElementById('sign-up');
    const login = document.getElementById('login');
    const channel = document.getElementById('channel');
    const dm = document.getElementById('dm');

    if (isLogin) {
      signUp.hidden = true;
      login.hidden = true;
      channel.hidden = false;
      dm.hidden = false;
    } else {
      signUp.hidden = false;
      login.hidden = false;
      channel.hidden = true;
      dm.hidden = true;
    }

    signUp.addEventListener('click', goSignup);
    login.addEventListener('click', goLogin);
    channel.addEventListener('click', goChannel);
    dm.addEventListener('click', goDM);
    const token = document.cookie;

    function checkLogin() {
      // TODO: token 받아오고 변경 적용하기
      console.log(token.includes());
      if (!token) {
        isLogin = false;
      } else {
        isLogin = true;
      }
    }

    function goSignup(event) {
      console.log('회원 가입');
      window.location.href = 'signUP';
    }

    function goLogin(event) {
      console.log('로그인');
      window.location.href = 'http://localhost:3000/user/login';

      checkLogin();

    }

    function goChannel(event) {
      console.log('채널 입장');
      window.location.href = 'chat';
    }

    function goDM(event) {
      console.log('dm 입장');
      window.location.href = 'http://localhost:3000/dm';
    }