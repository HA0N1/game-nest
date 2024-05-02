function login() {
  const email = $('#email').val();
  const password = $('#password').val();
  fetch('https://chunsik.store/user/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: email, password: password }),
  })
    .then(res => {
      if (res.status === 201) {
        alert('로그인 성공');
        return res.json();
      } else {
        alert('로그인 실패');
      }
    })
    .then(json => {
      const token = json.accessToken;
      window.localStorage.setItem('authorization', token);

      window.location.href = 'https://chunsik.store/main';
    })
    .catch(error => console.error('Error:', error));
}

document.getElementById('loginBtn').addEventListener('click', login);

document.getElementById('toMain').addEventListener('click',function(){
  window.location.href = 'https://chunsik.store/main'
})