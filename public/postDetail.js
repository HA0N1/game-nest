window.onload = function () {
  fetchPostDetail();
};
async function fetchPostDetail() {
  const postId = window.location.pathname.split('/').pop();
  const response = await fetch(`http://chunsik.store:3000/post/${postId}`);
  const post = await response.json();
  displayPostDetail(post);
}
function displayPostDetail(post) {
  const postDetailDiv = document.getElementById('post-detail');
  postDetailDiv.innerHTML = ` <h2>제목: ${post.title}</h2>
<p>내용: ${post.content}</p>
<p>카테고리: ${post.category}</p>
<p>조회수:${post.view_count}</p>
<img src="${post.file.filePath}" alt="Post Image">
<p>좋아요: ${post.likes}</p> `;
}
