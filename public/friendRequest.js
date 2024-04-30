const token = window.localStorage.getItem('authorization');
const toMain = document.getElementById('toMain');
toMain.addEventListener('click', function(){window.location.href='http://localhost:3000/main'});
const toFriends = document.getElementById('toFriends');
toFriends.addEventListener('click', function(){window.location.href = 'http://localhost:3000/friend/findFriends'});
const toProfile = document.getElementById('toProfile');
toProfile.addEventListener('click', function(){window.location.href='http://localhost:3000/user/profile'})