const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://issquvzvnxwoieibzmtw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzc3F1dnp2bnh3b2llaWJ6bXR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjIyNzk3OSwiZXhwIjoyMDY3ODAzOTc5fQ.hhIgnggtiyUGf3JkLXWceTs4SWrb--slqenSpyqhOFQ';

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
