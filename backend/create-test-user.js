const { supabase } = require('./supabase');

async function createTestUser() {
  try {
    console.log('🧪 Creating test user for development...');
    
    const testEmail = 'test@hairalyze.com';
    const testPassword = 'testpassword123';
    
    // Try to create the user using the admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true // Skip email confirmation
    });
    
    if (error) {
      if (error.message.includes('already registered')) {
        console.log('✅ Test user already exists');
        
        // Try to get the existing user
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
        if (!listError) {
          const testUser = users.users.find(u => u.email === testEmail);
          if (testUser) {
            console.log(`📧 Test user ID: ${testUser.id}`);
            console.log(`📧 Test user email: ${testUser.email}`);
            console.log(`🔐 Test password: ${testPassword}`);
          }
        }
        return;
      } else {
        throw error;
      }
    }
    
    console.log('✅ Test user created successfully!');
    console.log(`📧 Email: ${testEmail}`);
    console.log(`🔐 Password: ${testPassword}`);
    console.log(`👤 User ID: ${data.user.id}`);
    
    // Update any existing submissions to link to this test user
    console.log('🔄 Linking existing test submissions...');
    const { data: updatedSubmissions, error: updateError } = await supabase
      .from('submissions')
      .update({ user_id: data.user.id })
      .eq('original_user_id', 'test-user')
      .select('id');
    
    if (updateError) {
      console.error('⚠️  Error linking submissions:', updateError.message);
    } else {
      console.log(`✅ Linked ${updatedSubmissions.length} submissions to test user`);
    }
    
  } catch (error) {
    console.error('❌ Failed to create test user:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the script
if (require.main === module) {
  createTestUser()
    .then(() => {
      console.log('\n🎉 Test user setup completed!');
      console.log('\n📋 You can now login with:');
      console.log('   Email: test@hairalyze.com');
      console.log('   Password: testpassword123');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test user setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createTestUser };
