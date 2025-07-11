const { supabase } = require('./supabase');

async function searchSubmissionsByEmail(email) {
  try {
    console.log(`🔍 Searching for submissions containing: ${email}`);
    console.log('=' .repeat(50));
    
    // Get all submissions and search through their data
    const { data: allSubmissions, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching submissions:', error.message);
      return [];
    }
    
    console.log(`📊 Searching through ${allSubmissions.length} total submissions...`);
    
    // Search for email in various fields
    const matches = allSubmissions.filter(sub => {
      const submissionStr = JSON.stringify(sub).toLowerCase();
      const emailLower = email.toLowerCase();
      
      // Check if email appears anywhere in the submission data
      return submissionStr.includes(emailLower);
    });
    
    console.log(`🎯 Found ${matches.length} submissions containing "${email}"`);
    
    if (matches.length > 0) {
      console.log('\n📋 Matching submissions:');
      matches.forEach((sub, index) => {
        console.log(`\n   ${index + 1}. Submission ID: ${sub.id}`);
        console.log(`      Original User ID: ${sub.original_user_id || 'null'}`);
        console.log(`      Current User ID: ${sub.user_id || 'null'}`);
        console.log(`      Hair Problem: ${sub.hair_problem || 'none'}`);
        console.log(`      Created: ${sub.created_at}`);
        console.log(`      Additional Concerns: ${sub.additional_concerns || 'none'}`);
        
        // Check if email appears in analysis data
        if (sub.analysis) {
          const analysisStr = JSON.stringify(sub.analysis).toLowerCase();
          if (analysisStr.includes(email.toLowerCase())) {
            console.log(`      📧 Email found in analysis data`);
          }
        }
      });
    }
    
    return matches;
    
  } catch (error) {
    console.error('❌ Error searching submissions:', error.message);
    return [];
  }
}

async function searchByOriginalUserId(originalUserId) {
  try {
    console.log(`\n🔍 Searching by original user ID: ${originalUserId}`);
    
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('original_user_id', originalUserId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching by original user ID:', error.message);
      return [];
    }
    
    console.log(`📊 Found ${submissions.length} submissions for original user ID: ${originalUserId}`);
    
    if (submissions.length > 0) {
      console.log('\n📋 Submissions for this original user ID:');
      submissions.forEach((sub, index) => {
        console.log(`   ${index + 1}. ${sub.hair_problem || 'No problem'} (${sub.created_at})`);
      });
    }
    
    return submissions;
    
  } catch (error) {
    console.error('❌ Error searching by original user ID:', error.message);
    return [];
  }
}

async function showOrphanedSubmissions() {
  try {
    console.log(`\n🔍 Showing all orphaned submissions (user_id = null):`);
    console.log('=' .repeat(50));
    
    const { data: orphaned, error } = await supabase
      .from('submissions')
      .select('id, original_user_id, hair_problem, additional_concerns, created_at')
      .is('user_id', null)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching orphaned submissions:', error.message);
      return [];
    }
    
    console.log(`📊 Found ${orphaned.length} orphaned submissions`);
    
    if (orphaned.length > 0) {
      console.log('\n📋 All orphaned submissions:');
      orphaned.forEach((sub, index) => {
        console.log(`\n   ${index + 1}. Submission ID: ${sub.id.substring(0, 8)}...`);
        console.log(`      Original User ID: ${sub.original_user_id || 'null'}`);
        console.log(`      Hair Problem: ${sub.hair_problem || 'none'}`);
        console.log(`      Additional Concerns: ${sub.additional_concerns || 'none'}`);
        console.log(`      Created: ${sub.created_at}`);
      });
    }
    
    return orphaned;
    
  } catch (error) {
    console.error('❌ Error fetching orphaned submissions:', error.message);
    return [];
  }
}

// If run directly
if (require.main === module) {
  const email = process.argv[2];
  const originalUserId = process.argv[3];
  
  if (!email && !originalUserId) {
    console.log('Usage:');
    console.log('  node search-submissions.js <email>');
    console.log('  node search-submissions.js <email> <original-user-id>');
    console.log('  node search-submissions.js --orphaned');
    console.log('');
    console.log('Examples:');
    console.log('  node search-submissions.js artmediagb@gmail.com');
    console.log('  node search-submissions.js artmediagb@gmail.com abc123');
    console.log('  node search-submissions.js --orphaned');
    process.exit(1);
  }
  
  async function run() {
    if (email === '--orphaned') {
      await showOrphanedSubmissions();
    } else {
      const emailMatches = await searchSubmissionsByEmail(email);
      
      if (originalUserId) {
        await searchByOriginalUserId(originalUserId);
      }
      
      if (emailMatches.length === 0 && !originalUserId) {
        console.log('\n💡 No matches found by email. Showing all orphaned submissions...');
        await showOrphanedSubmissions();
      }
    }
  }
  
  run()
    .then(() => {
      console.log('\n✅ Search completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { searchSubmissionsByEmail, searchByOriginalUserId, showOrphanedSubmissions };
