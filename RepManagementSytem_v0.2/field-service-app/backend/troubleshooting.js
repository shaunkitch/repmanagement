# Field Service API Troubleshooting & Testing Guide

# STEP 1: Check if you've set up the project correctly
echo "🔍 Step 1: Project Setup Check"
echo "================================="

# Check if project directory exists
if [ ! -d "field-service-management" ]; then
    echo "❌ Project directory not found!"
    echo "📋 Please run the setup script first:"
    echo "   chmod +x setup.sh"
    echo "   ./setup.sh"
    exit 1
fi

cd field-service-management

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found!"
    echo "📋 Please run the setup script to create project structure"
    exit 1
fi

echo "✅ Project structure exists"

# STEP 2: Install dependencies
echo ""
echo "🔍 Step 2: Installing Dependencies"  
echo "=================================="

if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "✅ Dependencies already installed"
fi

# STEP 3: Check environment configuration
echo ""
echo "🔍 Step 3: Environment Configuration"
echo "===================================="

if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "📋 Please create .env file with your Supabase credentials"
    exit 1
fi

# Check if service role key is set
if grep -q "your-service-role-key-here" .env; then
    echo "⚠️  Service Role Key not configured!"
    echo "📋 Please update .env file with your actual Supabase service role key"
    echo "   Get it from: https://cjyieedfyvrkhbibqwor.supabase.co/project/default/settings/api"
    echo ""
    echo "🔧 Current .env status:"
    grep -v "SERVICE_ROLE_KEY" .env
    echo "SUPABASE_SERVICE_ROLE_KEY=*** NEEDS TO BE UPDATED ***"
else
    echo "✅ Environment file configured"
fi

# STEP 4: Test database connection
echo ""
echo "🔍 Step 4: Database Connection Test"
echo "==================================="

if [ -f "test-connection.js" ]; then
    echo "🔗 Testing Supabase connection..."
    node test-connection.js
else
    echo "⚠️  test-connection.js not found, creating it..."
    
    # Create test-connection.js
    cat > test-connection.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cjyieedfyvrkhbibqwor.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeWllZWRmeXZya2hiaWJxd29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MTkxNTksImV4cCI6MjA2Mzk5NTE1OX0.5JxenYxdOl4JYsPYRtEIRmmh77zYS3XslBN5RUm5c2U';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const testConnection = async () => {
  try {
    console.log('🔗 Testing connection to Supabase...');
    const { data, error } = await supabase.from('tenants').select('count').limit(1);
    
    if (error) {
      if (error.message.includes('relation "tenants" does not exist')) {
        console.log('❌ Database tables not created yet!');
        console.log('📋 Please run the schema SQL in Supabase:');
        console.log('   1. Go to: https://cjyieedfyvrkhbibqwor.supabase.co/project/default/sql');
        console.log('   2. Copy SQL from database/schema.sql');
        console.log('   3. Execute the SQL');
        return false;
      }
      console.log('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful!');
    return true;
  } catch (error) {
    console.log('❌ Connection error:', error.message);
    return false;
  }
};

testConnection();
EOF

    node test-connection.js
fi

# STEP 5: Start the server and test endpoints
echo ""
echo "🔍 Step 5: Server Testing"
echo "========================="

echo "🚀 Starting the API server..."
echo "📍 The server provides API endpoints, not a web interface"
echo ""

# Create a simple test script
cat > test-endpoints.js << 'EOF'
const http = require('http');

const testEndpoint = (path, expectedStatus = 200) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const status = res.statusCode === expectedStatus ? '✅' : '❌';
        console.log(`${status} ${path} - Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log(`   Response: ${JSON.stringify(json, null, 2)}`);
          } catch (e) {
            console.log(`   Response: ${data.substring(0, 100)}`);
          }
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${path} - Error: ${error.message}`);
      resolve();
    });

    req.setTimeout(5000, () => {
      console.log(`❌ ${path} - Timeout`);
      req.destroy();
      resolve();
    });

    req.end();
  });
};

const testAPI = async () => {
  console.log('🧪 Testing API endpoints...');
  console.log('============================');
  
  await testEndpoint('/health');
  await testEndpoint('/api/work-orders', 401); // Should require auth
  await testEndpoint('/api/forms', 401); // Should require auth
  await testEndpoint('/nonexistent', 404); // Should be 404
  
  console.log('\n✅ API endpoint tests completed!');
  console.log('📱 Your API is ready for mobile app integration');
};

// Wait a moment for server to start, then test
setTimeout(testAPI, 2000);
EOF

echo "⏳ Starting server in background..."
npm run dev > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test if server is running
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Server is running on http://localhost:3000"
    echo ""
    
    # Run endpoint tests
    node test-endpoints.js
    
    echo ""
    echo "📋 Available API Endpoints:"
    echo "=========================="
    echo "GET  /health                     - Health check"
    echo "POST /api/auth/login            - User login"  
    echo "POST /api/auth/register         - User registration"
    echo "GET  /api/work-orders           - List work orders (requires auth)"
    echo "POST /api/work-orders           - Create work order (requires auth)"
    echo "GET  /api/forms                 - List forms (requires auth)"
    echo "POST /api/forms                 - Create form (requires auth)"
    echo "GET  /api/inventory/items       - List inventory (requires auth)"
    
    echo ""
    echo "📱 Test with curl:"
    echo "=================="
    echo "# Health check"
    echo "curl http://localhost:3000/health"
    echo ""
    echo "# Login (after database setup)"
    echo "curl -X POST http://localhost:3000/api/auth/login \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"email\":\"admin@acme.com\",\"password\":\"password123\"}'"
    
else
    echo "❌ Server failed to start"
    echo "📋 Check server.log for errors:"
    echo "   tail -f server.log"
fi

# Keep server running
echo ""
echo "🔧 Server is running in the background (PID: $SERVER_PID)"
echo "📋 To stop the server: kill $SERVER_PID"
echo "📋 To see server logs: tail -f server.log"
echo "📋 To restart: npm run dev"

# Clean up on exit
trap "kill $SERVER_PID 2>/dev/null" EXIT