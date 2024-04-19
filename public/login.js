// import axios from 'axios';
let token = '';
const email = $('#email').val();
const password = $('#password').val();

fetch('http://localhost:3000/user/email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email: email, password: password }),
})
  .then(res => {
    if (res.status === 201) {
      alert('로그인 성공');
      const cookieHeader = res.headers.get('Set-Cookie');
      if (cookieHeader) {
        token = cookieHeader.split(';')[0]; // 쿠키 값 가져오기
      }
      window.location.href = 'channel';
    } else {
      alert('로그인 실패');
    }
  })
  .catch(error => console.error('Error:', error));
