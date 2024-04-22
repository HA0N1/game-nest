// import axios from 'axios';
let token = '';

function login(){
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
  console.log(res);
  if (res.status === 201) {
    alert('로그인 성공');
    window.location.href = 'http://localhost:3000/main';
  } else {
    alert('로그인 실패');
  }
})
.catch(error => console.error('Error:', error));} 

document.getElementById('loginBtn').addEventListener('click', login);