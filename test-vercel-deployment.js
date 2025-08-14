// Test script to verify Vercel deployment
const app = require('./app.js');

console.log('Testing app export...');
console.log('App type:', typeof app);
console.log('App is function:', typeof app === 'function');

// Test if app has the required methods
console.log('App has listen method:', typeof app.listen === 'function');
console.log('App has use method:', typeof app.use === 'function');

console.log('✅ App export test completed successfully!');
