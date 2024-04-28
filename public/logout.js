const token = window.localStorage.getItem('authorization');

function logout() {
  fetch('http://chuncik.store:3000/user/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then(res => {
      if (res.status === 201) {
        window.localStorage.removeItem('authorization');

        alert('로그아웃 성공');

        window.location.href = 'http://chuncik.store:3000/main';
      } else {
        alert('로그아웃 실패');
      }
    })
    .catch(error => console.error('Error:', error));
}

document.getElementById('logout').addEventListener('click', logout);
