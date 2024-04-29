const genreMapping = {
  Adventure: 1,
  RPG: 2,
  Action: 3,
  Strategy: 4,
  Simulation: 5,
  Casual: 6,
  Indie: 7,
  Racing: 8,
  Sports: 9,
};

document.addEventListener('DOMContentLoaded', function () {
  const genreButton = document.getElementById('genreButton');
  const genreSelect = document.getElementById('genreSelect');

  genreButton.addEventListener('click', function () {
    genreSelect.style.display = 'block';
  });

  const genreSubmit = document.getElementById('genreSubmit');
  genreSubmit.addEventListener('click', function () {
    const selectedGenreName = document.getElementById('genreDropdown').value;
    const genreId = genreMapping[selectedGenreName];

    if (genreId) {
      window.location.href = `https://chunsik.store/genre/${genreId}`;
    }
  });
});
