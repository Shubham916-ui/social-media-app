// Test like functionality

async function testLike() {
  try {
    // First get posts to get a post ID
    const postsResponse = await fetch('http://localhost:5000/api/posts');
    const posts = await postsResponse.json();
    
    if (posts.length === 0) {
      console.log('No posts found');
      return;
    }
    
    const postId = posts[0]._id;
    const userId = '6895ff4152c3170979c6f02f'; // John Doe's ID from login test
    
    console.log('Testing like on post:', postId);
    console.log('Post content:', posts[0].content);
    console.log('Current likes:', posts[0].likes.length);
    
    // Test like
    const likeResponse = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId
      })
    });
    
    const likeResult = await likeResponse.json();
    console.log('Like response:', likeResult);
    
    // Test unlike (like again)
    const unlikeResponse = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId
      })
    });
    
    const unlikeResult = await unlikeResponse.json();
    console.log('Unlike response:', unlikeResult);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLike();
