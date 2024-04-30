const token = window.localStorage.getItem('authorization');

function logout() {
  fetch('https://chunsik.store/user/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then(res => {
      if (res.status === 201) {
        window.localStorage.removeItem('authorization');

        alert('로그아웃 성공');

        window.location.href = 'https://chunsik.store/main';
      } else {
        alert('로그아웃 실패');
      }
    })
    .catch(error => console.error('Error:', error));
}

document.getElementById('logout').addEventListener('click', logout);
