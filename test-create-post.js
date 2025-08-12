// Test post creation

async function testCreatePost() {
  try {
    const userId = '6895ff4152c3170979c6f02f'; // John Doe's ID
    
    console.log('Testing post creation...');
    
    const response = await fetch('http://localhost:5000/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'Test post from API test script! This should work perfectly.',
        image: 'https://picsum.photos/seed/test/600/400',
        user: userId
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.get('content-type'));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Post created successfully:', result);
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testCreatePost();
