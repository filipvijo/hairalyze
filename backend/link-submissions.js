const { supabase } = require('./supabase');

async function linkSubmissionsByOriginalUserId(originalUserId, newSupabaseUserId) {
  try {
    console.log(`🔗 Linking submissions from Firebase user: ${originalUserId}`);
    console.log(`   To Supabase user: ${newSupabaseUserId}`);
    console.log('=' .repeat(60));
    
    // First, find all submissions for this original user ID
    const { data: submissions, error: fetchError } = await supabase
      .from('submissions')
      .select('*')
      .eq('original_user_id', originalUserId)
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Error fetching submissions:', fetchError.message);
      return false;
    }
    
    console.log(`📊 Found ${submissions.length} submissions to link`);
    
    if (submissions.length === 0) {
      console.log('ℹ️  No submissions found for this original user ID');
      return true;
    }
    
    // Show what we're about to link
    console.log('\n📋 Submissions to be linked:');
    submissions.forEach((sub, index) => {
      console.log(`   ${index + 1}. ${sub.hair_problem || 'No problem'} - ${sub.created_at}`);
      if (sub.additional_concerns && sub.additional_concerns !== 'none') {
        console.log(`      Concerns: ${sub.additional_concerns}`);
      }
    });
    
    // Update all submissions to link to the new user
    const submissionIds = submissions.map(sub => sub.id);
    
    console.log(`\n🔄 Updating ${submissionIds.length} submissions...`);
    
    const { data: updatedSubmissions, error: updateError } = await supabase
      .from('submissions')
      .update({ user_id: newSupabaseUserId })
      .in('id', submissionIds)
      .select('id, hair_problem, created_at');
    
    if (updateError) {
      console.error('❌ Error updating submissions:', updateError.message);
      return false;
    }
    
    console.log(`✅ Successfully linked ${updatedSubmissions.length} submissions!`);
    
    // Verify the link worked
    console.log('\n🔍 Verifying the link...');
    const { data: verifySubmissions, error: verifyError } = await supabase
      .from('submissions')
      .select('id, hair_problem, created_at')
      .eq('user_id', newSupabaseUserId)
      .order('created_at', { ascending: false });
    
    if (verifyError) {
      console.error('❌ Error verifying link:', verifyError.message);
      return false;
    }
    
    console.log(`✅ Verification: User now has ${verifySubmissions.length} total submissions`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error linking submissions:', error.message);
    return false;
  }
}

// If run directly
if (require.main === module) {
  const originalUserId = process.argv[2];
  const newSupabaseUserId = process.argv[3];
  
  if (!originalUserId || !newSupabaseUserId) {
    console.log('Usage: node link-submissions.js <original-firebase-user-id> <new-supabase-user-id>');
    console.log('');
    console.log('Example:');
    console.log('  node link-submissions.js 54apPY9Db0TnlDByRGoy9IIpAam2 f50d3829-738e-497d-84c3-2ec4a1a4dc47');
    process.exit(1);
  }
  
  linkSubmissionsByOriginalUserId(originalUserId, newSupabaseUserId)
    .then((success) => {
      if (success) {
        console.log('\n🎉 Linking completed successfully!');
        console.log('   The user can now log in and see all their submissions.');
      } else {
        console.log('\n❌ Linking failed!');
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { linkSubmissionsByOriginalUserId };
