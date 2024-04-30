document.addEventListener('DOMContentLoaded', function () {
  const popularButton = document.getElementById('popularButton');

  popularButton.addEventListener('click', function () {
    window.location.href = '/popular-game';
  });

  let currentPage = 1;

  async function fetchPopularGames(page) {
    try {
      const response = await fetch(`http://localhost:3000/games/popularGames?page=${page}`);
      if (!response.ok) {
        throw new Error('서버에서 데이터를 불러오는데 실패했습니다.');
      }
      const popularGames = await response.json();
      displayPopularGames(popularGames.data);
      updatePaginationState({
        count: popularGames.count,
        page: popularGames.page,
        limit: popularGames.limit,
      });
    } catch (error) {
      console.error('인기 게임을 불러오는 중 오류 발생:', error);
    }
  }

  function displayPopularGames(popularGames) {
    const gamesContainer = document.getElementById('popular-games');
    gamesContainer.querySelectorAll('.game').forEach(game => game.remove());

    popularGames.data.forEach(game => {
      const gameElement = document.createElement('div');
      gameElement.className = 'game';
      gameElement.innerHTML = `
          <p>
            <span class='rank'>${game.rank}위</span>
            <span class='title'>${game.title}</span>
          </p>
          <img src='${game.screen_shot}' alt='${game.title}' />
        `;
      gamesContainer.appendChild(gameElement);
    });

    // 페이지네이션 상태 업데이트
    updatePaginationState(popularGames);
  }
  prevButton.addEventListener('click', function () {
    if (currentPage > 1) {
      fetchPopularGames(--currentPage);
    }
  });

  nextButton.addEventListener('click', function () {
    fetchPopularGames(++currentPage);
  });

  fetchPopularGames(currentPage);
});
document.getElementById('nextPageButton').addEventListener('click', function () {
  const currentPage = getCurrentPage();
  const nextPage = currentPage + 1;
  loadPageData(nextPage);
});

function loadPageData(page) {
  updatePaginationState(page);
}
