document.addEventListener('DOMContentLoaded', function () {
  const popularButton = document.getElementById('popularButton');

  popularButton.addEventListener('click', function () {
    window.location.href = '/popular-game';
  });
})
