const { createClient } = require('@supabase/supabase-js');

// Your specific Supabase configuration
const supabaseUrl = 'https://cjyieedfyvrkhbibqwor.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeWllZWRmeXZya2hiaWJxd29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MTkxNTksImV4cCI6MjA2Mzk5NTE1OX0.5JxenYxdOl4JYsPYRtEIRmmh77zYS3XslBN5RUm5c2U';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const testConnection = async () => {
  console.log('🔗 Testing Supabase connection...');
  console.log(`📍 URL: ${supabaseUrl}`);
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('tenants')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Connection test failed:', error.message);
      
      if (error.message.includes('relation "tenants" does not exist')) {
        console.log('📋 Database tables not created yet. Please run the schema SQL in Supabase first.');
        console.log('   1. Go to https://cjyieedfyvrkhbibqwor.supabase.co/project/default/sql');
        console.log('   2. Copy and paste the SQL from database/schema.sql');
        console.log('   3. Run the SQL to create all tables');
      }
      
      return false;
    }

    console.log('✅ Supabase connection successful!');
    
    // Test if sample data exists
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name, subdomain')
      .limit(5);

    if (tenantsError) {
      console.log('⚠️  Could not fetch tenants:', tenantsError.message);
    } else if (tenants && tenants.length > 0) {
      console.log('🏢 Found tenants in database:');
      tenants.forEach(tenant => {
        console.log(`   - ${tenant.name} (${tenant.subdomain})`);
      });
    } else {
      console.log('📝 No tenants found. Sample data may not be loaded yet.');
    }

    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
};

const main = async () => {
  console.log('🚀 Supabase Connection Test\n');
  
  const connected = await testConnection();
  
  if (!connected) {
    console.log('\n📋 Setup Instructions:');
    console.log('1. Go to your Supabase project: https://cjyieedfyvrkhbibqwor.supabase.co');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Execute the schema.sql file to create tables');
    console.log('4. Run this test again');
    process.exit(1);
  }

  console.log('\n🎉 Connection test completed!');
  console.log('🚀 You can now start your server with: npm run dev');
};

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testConnection, supabase };
