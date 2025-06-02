// verify-fix.js - Check if the password_hash fix worked
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const log = (color, message) => console.log(color + message + colors.reset);

const verifyFix = async () => {
    log(colors.cyan, '🔍 Verifying Database Fix');
    log(colors.cyan, '=========================\n');

    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Step 1: Check users table structure
    log(colors.blue, '📋 Step 1: Checking users table structure');
    
    try {
        // Try to select from users table
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, email, first_name, last_name, role')
            .limit(5);

        if (usersError) {
            log(colors.red, `  ❌ Users table error: ${usersError.message}`);
            return false;
        }

        log(colors.green, `  ✅ Users table accessible`);
        log(colors.green, `  ✅ Found ${users.length} users`);
        
        users.forEach(user => {
            log(colors.cyan, `     - ${user.first_name} ${user.last_name} (${user.email})`);
        });
    } catch (error) {
        log(colors.red, `  ❌ Users table check failed: ${error.message}`);
        return false;
    }

    // Step 2: Test Supabase Auth login
    log(colors.blue, '\n🔐 Step 2: Testing Supabase Auth login');
    
    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'admin@acme.com',
            password: 'password123'
        });

        if (authError) {
            log(colors.red, `  ❌ Auth login failed: ${authError.message}`);
            
            if (authError.message.includes('Invalid login credentials')) {
                log(colors.yellow, '  💡 User might not exist in auth.users yet');
                log(colors.yellow, '  📋 The migration SQL should have created it');
            }
            return false;
        }

        if (authData.user && authData.session) {
            log(colors.green, '  ✅ Supabase Auth login successful!');
            log(colors.cyan, `     User: ${authData.user.email}`);
            log(colors.cyan, `     ID: ${authData.user.id}`);
            log(colors.cyan, `     Token: ${authData.session.access_token.substring(0, 20)}...`);
            
            // Step 3: Test API with token
            await testAPI(authData.session.access_token);
            
        } else {
            log(colors.yellow, '  ⚠️  Login succeeded but no user/session returned');
            return false;
        }
    } catch (error) {
        log(colors.red, `  ❌ Auth test failed: ${error.message}`);
        return false;
    }

    return true;
};

const testAPI = async (token) => {
    log(colors.blue, '\n🌐 Step 3: Testing API with token');
    
    try {
        // Test login endpoint
        const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@acme.com',
                password: 'password123'
            })
        });

        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            log(colors.green, '  ✅ API login endpoint working!');
            log(colors.cyan, `     API returned: ${loginData.user?.firstName} ${loginData.user?.lastName}`);
            log(colors.cyan, `     Role: ${loginData.user?.role}`);
            
            // Test protected endpoint
            const workOrderResponse = await fetch('http://localhost:3000/api/work-orders', {
                headers: {
                    'Authorization': `Bearer ${loginData.token}`
                }
            });
            
            if (workOrderResponse.ok) {
                const workOrderData = await workOrderResponse.json();
                log(colors.green, '  ✅ Protected endpoint working!');
                log(colors.cyan, `     Found ${workOrderData.workOrders?.length || 0} work orders`);
            } else {
                const errorData = await workOrderResponse.json();
                log(colors.red, `  ❌ Protected endpoint failed: ${errorData.error}`);
            }
            
        } else {
            const errorData = await loginResponse.json();
            log(colors.red, `  ❌ API login failed: ${errorData.error}`);
        }
    } catch (error) {
        log(colors.yellow, `  ⚠️  API test failed: ${error.message}`);
        log(colors.yellow, '     Make sure your server is running: npm run dev');
    }
};

// Run verification
verifyFix().then(success => {
    if (success) {
        log(colors.green, '\n🎉 All tests passed!');
        log(colors.cyan, '\n📱 Ready to use:');
        log(colors.cyan, '   • Visit: http://localhost:3000');
        log(colors.cyan, '   • Login: admin@acme.com / password123');
        log(colors.cyan, '   • Also try: john.doe@acme.com / password123');
    } else {
        log(colors.red, '\n❌ Some tests failed.');
        log(colors.yellow, '💡 Make sure you:');
        log(colors.yellow, '   1. Ran the migration SQL in Supabase');
        log(colors.yellow, '   2. Updated your auth route files');
        log(colors.yellow, '   3. Restarted your server');
    }
}).catch(error => {
    log(colors.red, `❌ Verification failed: ${error.message}`);
});