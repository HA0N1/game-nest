document.getElementById('create').addEventListener('click', function (event) {
  event.preventDefault();
  signUp();
});

document.getElementById('gotoMain').addEventListener('click', gotoMain);

document.getElementById('reset').addEventListener('click', function (event) {
  event.preventDefault();
  gotoMain();
});

document.getElementById('checkEmail').addEventListener('click', function (event) {
  event.preventDefault();
  checkEmail();
});

function gotoMain() {
  window.location.href = 'https://chunsik.store/main';
}

function checkEmail() {
  const email = document.getElementById('email').value;
  if (!email) {
    alert('이메일을 입력해주세요.');
    window.location.href = window.location.href;
  } else {
    fetch('https://chunsik.store/user/checkEmail', {
      method: 'Post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email }),
    })
      .then(res => {
        if (res.status === 201) {
          return res.json();
        } else {
          console.log(res);
          alert('이메일 확인 중 문제가 발생했습니다.');
        }
      })
      .then(json => {
        if (json.isExist) {
          alert('해당 이메일로 가입한 사용자가 있습니다.');
          window.location.reload(true);
        } else {
          alert('사용 가능한 이메일입니다.');
        }
      })
      .catch(error => {
        console.error('이메일 확인 중의 문제: ', error);
      });
  }
}

function signUp() {
  const email = document.getElementById('email').value;
  const nickname = document.getElementById('nickname').value;
  const password = document.getElementById('password').value;
  const checkPw = document.getElementById('checkPw').value;
  const query = 'input[name="genre"]:checked';
  const selectedGenres = document.querySelectorAll(query);

  let result = '';
  selectedGenres.forEach(el => {
    result += el.value + ' ';
  });

  const interestGenres = result.split(' ');
  interestGenres.pop();

  // console.log(typeof email, typeof nickname, typeof password, typeof checkPw); // test1@gmail.com 123 123 213
  // console.log('checkbox: ', interestGenres, typeof interestGenres); //['3', '4'] object

  fetch('https://chunsik.store/user/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      nickname: nickname,
      password: password,
      passwordCheck: checkPw,
      interestGenre: interestGenres,
    }),
  })
    .then(res => {
      console.log(res);
      if (res.status === 201) {
        return res.json();
      } else {
        alert('회원가입 실패');
      }
    })
    .then(json => {
      alert(json.message);

      window.location.href = 'https://chunsik.store/main';
    })
    .catch(error => {
      if ((error.code = 409)) {
        console.error('회원가입 에러: ', error);
        alert('회원가입 필수 칸들을 작성하셨는지, 중복 이메일인지, 이메일 형식이 맞는지 확인해주세요.');
        window.location.reload(true);
      } else if ((error.code = 400)) {
        console.error('비밀번호와 비밀번호 확인이 다릅니다.');
        alert('비밀번호와 비밀번호 확인이 다릅니다.');
        window.location.reload(true);
      }
    });
}
