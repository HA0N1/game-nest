const postList = document.getElementById('post-list');

async function fetchPosts() {
  try {
    const response = await fetch('http://localhost:3000/post');
    const data = await response.json();

    displayPosts(data);
  } catch (error) {
    console.error('Error fetching posts:', error);
  }
}

document.getElementById('post-form').addEventListener('submit', create);

function displayPosts(posts) {
  postList.innerHTML = '';
  posts.forEach(post => {
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
      const imageElement = document.createElement('img');
      imageElement.src = post.file.filePath;
      imageElement.alt = 'Post Image';

      imageElement.width = 800;
      imageElement.height = 400;
      postItem.appendChild(imageElement);
    }

    const likesElement = document.createElement('p');
    likesElement.textContent = `좋아요: ${post.likes}`;
    postItem.appendChild(likesElement);

    const likeButton = document.createElement('button');
    if (post.likes) {
      likeButton.textContent = '좋아요 취소';
    } else {
      likeButton.textContent = '좋아요';
    }

    likeButton.addEventListener('click', () => like(post.id, posts));
    postItem.appendChild(likeButton);

    const updateButton = document.createElement('button');
    updateButton.textContent = '수정';
    updateButton.addEventListener('click', () => update(post.id));
    postItem.appendChild(updateButton);

    const removeButton = document.createElement('button');
    removeButton.textContent = '삭제';
    removeButton.addEventListener('click', () => remove(post.id));
    postItem.appendChild(removeButton);

    postList.prepend(postItem);
  });
}

async function create(event) {
  event.preventDefault();
  const formData = new FormData(document.getElementById('post-form'));
  const title = formData.get('title');
  const content = formData.get('content');
  const category = formData.get('category');

  if (!title || !content || !category) {
    alert('제목, 내용, 카테고리를 모두 입력해야 합니다.');
    return;
  }
  try {
    const token = window.localStorage.getItem('authorization');
    const response = await fetch('http://localhost:3000/post', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    window.location.reload();
  } catch (error) {
    console.error('Error creating post:', error);
  }
}

async function update(postId) {
  const response = await fetch(`http://localhost:3000/post/${postId}`);

  const updatedTitle = prompt('수정할 제목을 입력하세요:');
  const updatedContent = prompt('수정할 내용을 입력하세요:');
  const updatedCategory = prompt(
    '수정할 카테고리를 선택하세요: (talk, question, walkthrough, notice, pre-order, new game news)',
  );

  if (updatedTitle && updatedContent && updatedCategory) {
    try {
      const token = window.localStorage.getItem('authorization');
      const updateresponse = await fetch(`http://localhost:3000/post/${postId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },

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
  const logInUserId = window.localStorage.getItem('authorization');
  try {
    const response = await fetch(`http://localhost:3000/post/${postId}`);

    const confirmDelete = confirm('정말로 이 게시글을 삭제하시겠습니까?');
    if (confirmDelete) {
      const deleteResponse = await fetch(`http://localhost:3000/post/${postId}?userId=${logInUserId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${logInUserId}`,
        },
      });

      const data = await deleteResponse.json();
      window.location.reload();
    }
  } catch (error) {
    console.error('Error deleting post:', error);
  }
}

async function like(postId, posts) {
  try {
    // 좋아요 상태에 따라 적절한 요청 보내기
    const post = posts.find(post => post.id === postId);
    const token = window.localStorage.getItem('authorization');
    const response = await fetch(`http://localhost:3000/post/${postId}/like`, {
      method: post.likes ? 'DELETE' : 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // UI 업데이트를 위해 페이지 다시 로드
    window.location.reload();
  } catch (error) {
    console.error('Error toggling like:', error);
  }
}
fetchPosts();
