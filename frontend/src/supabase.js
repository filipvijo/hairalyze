import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://issquvzvnxwoieibzmtw.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzc3F1dnp2bnh3b2llaWJ6bXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMjc5NzksImV4cCI6MjA2NzgwMzk3OX0.ElMz-PbGfbdRTdXDGM9JahKKmGQTeiMvKMIpz2u3nf8';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('submissions').select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase frontend connection successful');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection exception:', err.message);
    return false;
  }
};
