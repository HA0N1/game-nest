document.addEventListener('DOMContentLoaded', () => {
  const channelSearch = document.getElementById('channelSearch');
  const genreFilter = document.getElementById('genreFilter');
  const modal = document.getElementById('channelCreationModal');
  const createChannelButton = document.getElementById('createChannelButton');
  const closeButton = document.querySelector('.close-button');
  const createChannel = document.getElementById('createChannel');
  const channelNameInput = document.getElementById('name');
  const gameIdInput = document.getElementById('gameId');
  const token = window.localStorage.getItem('authorization');

  window.onload = function () {
    checkLogin();
  };

  function checkLogin() {
    if (!token) {
      alert('로그인을 하셔야 이용할 수 있는 서비스입니다.');
      window.location.href = 'https://chunsik.store/user/login';
    }
  }
  // Search functionality
  // Search functionality
  channelSearch.addEventListener('input', () => {
    const searchValue = channelSearch.value.trim().toLowerCase();
    const channels = document.querySelectorAll('.channel');

    channels.forEach(channel => {
      const channelName = channel.textContent.toLowerCase();
      const channelGenre = channel.dataset.genre.toLowerCase();
      // 채널 이름 또는 장르가 검색어를 포함하는 경우에만 표시
      if (channelName.includes(searchValue) || channelGenre.includes(searchValue)) {
        channel.style.display = 'block';
      } else {
        channel.style.display = 'none';
      }
    });
  });

  // Genre filter functionality
  genreFilter.addEventListener('change', () => {
    const selectedGenre = genreFilter.value;
    const channels = document.querySelectorAll('.channel');

    channels.forEach(channel => {
      const channelGenreId = channel.dataset.genre; // 장르 번호를 가져옴
      const channelGenreName = getGenreName(channelGenreId); // 번호에 해당하는 장르명을 가져옴
      // 선택한 장르와 채널의 장르명이 일치하는 경우에만 표시
      if (!selectedGenre || selectedGenre === channelGenreName) {
        channel.style.display = 'block';
      } else {
        channel.style.display = 'none';
      }
    });
  });

  // '채널 생성' 버튼 클릭 이벤트
  createChannelButton.onclick = function () {
    modal.style.display = 'block';
  };

  // 닫기 버튼 클릭 이벤트
  closeButton.onclick = function () {
    modal.style.display = 'none';
  };

  // 모달 창 바깥 영역 클릭 시 모달 닫기
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  };
  // 채널 생성 함수
  function sendCreateChannelRequest(name, gameId) {
    fetch('/channel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        gameId,
      }),
    })
      .then(response => response.json())
      .then(data => {
        alert(data.message); // 성공 메시지 알림
        modal.style.display = 'none'; // 모달 창 닫기
        location.reload(true); // 새로고침해서 채널 목록 불러오기
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }

  // '채널 생성' 모달에서 '채널 생성' 버튼 클릭 이벤트
  createChannel.onclick = function () {
    const name = channelNameInput.value.trim();
    const gameId = gameIdInput.value.trim();

    if (name && gameId) {
      sendCreateChannelRequest(name, gameId); // 채널 생성 요청 함수 호출
    } else {
      alert('채널 이름과 게임 ID를 입력해주세요.');
    }
  };

  document.querySelectorAll('.channel a').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault(); // Prevent default behavior of link click
      const channelId = link.closest('.channel').dataset.id; // Get the channel ID
      window.location.href = `/channel/${channelId}/chat`; // Redirect to the chat room page with the channel ID
    });
  });
  // 장르 매핑
  function getGenreName(genreId) {
    switch (parseInt(genreId)) {
      case 1:
        return 'Action';
      case 2:
        return 'RPG';
      case 3:
        return 'Adventure';
      case 4:
        return 'Strategy';
      case 5:
        return 'Simulation';
      case 6:
        return 'Casual';
      case 7:
        return 'Indie';
      case 8:
        return 'Sports';
      case 9:
        return 'Racing';
      default:
        return '';
    }
  }
});
