const token = window.localStorage.getItem('authorization');

const toMain = document.getElementById('toMain');
toMain.addEventListener('click', function(){window.location.href='http://localhost:3000/main'});
const toProfile = document.getElementById('toProfile');
toProfile.addEventListener('click', function(){window.location.href = 'http://localhost:3000/user/profile'})

const toDM = document.getElementById('toDM');
toDM.addEventListener('click', function(){window.location.href = 'http://localhost:3000/dm'})

const friends = document.getElementById('friends')
const sendFriend = document.getElementById('sendFriend');
sendFriend.addEventListener('click', function(){window.location.href='http://localhost:3000/friend/sendFriend'})

const receiveFriend = document.getElementById('receiveFriend');
receiveFriend.addEventListener('click', function(){window.location.href='http://localhost:3000/friend/friendRequest'})

window.onload = function(){
    loadFriends()
}

function loadFriends(){
    fetch('http://localhost:3000/friend/find',{
        method:'GET',
        headers: {
            Authorization: `Bearer ${token}`,
          },
        credentials:'include'
    })
    .then(res=>{return res.json()})
    .then(json=>{
        json.map(e=>{
            makeBox(e.friendshipId, e.friendId, e.friendEmail, e.friendNickname);
        })
    })
    .catch(err=>{
        console.error('친구 조회 중의 에러: ', err)
    })
}

function makeBox(relationId, id, email, nickname){
$('#friends').append(`<li id=${relationId}>${nickname}<br>${id}, ${email} <button id='delete'>친구 취소</button></li>`)
}