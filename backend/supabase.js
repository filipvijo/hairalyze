const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://issquvzvnxwoieibzmtw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with service role key for backend operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection function
async function testSupabaseConnection() {
  try {
    const { count, error } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
      return false;
    }

    console.log(`✅ Supabase connection successful - Found ${count} submissions`);
    return true;
  } catch (err) {
    console.error('❌ Supabase connection exception:', err.message);
    return false;
  }
}

module.exports = { 
  supabase,
  testSupabaseConnection
};
