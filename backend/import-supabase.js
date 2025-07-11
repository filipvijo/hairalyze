const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = 'https://issquvzvnxwoieibzmtw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzc3F1dnp2bnh3b2llaWJ6bXR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjIyNzk3OSwiZXhwIjoyMDY3ODAzOTc5fQ.hhIgnggtiyUGf3JkLXWceTs4SWrb--slqenSpyqhOFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importDataToSupabase() {
  try {
    console.log('🔄 Starting Supabase data import...');
    
    // Read the exported data
    const exportPath = path.join(__dirname, 'submissions-export.json');
    if (!fs.existsSync(exportPath)) {
      throw new Error('Export file not found. Please run export-mongodb.js first.');
    }
    
    console.log('📖 Reading exported data...');
    const exportedData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    console.log(`📊 Found ${exportedData.length} submissions to import`);
    
    if (exportedData.length === 0) {
      console.log('ℹ️  No data to import');
      return;
    }
    
    // Create a mapping for user IDs (Firebase -> Supabase)
    // For now, we'll create placeholder users or skip user_id validation
    console.log('🔄 Processing user mappings...');
    
    const uniqueUserIds = [...new Set(exportedData.map(sub => sub.user_id))];
    console.log(`👥 Found ${uniqueUserIds.length} unique users:`, uniqueUserIds);
    
    // Transform data for Supabase import
    console.log('🔄 Transforming data for Supabase import...');
    const transformedData = exportedData.map((sub, index) => {
      if ((index + 1) % 10 === 0) {
        console.log(`   Processing ${index + 1}/${exportedData.length}`);
      }
      
      return {
        // Note: We'll temporarily set user_id to null and handle user mapping later
        // In a real migration, you'd need to create users in Supabase Auth first
        user_id: null, // Will be updated after user creation
        original_user_id: sub.user_id, // Keep track of original Firebase user ID
        
        hair_problem: sub.hair_problem,
        allergies: sub.allergies,
        medication: sub.medication,
        dyed: sub.dyed,
        wash_frequency: sub.wash_frequency,
        additional_concerns: sub.additional_concerns,
        
        hair_photos: sub.hair_photos,
        hair_photo_analysis: sub.hair_photo_analysis,
        product_images: sub.product_images,
        product_image_analysis: sub.product_image_analysis,
        product_names: sub.product_names,
        
        analysis: sub.analysis,
        
        created_at: sub.created_at,
        updated_at: sub.updated_at
      };
    });
    
    // Import data in batches to avoid timeout
    console.log('📤 Starting batch import to Supabase...');
    const batchSize = 10;
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batch = transformedData.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(transformedData.length / batchSize);
      
      console.log(`📦 Importing batch ${batchNumber}/${totalBatches} (${batch.length} items)`);
      
      try {
        const { data, error } = await supabase
          .from('submissions')
          .insert(batch)
          .select('id');
        
        if (error) {
          console.error(`❌ Batch ${batchNumber} failed:`, error.message);
          errorCount += batch.length;
          errors.push({
            batch: batchNumber,
            error: error.message,
            items: batch.length
          });
        } else {
          console.log(`✅ Batch ${batchNumber} imported successfully (${data.length} items)`);
          successCount += data.length;
        }
        
        // Small delay between batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (batchError) {
        console.error(`💥 Batch ${batchNumber} exception:`, batchError.message);
        errorCount += batch.length;
        errors.push({
          batch: batchNumber,
          error: batchError.message,
          items: batch.length
        });
      }
    }
    
    // Create import summary
    const summary = {
      totalProcessed: transformedData.length,
      successfulImports: successCount,
      failedImports: errorCount,
      errors: errors,
      importDate: new Date().toISOString(),
      userMappingNote: 'User IDs set to null - need to be mapped after Supabase Auth migration'
    };
    
    const summaryPath = path.join(__dirname, 'import-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log('\n📊 Import Summary:');
    console.log(`✅ Successfully imported: ${successCount} submissions`);
    console.log(`❌ Failed imports: ${errorCount} submissions`);
    console.log(`📁 Summary saved to: ${summaryPath}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      errors.forEach(err => {
        console.log(`   Batch ${err.batch}: ${err.error} (${err.items} items)`);
      });
    }
    
    console.log('\n🎉 Import process completed!');
    
    if (successCount > 0) {
      console.log('\n📋 Next steps:');
      console.log('1. Verify data in Supabase dashboard');
      console.log('2. Set up user authentication migration');
      console.log('3. Update user_id fields after auth migration');
    }
    
  } catch (error) {
    console.error('💥 Import failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  importDataToSupabase()
    .then(() => {
      console.log('🏁 Import script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Import script failed:', error);
      process.exit(1);
    });
}

module.exports = { importDataToSupabase };
