document.getElementById('create').addEventListener('click', function(event){event.preventDefault(); signUp()});

document.getElementById('gotoMain').addEventListener('click', gotoMain);

document.getElementById('reset').addEventListener('click',function(event){event.preventDefault(); gotoMain()});

function gotoMain(){
    window.location.href = 'http://localhost:3000/main'
}

function signUp(){
    const email = document.getElementById('email').value;
    const nickname = document.getElementById('nickname').value;
    const password = document.getElementById('password').value;
    const checkPw = document.getElementById('checkPw').value;
    const query = 'input[name="genre"]:checked';
    const selectedGenres = document.querySelectorAll(query);

    let result = '';
    selectedGenres.forEach((el)=>{
        result += el.value + ' ';
    })

    const interestGenres = result.split(' ');
    interestGenres.pop();

    // console.log(typeof email, typeof nickname, typeof password, typeof checkPw); // test1@gmail.com 123 123 213
    // console.log('checkbox: ', interestGenres, typeof interestGenres); //['3', '4'] object

    fetch('http://localhost:3000/user/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
          },
        body: JSON.stringify({email: email, nickname: nickname, password: password, passwordCheck: checkPw, interestGenre: interestGenres})
    })
    .then(res=>{
        console.log(res);
        if (res.status === 201) {
            return res.json();
          } else {
            alert('회원가입 실패');
          }
    })
    .then(json=>{
        alert(json.message);

        window.location.href = 'http://localhost:3000/main';
    })
    .catch(error =>{
        if(error.code = 409){
            console.error('이미 해당 이메일로 가입한 사용자가 있습니다.')
            alert('이미 해당 이메일로 가입한 사용자가 있습니다.')
            window.location.reload(true);
        }else if(error.code = 400){
            console.error('비밀번호와 비밀번호 확인이 다릅니다.')
            alert('비밀번호와 비밀번호 확인이 다릅니다.')
            window.location.reload(true);
        }
    })
}