// Test script to verify deployment
const https = require('https');

const DEPLOYMENT_URL = 'https://social-media-app-wdgu.vercel.app';

async function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const url = `${DEPLOYMENT_URL}${path}`;
    console.log(`\n🧪 Testing ${description}...`);
    console.log(`URL: ${url}`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`✅ Status: ${res.statusCode}`);
          console.log(`📄 Response:`, jsonData);
          resolve({ success: true, data: jsonData, status: res.statusCode });
        } catch (error) {
          console.log(`✅ Status: ${res.statusCode}`);
          console.log(`📄 Response: ${data.substring(0, 200)}...`);
          resolve({ success: true, data: data, status: res.statusCode });
        }
      });
    }).on('error', (error) => {
      console.log(`❌ Error: ${error.message}`);
      resolve({ success: false, error: error.message });
    });
  });
}

async function runTests() {
  console.log('🚀 Testing Social Media App Deployment\n');
  console.log('=' .repeat(50));
  
  // Test health endpoint
  await testEndpoint('/api/health', 'Health Check');
  
  // Test API endpoint
  await testEndpoint('/api/test', 'API Test');
  
  // Test main page
  await testEndpoint('/', 'Main Page');
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Tests completed!');
  console.log('\n💡 If health check shows mongodb_uri_set: true, your deployment is ready!');
}

runTests().catch(console.error);
