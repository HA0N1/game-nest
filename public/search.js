const searchResults = document.getElementById('searchResults');
searchResults.hidden = true;

document.addEventListener('DOMContentLoaded', function () {
  const searchButton = document.getElementById('searchButton');
  searchButton.addEventListener('click', function () {
    searchResults.hidden = false;

    const query = document.getElementById('searchInput').value;
    fetch(`/games/search?query=${query}`)
      .then(response => response.json())
      .then(data => {
        const gameList = document.getElementById('gameList');
        gameList.innerHTML = '';

        const resultsList = document.getElementById('resultsList');
        resultsList.innerHTML = '';

        if (data.length === 0) {
          const noResultItem = document.createElement('li');
          noResultItem.textContent = '검색 결과가 없습니다.';
          resultsList.appendChild(noResultItem);
        } else {
          data.forEach(game => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
              <a href="http://localhost:3000/game/${game.id}">${game.title}
                <img src="${game.screen_shot}" alt="${game.title} screenshot" />
              </a>
            `;
            resultsList.appendChild(listItem);
          });
        }
      })
      .catch(error => console.error('Error:', error));
  });
});
