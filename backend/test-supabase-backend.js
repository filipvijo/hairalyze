const { supabase } = require('./supabase');

async function testSupabaseBackend() {
  console.log('🧪 Testing Supabase Backend Integration...\n');
  
  try {
    // Test 1: Connection test
    console.log('1️⃣ Testing Supabase connection...');
    const { count, error: countError } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Connection test failed:', countError.message);
      return;
    }
    console.log(`✅ Connection successful - Found ${count} submissions\n`);
    
    // Test 2: Fetch submissions test
    console.log('2️⃣ Testing submissions fetch...');
    const { data: submissions, error: fetchError } = await supabase
      .from('submissions')
      .select('id, user_id, original_user_id, hair_problem, created_at')
      .limit(5);
    
    if (fetchError) {
      console.error('❌ Fetch test failed:', fetchError.message);
      return;
    }
    
    console.log(`✅ Fetch successful - Sample submissions:`);
    submissions.forEach((sub, index) => {
      console.log(`   ${index + 1}. ID: ${sub.id.substring(0, 8)}... | User: ${sub.user_id || 'null'} | Original: ${sub.original_user_id} | Problem: ${sub.hair_problem || 'none'}`);
    });
    console.log('');
    
    // Test 3: Check for null user_ids (migration status)
    console.log('3️⃣ Checking migration status...');
    const { count: nullUserCount, error: nullError } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .is('user_id', null);
    
    if (nullError) {
      console.error('❌ Migration status check failed:', nullError.message);
      return;
    }
    
    if (nullUserCount > 0) {
      console.log(`⚠️  Found ${nullUserCount} submissions with null user_id (need auth migration)`);
    } else {
      console.log('✅ All submissions have user_id assigned');
    }
    console.log('');
    
    // Test 4: Test auth middleware simulation
    console.log('4️⃣ Testing auth simulation...');
    const testUserId = 'test-user-123';
    
    // Simulate what happens in the auth middleware
    const { data: userSubmissions, error: userError } = await supabase
      .from('submissions')
      .select('id, hair_problem, created_at')
      .eq('original_user_id', testUserId)
      .limit(3);
    
    if (userError) {
      console.error('❌ User submissions test failed:', userError.message);
      return;
    }
    
    console.log(`✅ Found ${userSubmissions.length} submissions for test user`);
    console.log('');
    
    console.log('🎉 All Supabase backend tests passed!');
    console.log('\n📋 Summary:');
    console.log(`   • Total submissions: ${count}`);
    console.log(`   • Submissions needing user mapping: ${nullUserCount}`);
    console.log(`   • Database connection: ✅ Working`);
    console.log(`   • Query operations: ✅ Working`);
    
  } catch (error) {
    console.error('💥 Test failed with exception:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testSupabaseBackend()
    .then(() => {
      console.log('\n✨ Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testSupabaseBackend };
