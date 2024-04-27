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
      const channelGenre = channel.dataset.genre;
      if (!selectedGenre || selectedGenre === channelGenre) {
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
});
