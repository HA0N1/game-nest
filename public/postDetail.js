const postList = document.getElementById('post-list');
const token = window.localStorage.getItem('authorization');

async function fetchPosts(postId) {
  try {
    const response = await fetch(`https://chunsik.store/post/${postId}`);
    const post = await response.json();
    const liked = await likeStatus(postId);
    displayPosts(post, liked);
  } catch (error) {
    console.error('Error fetching post:', error);
  }
}

function displayPosts(post, liked) {
  const postItem = document.createElement('div');
  postItem.classList.add('post-item');

  const titleElement = document.createElement('h2');
  titleElement.textContent = `제목: ${post.title}`;
  postItem.appendChild(titleElement);

  const contentElement = document.createElement('p');
  contentElement.textContent = `내용: ${post.content}`;
  postItem.appendChild(contentElement);

  const categoryElement = document.createElement('p');
  categoryElement.textContent = `카테고리: ${post.category}`;
  postItem.appendChild(categoryElement);

  const viewCountElement = document.createElement('p');
  viewCountElement.textContent = `조회수: ${post.view_count}`;
  postItem.appendChild(viewCountElement);
  if (post.file && post.file.filePath) {
    if (post.file.filePath.includes('jpg')) {
      const imageElement = document.createElement('img');
      imageElement.src = post.file.filePath;
      imageElement.alt = 'Post Image';
      imageElement.width = 800;
      imageElement.height = 400;
      postItem.appendChild(imageElement);
    } else if (post.file.filePath.includes('mp4')) {
      const videoElement = document.createElement('video');
      videoElement.src = post.file.filePath;
      videoElement.controls = true;
      videoElement.width = 800;
      videoElement.height = 400;
      postItem.appendChild(videoElement);
    }
  }

  const likesElement = document.createElement('p');
  likesElement.textContent = `좋아요: ${post.likes}`;
  postItem.appendChild(likesElement);

  const likeButton = document.createElement('button');
  const unlikeButton = document.createElement('button');
  likeButton.textContent = '좋아요';
  if (liked) {
    likeButton.style.display = 'none';
    unlikeButton.textContent = '좋아요 취소';
    unlikeButton.addEventListener('click', () => unlike(post.id));
    postItem.appendChild(unlikeButton);
  } else {
    unlikeButton.style.display = 'none';
    likeButton.textContent = '좋아요';
    likeButton.addEventListener('click', () => like(post.id));
    postItem.appendChild(likeButton);
  }
  const updateButton = document.createElement('button');
  updateButton.textContent = '수정';
  updateButton.addEventListener('click', () => update(post.id));
  postItem.appendChild(updateButton);

  const removeButton = document.createElement('button');
  removeButton.textContent = '삭제';
  removeButton.addEventListener('click', () => remove(post.id));
  postItem.appendChild(removeButton);

  postList.appendChild(postItem);
  document.getElementById('gopost').addEventListener('click', function () {
    window.location.href = 'https://chunsik.store/post/page';
  });
  fetchComments(postId);
}

async function update(postId) {
  const updatedTitle = prompt('수정할 제목을 입력하세요:');
  const updatedContent = prompt('수정할 내용을 입력하세요:');
  const updatedCategory = prompt(
    '수정할 카테고리를 선택하세요: (talk, question, walkthrough, notice, pre-order, new game news)',
  );

  if (updatedTitle && updatedContent && updatedCategory) {
    try {
      const updateresponse = await fetch(`https://chunsik.store/post/${postId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({ title: updatedTitle, content: updatedContent, category: updatedCategory }),
      });

      const data = await updateresponse.json();
      window.location.reload();
    } catch (error) {
      console.error('Error updating post:', error);
    }
  } else {
    alert('제목, 내용, 카테고리를 모두 입력해야 합니다.');
  }
}

async function remove(postId) {
  try {
    const confirmDelete = confirm('정말로 이 게시글을 삭제하시겠습니까?');
    if (confirmDelete) {
      const deleteResponse = await fetch(`https://chunsik.store/post/${postId}?userId=${token}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await deleteResponse.json();
      window.location.href = 'https://chunsik.store/post/page';
    }
  } catch (error) {
    console.error('Error deleting post:', error);
  }
}

async function like(postId) {
  try {
    const response = await fetch(`https://chunsik.store/post/${postId}/like`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    window.location.reload();
  } catch (error) {
    console.error('Error toggling like:', error);
  }
}
async function unlike(postId) {
  try {
    const response = await fetch(`https://chunsik.store/post/${postId}/like`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    window.location.reload();
  } catch (error) {
    console.error('Error toggling unlike:', error);
  }
}
async function likeStatus(postId) {
  try {
    const response = await fetch(`https://chunsik.store/post/${postId}/liked`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const { liked } = await response.json();
    return liked;
  } catch (error) {
    console.error('Error toggling like status:', error);
  }
}
const path = window.location.pathname;

const pathParts = path.split('/');

const postId = pathParts[2];
fetchPosts(postId);

//댓글 작성
document.getElementById('comment-form').addEventListener('submit', async event => {
  event.preventDefault();
  const content = document.getElementById('comment-content').value;
  try {
    const response = await fetch(`https://chunsik.store/comment/${postId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
    const data = await response.json();
    console.log(data);
    fetchComments(postId);
    window.location.reload();
  } catch (error) {
    console.error('Error creating comment:', error);
  }
});
// 댓글 조회
async function fetchComments(postId) {
  try {
    const response = await fetch(`https://chunsik.store/comment/${postId}`);
    const comments = await response.json();
    displayComments(comments, postId);
  } catch (error) {
    console.error('Error fetching comments:', error);
  }
}

// 댓글 표시
function displayComments(comments, postId) {
  const commentList = document.getElementById('comment-list');
  commentList.innerHTML = '';
  comments.forEach(comment => {
    const commentItem = document.createElement('div');
    commentItem.classList.add('comment-item');
    commentItem.innerHTML = `
        <p>${comment.content}</p>
        <button class="edit-comment" data-comment-id="${comment.id}">수정</button>
        <button class="delete-comment" data-comment-id="${comment.id}">삭제</button>
      `;
    commentList.appendChild(commentItem);
  });
}

fetchComments(postId);

// 댓글 수정
document.getElementById('comment-list').addEventListener('click', async event => {
  if (event.target.classList.contains('edit-comment')) {
    const commentId = event.target.dataset.commentId;
    const updatedContent = prompt('댓글을 수정하세요:', event.target.previousSibling.textContent);
    if (updatedContent) {
      try {
        const response = await fetch(`https://chunsik.store/comment/${postId}/${commentId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: updatedContent }),
        });
        const data = await response.json();
        console.log(data);
        fetchComments(postId);
        window.location.reload();
      } catch (error) {
        console.error('Error updating comment:', error);
      }
    }
  }
});
// 댓글 삭제
document.getElementById('comment-list').addEventListener('click', async event => {
  if (event.target.classList.contains('delete-comment')) {
    const commentId = event.target.dataset.commentId;
    const confirmDelete = confirm('정말로 이 댓글을 삭제하시겠습니까?');
    if (confirmDelete) {
      try {
        const response = await fetch(`https://chunsik.store/comment/${postId}/${commentId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        console.log(data);
        fetchComments(postId);
        window.location.reload();
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  }
});
