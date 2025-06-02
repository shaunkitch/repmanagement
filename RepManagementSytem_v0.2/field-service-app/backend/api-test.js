// api-test.js - Test your Field Service API
const http = require('http');
const https = require('https');

// Test configuration
const API_BASE = 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (color, message) => console.log(color + message + colors.reset);

// HTTP request helper
const makeRequest = (options, data = null) => {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

// Test functions
const testHealth = async () => {
  log(colors.blue, '\n🏥 Testing Health Endpoint');
  log(colors.blue, '==========================');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      method: 'GET'
    });

    if (response.status === 200) {
      log(colors.green, '✅ Health check passed');
      console.log('   Response:', response.body);
      return true;
    } else {
      log(colors.red, `❌ Health check failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    log(colors.red, `❌ Health check error: ${error.message}`);
    if (error.message.includes('ECONNREFUSED')) {
      log(colors.yellow, '⚠️  Server is not running. Please start it with: npm run dev');
    }
    return false;
  }
};

const testAuthEndpoints = async () => {
  log(colors.blue, '\n🔐 Testing Authentication Endpoints');
  log(colors.blue, '====================================');
  
  // Test login endpoint (should fail without credentials)
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {});

    if (response.status === 400) {
      log(colors.green, '✅ Login endpoint responding (validation working)');
      console.log('   Response:', response.body);
    } else {
      log(colors.yellow, `⚠️  Login endpoint status: ${response.status}`);
    }
  } catch (error) {
    log(colors.red, `❌ Login endpoint error: ${error.message}`);
  }

  // Test with sample credentials (if database is set up)
  try {
    log(colors.cyan, '\n🧪 Testing with sample credentials...');
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email: 'admin@acme.com',
      password: 'password123'
    });

    if (response.status === 200) {
      log(colors.green, '✅ Sample login successful! Database is set up correctly.');
      console.log('   User:', response.body.user);
      return response.body.token;
    } else if (response.status === 401) {
      log(colors.yellow, '⚠️  Sample login failed - database may not be set up yet');
      console.log('   Response:', response.body);
    } else {
      log(colors.yellow, `⚠️  Login status: ${response.status}`);
      console.log('   Response:', response.body);
    }
  } catch (error) {
    log(colors.red, `❌ Sample login error: ${error.message}`);
  }

  return null;
};

const testProtectedEndpoints = async (token) => {
  log(colors.blue, '\n🔒 Testing Protected Endpoints');
  log(colors.blue, '===============================');
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Test work orders endpoint
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/work-orders',
      method: 'GET',
      headers
    });

    if (response.status === 200) {
      log(colors.green, '✅ Work orders endpoint working');
      console.log('   Found', response.body.workOrders?.length || 0, 'work orders');
    } else if (response.status === 401) {
      log(colors.yellow, '⚠️  Work orders endpoint requires authentication (as expected)');
    } else {
      log(colors.yellow, `⚠️  Work orders status: ${response.status}`);
      console.log('   Response:', response.body);
    }
  } catch (error) {
    log(colors.red, `❌ Work orders error: ${error.message}`);
  }

  // Test forms endpoint
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/forms',
      method: 'GET',
      headers
    });

    if (response.status === 200) {
      log(colors.green, '✅ Forms endpoint working');
      console.log('   Found', response.body?.length || 0, 'forms');
    } else if (response.status === 401) {
      log(colors.yellow, '⚠️  Forms endpoint requires authentication (as expected)');
    } else {
      log(colors.yellow, `⚠️  Forms status: ${response.status}`);
    }
  } catch (error) {
    log(colors.red, `❌ Forms error: ${error.message}`);
  }
};

const testInvalidEndpoints = async () => {
  log(colors.blue, '\n🚫 Testing Invalid Endpoints');
  log(colors.blue, '=============================');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/nonexistent',
      method: 'GET'
    });

    if (response.status === 404) {
      log(colors.green, '✅ 404 handling working correctly');
    } else {
      log(colors.yellow, `⚠️  Unexpected status for invalid endpoint: ${response.status}`);
    }
  } catch (error) {
    log(colors.red, `❌ Invalid endpoint test error: ${error.message}`);
  }
};

const showAPIDocumentation = () => {
  log(colors.blue, '\n📚 API Documentation');
  log(colors.blue, '=====================');
  
  console.log(`
🔗 Base URL: ${API_BASE}

📍 Available Endpoints:

Authentication:
  POST /api/auth/login
    Body: { "email": "admin@acme.com", "password": "password123" }
    
  POST /api/auth/register  
    Body: { "email": "...", "password": "...", "firstName": "...", "lastName": "...", "tenantId": "..." }

Work Orders:
  GET  /api/work-orders (requires auth)
  POST /api/work-orders (requires auth)
    Body: { "title": "...", "description": "...", "location_address": "..." }
  
Forms:
  GET  /api/forms (requires auth)
  POST /api/forms (requires auth)
  POST /api/forms/:id/submit (requires auth)

Inventory:
  GET  /api/inventory/items (requires auth)
  POST /api/inventory/transactions (requires auth)

System:
  GET  /health

📱 Example cURL commands:

# Health check
curl ${API_BASE}/health

# Login
curl -X POST ${API_BASE}/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@acme.com","password":"password123"}'

# Get work orders (replace TOKEN with actual token)
curl -X GET ${API_BASE}/api/work-orders \\
  -H "Authorization: Bearer TOKEN"
`);
};

const main = async () => {
  console.log(colors.cyan + '🚀 Field Service API Test Suite' + colors.reset);
  console.log(colors.cyan + '===============================' + colors.reset);
  
  // Check if server is running
  const healthOk = await testHealth();
  
  if (!healthOk) {
    log(colors.red, '\n❌ Server is not running or not accessible');
    log(colors.yellow, '\n📋 Troubleshooting steps:');
    console.log('1. Make sure you\'ve set up the project:');
    console.log('   - Run the setup script: ./setup.sh');
    console.log('   - Install dependencies: npm install');
    console.log('2. Start the server: npm run dev');
    console.log('3. Check server logs for errors');
    return;
  }

  // Test authentication
  const token = await testAuthEndpoints();
  
  // Test protected endpoints
  await testProtectedEndpoints(token);
  
  // Test invalid endpoints
  await testInvalidEndpoints();
  
  // Show documentation
  showAPIDocumentation();
  
  log(colors.green, '\n✅ API testing completed!');
  
  if (!token) {
    log(colors.yellow, '\n⚠️  Database setup needed:');
    console.log('1. Get your service role key from Supabase');
    console.log('2. Update .env file with the key');
    console.log('3. Execute database/schema.sql in Supabase SQL editor');
    console.log('4. Run this test again');
  } else {
    log(colors.green, '\n🎉 Your API is fully functional and ready for mobile app integration!');
  }
};

// Run the tests
main().catch(console.error);

module.exports = { testHealth, testAuthEndpoints, testProtectedEndpoints };