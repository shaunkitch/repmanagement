// test-supabase-auth.js - Test Supabase Authentication Setup
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

const testSupabaseAuth = async () => {
    log(colors.cyan, '🔍 Testing Supabase Authentication Setup');
    log(colors.cyan, '========================================\n');

    // Create Supabase client
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test 1: Check if auth users exist
    log(colors.blue, '📋 Step 1: Checking auth.users table');
    
    try {
        const { data: authUsers, error: authError } = await supabase
            .from('auth.users')
            .select('id, email, created_at')
            .limit(5);

        if (authError) {
            // Try alternative query method
            const { data: users, error: userError } = await supabase.auth.admin.listUsers();
            
            if (userError) {
                log(colors.red, '  ❌ Cannot access auth users');
                log(colors.yellow, '  💡 This might be normal - auth.users is not directly queryable');
            } else {
                log(colors.green, `  ✅ Found ${users.users?.length || 0} auth users`);
                users.users?.forEach(user => {
                    log(colors.cyan, `     - ${user.email} (${user.id})`);
                });
            }
        } else {
            log(colors.green, `  ✅ Found ${authUsers?.length || 0} auth users`);
        }
    } catch (error) {
        log(colors.yellow, '  ⚠️  Direct auth.users query not available (this is normal)');
    }

    // Test 2: Check users table
    log(colors.blue, '\n👥 Step 2: Checking users table');
    
    try {
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, email, first_name, last_name, role, tenant_id')
            .limit(10);

        if (usersError) {
            log(colors.red, `  ❌ Error fetching users: ${usersError.message}`);
        } else {
            log(colors.green, `  ✅ Found ${users?.length || 0} users in users table`);
            users?.forEach(user => {
                log(colors.cyan, `     - ${user.first_name} ${user.last_name} (${user.email}, ${user.role})`);
            });
        }
    } catch (error) {
        log(colors.red, `  ❌ Users table error: ${error.message}`);
    }

    // Test 3: Test authentication with Supabase Auth
    log(colors.blue, '\n🔐 Step 3: Testing Supabase Auth login');
    
    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'admin@acme.com',
            password: 'password123'
        });

        if (authError) {
            log(colors.red, `  ❌ Supabase Auth login failed: ${authError.message}`);
            
            if (authError.message.includes('Invalid login credentials')) {
                log(colors.yellow, '  💡 This means the user doesn\'t exist in auth.users');
                log(colors.yellow, '  📋 Please run the Supabase Auth setup SQL');
            }
        } else if (authData.user && authData.session) {
            log(colors.green, '  ✅ Supabase Auth login successful!');
            log(colors.cyan, `     User ID: ${authData.user.id}`);
            log(colors.cyan, `     Email: ${authData.user.email}`);
            log(colors.cyan, `     Token length: ${authData.session.access_token.length} chars`);
            
            // Test API with the token
            await testAPIWithToken(authData.session.access_token);
        } else {
            log(colors.yellow, '  ⚠️  Login returned no user or session');
        }
    } catch (error) {
        log(colors.red, `  ❌ Auth test error: ${error.message}`);
    }

    // Test 4: Test user registration
    log(colors.blue, '\n📝 Step 4: Testing user registration');
    
    const testEmail = `test-${Date.now()}@example.com`;
    
    try {
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: testEmail,
            password: 'testpassword123',
            options: {
                data: {
                    first_name: 'Test',
                    last_name: 'User',
                    role: 'field_rep',
                    tenant_id: '11111111-1111-1111-1111-111111111111'
                }
            }
        });

        if (signupError) {
            log(colors.red, `  ❌ Registration failed: ${signupError.message}`);
        } else if (signupData.user) {
            log(colors.green, '  ✅ Registration successful!');
            log(colors.cyan, `     New user: ${signupData.user.email}`);
            log(colors.cyan, `     User ID: ${signupData.user.id}`);
            
            // Check if trigger created user in users table
            setTimeout(async () => {
                const { data: newUser, error: newUserError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', testEmail)
                    .single();

                if (newUserError) {
                    log(colors.yellow, '  ⚠️  Trigger might not have worked - user not in users table');
                } else {
                    log(colors.green, '  ✅ Trigger worked - user created in users table');
                    log(colors.cyan, `     Name: ${newUser.first_name} ${newUser.last_name}`);
                }
            }, 1000);
        }
    } catch (error) {
        log(colors.red, `  ❌ Registration test error: ${error.message}`);
    }

    log(colors.green, '\n🎉 Supabase Auth test completed!');
};

const testAPIWithToken = async (token) => {
    log(colors.blue, '\n🌐 Testing API with Supabase token');
    
    try {
        const response = await fetch('http://localhost:3000/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const userData = await response.json();
            log(colors.green, '  ✅ API authentication working!');
            log(colors.cyan, `     API returned: ${userData.user.firstName} ${userData.user.lastName}`);
        } else {
            const errorData = await response.json();
            log(colors.red, `  ❌ API auth failed: ${errorData.error}`);
        }
    } catch (error) {
        log(colors.yellow, '  ⚠️  Could not test API (server may not be running)');
    }
};

// Run the test
testSupabaseAuth().catch(error => {
    log(colors.red, `❌ Test failed: ${error.message}`);
});