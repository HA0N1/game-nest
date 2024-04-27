document.addEventListener('DOMContentLoaded', function () {
  const commentForm = document.getElementById('commentForm');
  const commentList = document.getElementById('commentList');
  const gameId = window.location.pathname.split('/')[2];

  commentForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const content = document.getElementById('commentContent').value;

    if (!content) {
      alert('댓글을 입력해주세요.');
      return;
    }

    fetch(`/${gameId}/comment`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
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
    fetch(`/${gameId}/comments`)
      .then(response => response.json())
      .then(data => {
        commentList.innerHTML = '';
        data.forEach(comment => {
          const li = document.createElement('li');
          li.textContent = comment.content;
          commentList.appendChild(li);
        });
      })
      .catch(error => {
        console.error('댓글 목록 로딩 중 오류 발생:', error);
      });
  }

  loadComments();
});

async function updateComment(gameId, commentId, content) {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`/${gameId}/comment/${commentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error('댓글 수정에 실패했습니다.');
    }

    const data = await response.json();
    console.log('댓글이 수정되었습니다:', data);
  } catch (error) {
    console.error('댓글 수정 중 오류가 발생했습니다:', error);
  }
}
