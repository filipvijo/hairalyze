// Test script to check Supabase auth
import { supabase } from './supabase';

export const testAuth = async () => {
  try {
    console.log('🧪 Testing Supabase Auth...');
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return;
    }
    
    if (!session) {
      console.log('⚠️  No active session');
      return;
    }
    
    console.log('✅ Session found:');
    console.log('   User ID:', session.user.id);
    console.log('   Email:', session.user.email);
    console.log('   Token length:', session.access_token.length);
    console.log('   Token preview:', session.access_token.substring(0, 50) + '...');
    
    // Test API call
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    console.log('🔧 Test using API URL:', apiUrl);
    
    const response = await fetch(`${apiUrl}/api/submissions`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'X-User-ID': session.user.id,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 API Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful, submissions:', data.length);
    } else {
      const errorText = await response.text();
      console.error('❌ API call failed:', errorText);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
};

// Auto-run test if in development
if (process.env.NODE_ENV === 'development') {
  // Run test after a short delay to allow auth to initialize
  setTimeout(testAuth, 2000);
}
