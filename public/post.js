const postList = document.getElementById('post-list');
const postForm = document.getElementById('post-form');
const token = window.localStorage.getItem('authorization');
async function fetchPosts() {
  try {
    const response = await fetch('https://chunsik.store/post');
    let data = await response.json();
    data = data.sort((a, b) => b.id - a.id);

    for (const post of data) {
      displayPosts(post);
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
  }
}

function displayPosts(post) {
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

  const likesElement = document.createElement('p');
  likesElement.textContent = `좋아요: ${post.likes}`;
  postItem.appendChild(likesElement);

  postItem.addEventListener('click', () => {
    const postId = post.id;
    window.location.href = `https://chunsik.store/post/${postId}/page`;
  });

  postList.appendChild(postItem);
  document.getElementById('post-form').addEventListener('submit', create);
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
    const response = await fetch('https://chunsik.store/post', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })
      .then(res => {
        return res.json();
      })
      .then(json => {
        window.location.href = 'https://chunsik.store/post/page';
      })
      .catch(err => {
        console.error('err: ', err);
      });
    // const data = await response.json();
  } catch (error) {
    console.error('Error creating post:', error);
  }
}
fetchPosts();
