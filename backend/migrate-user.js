const { supabase } = require('./supabase');

async function findUserSubmissions(email) {
  try {
    console.log(`🔍 Searching for submissions for email: ${email}`);
    
    // First, let's check if there are any submissions with this email in the analysis data
    // Since we don't store email directly, we'll need to search through all submissions
    const { data: allSubmissions, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching submissions:', error.message);
      return null;
    }
    
    console.log(`📊 Found ${allSubmissions.length} total submissions in database`);
    
    // Look for submissions that might belong to this user
    // We'll check original_user_id and any analysis data that might contain email
    const possibleMatches = allSubmissions.filter(sub => {
      // Check if email appears anywhere in the submission data
      const submissionStr = JSON.stringify(sub).toLowerCase();
      return submissionStr.includes(email.toLowerCase());
    });
    
    console.log(`🎯 Found ${possibleMatches.length} possible matches for ${email}`);
    
    if (possibleMatches.length > 0) {
      console.log('\n📋 Possible matches:');
      possibleMatches.forEach((sub, index) => {
        console.log(`   ${index + 1}. ID: ${sub.id}`);
        console.log(`      Original User ID: ${sub.original_user_id}`);
        console.log(`      Hair Problem: ${sub.hair_problem || 'none'}`);
        console.log(`      Created: ${sub.created_at}`);
        console.log(`      Current User ID: ${sub.user_id || 'null'}`);
        console.log('');
      });
    }
    
    return possibleMatches;
    
  } catch (error) {
    console.error('❌ Error searching for user:', error.message);
    return null;
  }
}

async function createSupabaseUser(email, tempPassword = 'TempPass123!') {
  try {
    console.log(`👤 Creating Supabase user for: ${email}`);
    
    // Create user using Supabase Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true // Skip email confirmation for manual migration
    });
    
    if (error) {
      console.error('❌ Error creating user:', error.message);
      return null;
    }
    
    console.log('✅ User created successfully!');
    console.log(`   User ID: ${data.user.id}`);
    console.log(`   Email: ${data.user.email}`);
    console.log(`   Temporary Password: ${tempPassword}`);
    
    return data.user;
    
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    return null;
  }
}

async function linkSubmissionsToUser(submissions, newUserId) {
  try {
    console.log(`🔗 Linking ${submissions.length} submissions to user: ${newUserId}`);
    
    const submissionIds = submissions.map(sub => sub.id);
    
    const { data, error } = await supabase
      .from('submissions')
      .update({ user_id: newUserId })
      .in('id', submissionIds)
      .select('id');
    
    if (error) {
      console.error('❌ Error linking submissions:', error.message);
      return false;
    }
    
    console.log(`✅ Successfully linked ${data.length} submissions to user`);
    return true;
    
  } catch (error) {
    console.error('❌ Error linking submissions:', error.message);
    return false;
  }
}

async function migrateUser(email, tempPassword = 'TempPass123!') {
  try {
    console.log(`\n🚀 Starting migration for: ${email}`);
    console.log('=' .repeat(50));
    
    // Step 1: Find existing submissions
    const submissions = await findUserSubmissions(email);
    if (!submissions) {
      console.log('❌ Failed to search for submissions');
      return false;
    }
    
    if (submissions.length === 0) {
      console.log(`ℹ️  No submissions found for ${email}`);
      console.log('   You can still create the user account if needed.');
    }
    
    // Step 2: Create Supabase user
    const newUser = await createSupabaseUser(email, tempPassword);
    if (!newUser) {
      console.log('❌ Failed to create user');
      return false;
    }
    
    // Step 3: Link submissions (if any)
    if (submissions.length > 0) {
      const linked = await linkSubmissionsToUser(submissions, newUser.id);
      if (!linked) {
        console.log('⚠️  User created but failed to link submissions');
        return false;
      }
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔐 Temporary Password: ${tempPassword}`);
    console.log(`👤 New User ID: ${newUser.id}`);
    console.log(`📊 Linked Submissions: ${submissions.length}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

// If run directly, migrate the specified user
if (require.main === module) {
  const email = process.argv[2];
  const password = process.argv[3];
  
  if (!email) {
    console.log('Usage: node migrate-user.js <email> [password]');
    console.log('Example: node migrate-user.js anamasojevic@gmail.com MyNewPass123');
    process.exit(1);
  }
  
  migrateUser(email, password)
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { findUserSubmissions, createSupabaseUser, linkSubmissionsToUser, migrateUser };
