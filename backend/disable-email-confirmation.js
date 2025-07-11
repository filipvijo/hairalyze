const { supabase } = require('./supabase');

async function disableEmailConfirmation() {
  try {
    console.log('🔧 Attempting to configure Supabase auth settings...');
    console.log('=' .repeat(50));
    
    // Note: This script demonstrates how to handle users without email confirmation
    // The actual email confirmation setting needs to be changed in Supabase Dashboard
    
    console.log('📋 Instructions to disable email confirmation:');
    console.log('1. Go to https://supabase.com/dashboard/project/issquvzvnxwoieibzmtw');
    console.log('2. Navigate to Authentication > Settings');
    console.log('3. Under "User Signups", toggle OFF "Enable email confirmations"');
    console.log('4. Save the changes');
    console.log('');
    console.log('🔄 Alternative: Auto-confirm existing users...');
    
    // Get all users who need email confirmation
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      return false;
    }
    
    console.log(`📊 Found ${users.users.length} total users`);
    
    // Find users who haven't confirmed their email
    const unconfirmedUsers = users.users.filter(user => !user.email_confirmed_at);
    
    console.log(`📧 Found ${unconfirmedUsers.length} users with unconfirmed emails`);
    
    if (unconfirmedUsers.length > 0) {
      console.log('\n🔄 Auto-confirming unconfirmed users...');
      
      for (const user of unconfirmedUsers) {
        try {
          console.log(`   Confirming: ${user.email}`);
          
          const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
            email_confirm: true
          });
          
          if (updateError) {
            console.error(`   ❌ Failed to confirm ${user.email}:`, updateError.message);
          } else {
            console.log(`   ✅ Confirmed: ${user.email}`);
          }
        } catch (err) {
          console.error(`   ❌ Error confirming ${user.email}:`, err.message);
        }
      }
    }
    
    console.log('\n✅ Process completed!');
    console.log('🔧 Remember to disable email confirmation in Supabase Dashboard for new users');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  disableEmailConfirmation()
    .then(() => {
      console.log('\n🏁 Script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { disableEmailConfirmation };
