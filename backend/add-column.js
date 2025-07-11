const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://issquvzvnxwoieibzmtw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzc3F1dnp2bnh3b2llaWJ6bXR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjIyNzk3OSwiZXhwIjoyMDY3ODAzOTc5fQ.hhIgnggtiyUGf3JkLXWceTs4SWrb--slqenSpyqhOFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addColumn() {
  try {
    console.log('Adding original_user_id column...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE submissions ADD COLUMN IF NOT EXISTS original_user_id TEXT;'
    });
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('✅ Column added successfully');
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

addColumn();
