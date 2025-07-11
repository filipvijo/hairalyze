const { supabase } = require('./supabase');

async function checkUserStatus(email) {
  try {
    console.log(`🔍 Checking status for: ${email}`);
    console.log('=' .repeat(50));
    
    // Check if user exists in Supabase Auth
    console.log('1️⃣ Checking Supabase Auth...');
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      return;
    }
    
    const user = users.users.find(u => u.email === email);
    
    if (user) {
      console.log('✅ User found in Supabase Auth:');
      console.log(`   User ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`   Last Sign In: ${user.last_sign_in_at || 'Never'}`);
      
      // Check for submissions linked to this user
      console.log('\n2️⃣ Checking for submissions...');
      const { data: submissions, error: subError } = await supabase
        .from('submissions')
        .select('id, hair_problem, created_at, original_user_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (subError) {
        console.error('❌ Error fetching submissions:', subError.message);
      } else {
        console.log(`📊 Found ${submissions.length} submissions for this user`);
        
        if (submissions.length > 0) {
          console.log('\n📋 Submissions:');
          submissions.forEach((sub, index) => {
            console.log(`   ${index + 1}. ${sub.hair_problem || 'No problem specified'} (${sub.created_at})`);
          });
        }
      }
      
      // Check for orphaned submissions (null user_id but might belong to this user)
      console.log('\n3️⃣ Checking for orphaned submissions...');
      const { data: orphaned, error: orphanError } = await supabase
        .from('submissions')
        .select('id, hair_problem, created_at, original_user_id')
        .is('user_id', null)
        .order('created_at', { ascending: false });
      
      if (orphanError) {
        console.error('❌ Error fetching orphaned submissions:', orphanError.message);
      } else {
        console.log(`🔍 Found ${orphaned.length} orphaned submissions (user_id = null)`);
        
        if (orphaned.length > 0) {
          console.log('\n📋 Orphaned submissions (might need manual linking):');
          orphaned.slice(0, 5).forEach((sub, index) => {
            console.log(`   ${index + 1}. Original User ID: ${sub.original_user_id} | Problem: ${sub.hair_problem || 'none'} | Date: ${sub.created_at}`);
          });
          if (orphaned.length > 5) {
            console.log(`   ... and ${orphaned.length - 5} more`);
          }
        }
      }
      
    } else {
      console.log('❌ User not found in Supabase Auth');
      console.log('   This user needs to be created manually');
    }
    
  } catch (error) {
    console.error('❌ Error checking user status:', error.message);
  }
}

// If run directly
if (require.main === module) {
  const email = process.argv[2];
  
  if (!email) {
    console.log('Usage: node check-user.js <email>');
    console.log('Example: node check-user.js anamasojevic@gmail.com');
    process.exit(1);
  }
  
  checkUserStatus(email)
    .then(() => {
      console.log('\n✅ Check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { checkUserStatus };
