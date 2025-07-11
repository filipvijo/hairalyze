const { supabase } = require('./supabase');

async function testAuthentication() {
  try {
    console.log('🧪 Testing Supabase Authentication...');
    console.log('=' .repeat(50));
    
    const testEmail = `test-${Date.now()}@hairalyze.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`📧 Test Email: ${testEmail}`);
    console.log(`🔐 Test Password: ${testPassword}`);
    console.log('');
    
    // Test 1: Create a new user
    console.log('1️⃣ Testing user creation...');
    const { data: signupData, error: signupError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true // Skip email confirmation
    });
    
    if (signupError) {
      console.error('❌ Signup failed:', signupError.message);
      return false;
    }
    
    console.log('✅ User created successfully!');
    console.log(`   User ID: ${signupData.user.id}`);
    console.log(`   Email: ${signupData.user.email}`);
    console.log(`   Email Confirmed: ${signupData.user.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log('');
    
    // Test 2: Try to sign in with the user
    console.log('2️⃣ Testing user login...');
    
    // Create a new client for testing login (simulating frontend)
    const { createClient } = require('@supabase/supabase-js');
    const testClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    const { data: loginData, error: loginError } = await testClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      console.error('❌ Login failed:', loginError.message);
    } else {
      console.log('✅ Login successful!');
      console.log(`   Session: ${loginData.session ? 'Active' : 'None'}`);
      console.log(`   User: ${loginData.user.email}`);
    }
    console.log('');
    
    // Test 3: Clean up - delete the test user
    console.log('3️⃣ Cleaning up test user...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(signupData.user.id);
    
    if (deleteError) {
      console.error('❌ Failed to delete test user:', deleteError.message);
    } else {
      console.log('✅ Test user deleted successfully');
    }
    
    console.log('');
    console.log('🎉 Authentication test completed!');
    
    return !loginError;
    
  } catch (error) {
    console.error('💥 Test failed with exception:', error.message);
    return false;
  }
}

// Test existing user login
async function testExistingUserLogin() {
  try {
    console.log('\n🔍 Testing existing user authentication...');
    console.log('=' .repeat(50));
    
    // List all users
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      return false;
    }
    
    console.log(`📊 Found ${users.users.length} existing users:`);
    users.users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'})`);
    });
    
    return true;
    
  } catch (error) {
    console.error('💥 Error testing existing users:', error.message);
    return false;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  Promise.all([
    testAuthentication(),
    testExistingUserLogin()
  ])
    .then(([authTest, existingTest]) => {
      console.log('\n📋 Test Results:');
      console.log(`   Authentication Flow: ${authTest ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   Existing Users: ${existingTest ? '✅ PASS' : '❌ FAIL'}`);
      console.log('\n🏁 All tests completed');
      process.exit(authTest && existingTest ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Tests failed:', error);
      process.exit(1);
    });
}

module.exports = { testAuthentication, testExistingUserLogin };
