document.addEventListener('DOMContentLoaded', function () {
  const newButton = document.getElementById('newButton');

  newButton.addEventListener('click', function () {
    window.location.href = '/new-game';
  });
});
