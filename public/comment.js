document.addEventListener('DOMContentLoaded', function () {
  const commentForm = document.getElementById('commentForm');
  const commentList = document.getElementById('commentList');
  const gameId = window.location.pathname.split('/')[2];
  const token = window.localStorage.getItem('authorization');
  if (!token) {
    alert('로그인이 필요합니다.');
    return;
  }

  commentForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const content = document.getElementById('commentContent').value;

    if (!content) {
      alert('댓글을 입력해주세요.');
      return;
    }

    fetch(`http://chuncik.store:3000/games/${gameId}/comment`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.message) {
          loadComments();
          document.getElementById('commentContent').value = '';
        }
      })
      .catch(error => {
        console.error('댓글 작성 중 오류 발생:', error);
      });
  });

  function loadComments() {
    fetch(`http://chuncik.store:3000/games/${gameId}/comment`)
      .then(response => response.json())
      .then(data => {
        commentList.innerHTML = '';

        data.forEach(comment => {
          const li = document.createElement('li');
          li.textContent = comment.content;

          const editButton = document.createElement('button');
          editButton.textContent = '수정';
          editButton.addEventListener('click', () => {
            const newContent = prompt('댓글을 수정하세요:', comment.content);
            if (newContent !== null && newContent !== '') {
              editComment(gameId, comment.id, newContent)
                .then(() => loadComments())
                .catch(error => alert.error('다른 사람의 댓글은 수정할 수 없습니다.', error));
            }
          });

          const deleteButton = document.createElement('button');
          deleteButton.textContent = '삭제';
          deleteButton.addEventListener('click', () => deleteComment(comment.id));

          li.appendChild(editButton);
          li.appendChild(deleteButton);

          commentList.appendChild(li);
        });
      });
  }

  loadComments();
});

async function editComment(gameId, commentId, content) {
  const token = localStorage.getItem('authorization');

  const response = await fetch(`http://chuncik.store:3000/games/${gameId}/comment/${commentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('다른 사람의 댓글은 수정할 수 없습니다.');
    } else {
      throw new Error('댓글 수정에 실패했습니다.');
    }
  }

  const data = await response.json();
  return data;
}
