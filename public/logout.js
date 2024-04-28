const token = window.localStorage.getItem('authorization');

<<<<<<< HEAD
function logout() {
  fetch('http://localhost:3000/user/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then(res => {
      if (res.status === 201) {
        window.localStorage.removeItem('authorization');
=======
function logout(){
    fetch('http://chuncik.store:3000/user/logout',{
        method:'POST',
        headers:{
            Authorization:`Bearer ${token}`
        }
    })
    .then(res=>{
        if(res.status === 201){
            window.localStorage.removeItem('authorization');
>>>>>>> 9ab53e4e3d3e1e8e083dc28f2584a168e6d1a9ef

        alert('로그아웃 성공');

<<<<<<< HEAD
        window.location.href = 'http://localhost:3000/main';
      } else {
        alert('로그아웃 실패');
      }
=======
            window.location.href = 'http://chuncik.store:3000/main';
        }else{
            alert('로그아웃 실패');
        }
>>>>>>> 9ab53e4e3d3e1e8e083dc28f2584a168e6d1a9ef
    })
    .catch(error => console.error('Error:', error));
}

document.getElementById('logout').addEventListener('click', logout);
