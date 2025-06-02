// quick-db-test.js - Simple database connection test

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const testDatabase = async () => {
    console.log('🔍 Quick Database Connection Test\n');

    // Check environment variables
    if (!process.env.SUPABASE_URL) {
        console.log('❌ SUPABASE_URL not found in .env file');
        return;
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env file');
        console.log('📋 Get your service role key from:');
        console.log('   https://cjyieedfyvrkhbibqwor.supabase.co/project/default/settings/api');
        return;
    }

    console.log('✅ Environment variables found');
    console.log(`📍 Supabase URL: ${process.env.SUPABASE_URL}`);
    console.log(`🔑 Service Role Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);

    // Create Supabase client
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('\n⏳ Testing database connection...');

    try {
        // Test 1: Try to select from tenants table
        const { data: tenants, error: tenantsError } = await supabase
            .from('tenants')
            .select('id, name')
            .limit(1);

        if (tenantsError) {
            if (tenantsError.message.includes('does not exist')) {
                console.log('❌ Tables do not exist yet');
                console.log('\n📋 Next Steps:');
                console.log('1. Go to: https://cjyieedfyvrkhbibqwor.supabase.co/project/default/sql');
                console.log('2. Execute the database setup SQL');
                console.log('3. Run this test again');
                return;
            } else {
                console.log('❌ Database error:', tenantsError.message);
                return;
            }
        }

        console.log('✅ Database connection successful!');

        if (tenants && tenants.length > 0) {
            console.log(`✅ Found ${tenants.length} tenant(s)`);
            tenants.forEach(tenant => console.log(`   - ${tenant.name}`));
        } else {
            console.log('⚠️  No tenants found (tables exist but empty)');
        }

        // Test 2: Check users
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('email, first_name, last_name')
            .limit(3);

        if (!usersError && users && users.length > 0) {
            console.log(`✅ Found ${users.length} user(s)`);
            users.forEach(user => console.log(`   - ${user.first_name} ${user.last_name} (${user.email})`));
        } else if (!usersError) {
            console.log('⚠️  No users found');
        } else {
            console.log('❌ Users table error:', usersError.message);
        }

        // Test 3: Test authentication
        console.log('\n⏳ Testing sample login...');

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'admin@acme.com',
                    password: 'password123'
                })
            });

            if (response.ok) {
                const authData = await response.json();
                console.log('✅ Authentication test successful!');
                console.log(`   User: ${authData.user.firstName} ${authData.user.lastName}`);
                console.log(`   Role: ${authData.user.role}`);
            } else {
                const errorData = await response.json();
                console.log('❌ Authentication test failed:', errorData.error);
            }
        } catch (authError) {
            console.log('⚠️  Could not test authentication (server may not be running)');
            console.log('   Start your server with: npm run dev');
        }

        console.log('\n🎉 Database test complete!');
        console.log('🌐 Visit: http://localhost:3000');
        console.log('🔐 Login: admin@acme.com / password123');

    } catch (error) {
        console.log('❌ Unexpected error:', error.message);

        if (error.message.includes('Invalid API key')) {
            console.log('💡 Your service role key might be incorrect');
            console.log('   Check: https://cjyieedfyvrkhbibqwor.supabase.co/project/default/settings/api');
        }
    }
};

testDatabase();