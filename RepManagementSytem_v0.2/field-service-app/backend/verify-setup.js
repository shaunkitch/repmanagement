// verify-setup.js - Test your Field Service Management setup
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const log = (color, message) => console.log(color + message + colors.reset);

const testSetup = async () => {
    log(colors.cyan, '🔍 Field Service Management - Setup Verification');
    log(colors.cyan, '================================================');
    
    // Step 1: Check environment variables
    log(colors.blue, '\n📋 Step 1: Checking Environment Variables');
    
    const requiredVars = [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'JWT_SECRET'
    ];
    
    let envOk = true;
    requiredVars.forEach(varName => {
        if (process.env[varName]) {
            log(colors.green, `  ✅ ${varName}: Set`);
        } else {
            log(colors.red, `  ❌ ${varName}: Missing`);
            envOk = false;
        }
    });
    
    if (!envOk) {
        log(colors.red, '\n❌ Environment variables missing. Please check your .env file.');
        return false;
    }
    
    // Step 2: Test Supabase connection
    log(colors.blue, '\n🔗 Step 2: Testing Supabase Connection');
    
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    try {
        const { data, error } = await supabase
            .from('tenants')
            .select('id')
            .limit(1);
        
        if (error) {
            if (error.message.includes('relation "tenants" does not exist') || 
                error.message.includes('table "tenants" does not exist')) {
                log(colors.red, '  ❌ Database tables not created');
                log(colors.yellow, '  📋 Please execute the database setup SQL in Supabase');
                log(colors.cyan, '  📍 Go to: https://cjyieedfyvrkhbibqwor.supabase.co/project/default/sql');
                return false;
            }
            log(colors.red, `  ❌ Database error: ${error.message}`);
            return false;
        }
        
        log(colors.green, '  ✅ Database connection successful');
    } catch (err) {
        log(colors.red, `  ❌ Connection failed: ${err.message}`);
        return false;
    }
    
    // Step 3: Check sample data
    log(colors.blue, '\n📊 Step 3: Checking Sample Data');
    
    try {
        // Check tenants
        const { data: tenants } = await supabase
            .from('tenants')
            .select('name, subdomain')
            .limit(5);
        
        if (tenants && tenants.length > 0) {
            log(colors.green, `  ✅ Found ${tenants.length} tenants:`);
            tenants.forEach(tenant => {
                log(colors.cyan, `     - ${tenant.name} (${tenant.subdomain})`);
            });
        } else {
            log(colors.yellow, '  ⚠️  No tenants found');
        }
        
        // Check users
        const { data: users } = await supabase
            .from('users')
            .select('email, first_name, last_name, role')
            .limit(5);
        
        if (users && users.length > 0) {
            log(colors.green, `  ✅ Found ${users.length} users:`);
            users.forEach(user => {
                log(colors.cyan, `     - ${user.first_name} ${user.last_name} (${user.email}, ${user.role})`);
            });
        } else {
            log(colors.yellow, '  ⚠️  No users found');
        }
        
        // Check work orders
        const { data: workOrders } = await supabase
            .from('work_orders')
            .select('title, status')
            .limit(5);
        
        if (workOrders && workOrders.length > 0) {
            log(colors.green, `  ✅ Found ${workOrders.length} work orders:`);
            workOrders.forEach(wo => {
                log(colors.cyan, `     - ${wo.title} (${wo.status})`);
            });
        } else {
            log(colors.yellow, '  ⚠️  No work orders found');
        }
        
    } catch (err) {
        log(colors.red, `  ❌ Error checking sample data: ${err.message}`);
        return false;
    }
    
    // Step 4: Test API server
    log(colors.blue, '\n🌐 Step 4: Testing API Server');
    
    try {
        const response = await fetch('http://localhost:3000/health');
        if (response.ok) {
            const data = await response.json();
            log(colors.green, '  ✅ API server is running');
            log(colors.cyan, `     Status: ${data.status}`);
            log(colors.cyan, `     Version: ${data.version}`);
        } else {
            log(colors.yellow, `  ⚠️  API server responded with status: ${response.status}`);
        }
    } catch (err) {
        log(colors.yellow, '  ⚠️  API server not running (start with: npm run dev)');
    }
    
    // Step 5: Test authentication
    log(colors.blue, '\n🔐 Step 5: Testing Authentication');
    
    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@acme.com',
                password: 'password123'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            log(colors.green, '  ✅ Authentication working');
            log(colors.cyan, `     User: ${data.user.firstName} ${data.user.lastName}`);
            log(colors.cyan, `     Role: ${data.user.role}`);
            log(colors.cyan, `     Token length: ${data.token.length} characters`);
        } else {
            const errorData = await response.json();
            log(colors.red, `  ❌ Authentication failed: ${errorData.error}`);
            return false;
        }
    } catch (err) {
        log(colors.yellow, '  ⚠️  Could not test authentication (API server may not be running)');
    }
    
    // Summary
    log(colors.green, '\n🎉 Setup Verification Complete!');
    log(colors.cyan, '\n📱 Next Steps:');
    log(colors.cyan, '   1. Visit: http://localhost:3000');
    log(colors.cyan, '   2. Login with: admin@acme.com / password123');
    log(colors.cyan, '   3. Explore the dashboard and features');
    log(colors.cyan, '   4. Try creating a new work order');
    log(colors.cyan, '   5. Test the registration feature');
    
    log(colors.blue, '\n💡 Available Accounts:');
    log(colors.blue, '   • admin@acme.com (Admin) - password123');
    log(colors.blue, '   • john.doe@acme.com (Field Rep) - password123');
    log(colors.blue, '   • manager@techcorp.com (Manager) - password123');
    
    return true;
};

// Run the verification
testSetup().catch(error => {
    log(colors.red, `❌ Verification failed: ${error.message}`);
    process.exit(1);
});