const { supabase } = require('./supabase');

async function setUserPassword(email, newPassword) {
  try {
    console.log(`🔐 Setting password for: ${email}`);
    console.log('=' .repeat(50));
    
    // First, find the user
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      return false;
    }
    
    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error('❌ User not found');
      return false;
    }
    
    console.log(`✅ User found: ${user.id}`);
    
    // Update the user's password and confirm their email
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
      email_confirm: true // Confirm their email so they can log in immediately
    });
    
    if (error) {
      console.error('❌ Error updating password:', error.message);
      return false;
    }
    
    console.log('✅ Password updated successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔐 New Password: ${newPassword}`);
    console.log('📧 Email confirmed: Yes (can log in immediately)');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error setting password:', error.message);
    return false;
  }
}

// If run directly
if (require.main === module) {
  const email = process.argv[2];
  const password = process.argv[3] || 'HairAnalyze2025!';
  
  if (!email) {
    console.log('Usage: node set-password.js <email> [password]');
    console.log('Example: node set-password.js anamasojevic@gmail.com MyNewPass123');
    console.log('If no password provided, will use: HairAnalyze2025!');
    process.exit(1);
  }
  
  setUserPassword(email, password)
    .then((success) => {
      if (success) {
        console.log('\n🎉 Password set successfully!');
        console.log('   The user can now log in with their email and new password.');
      } else {
        console.log('\n❌ Failed to set password!');
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { setUserPassword };
