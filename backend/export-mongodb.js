const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import the Submission model
const { Submission } = require('./models');

async function exportMongoData() {
  try {
    console.log('🔄 Starting MongoDB data export...');
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
    });
    console.log('✅ Connected to MongoDB successfully');

    // Fetch all submissions
    console.log('📊 Fetching submissions...');
    const submissions = await Submission.find({}).lean();
    console.log(`📋 Found ${submissions.length} submissions to export`);

    if (submissions.length === 0) {
      console.log('ℹ️  No submissions found to export');
      await mongoose.disconnect();
      return;
    }

    // Transform data for Supabase PostgreSQL format
    console.log('🔄 Transforming data for Supabase...');
    const transformedData = submissions.map((sub, index) => {
      console.log(`   Processing submission ${index + 1}/${submissions.length}`);
      
      return {
        // Convert MongoDB _id to string (we'll generate new UUIDs in Supabase)
        mongodb_id: sub._id.toString(),
        user_id: sub.userId, // This will need to be mapped to Supabase user IDs
        
        // Questionnaire data
        hair_problem: sub.hairProblem || '',
        allergies: sub.allergies || '',
        medication: sub.medication || '',
        dyed: sub.dyed || '',
        wash_frequency: sub.washFrequency || '',
        additional_concerns: sub.additionalConcerns || '',
        
        // Image arrays
        hair_photos: sub.hairPhotos || [],
        hair_photo_analysis: sub.hairPhotoAnalysis || [],
        product_images: sub.productImages || [],
        product_image_analysis: sub.productImageAnalysis || [],
        product_names: sub.productNames || [],
        
        // Analysis data (already in correct format)
        analysis: sub.analysis || {
          rawAnalysis: '',
          detailedAnalysis: '',
          metrics: {
            moisture: 0,
            strength: 0,
            elasticity: 0,
            scalpHealth: 0
          },
          haircareRoutine: {
            cleansing: '',
            conditioning: '',
            treatments: '',
            styling: ''
          },
          routineSchedule: {
            dailyRoutine: {
              morning: [],
              evening: []
            },
            weeklyRoutine: {
              washDays: {
                frequency: '',
                steps: []
              },
              treatments: {
                deepConditioning: '',
                scalpCare: '',
                specialTreatments: ''
              }
            }
          },
          productSuggestions: [],
          aiBonusTips: []
        },
        
        // Timestamps
        created_at: sub.createdAt ? sub.createdAt.toISOString() : new Date().toISOString(),
        updated_at: sub.updatedAt ? sub.updatedAt.toISOString() : new Date().toISOString()
      };
    });

    // Create migration directory if it doesn't exist
    const migrationDir = path.join(__dirname);
    if (!fs.existsSync(migrationDir)) {
      fs.mkdirSync(migrationDir, { recursive: true });
    }

    // Save transformed data to JSON file
    const exportPath = path.join(migrationDir, 'submissions-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(transformedData, null, 2));
    
    console.log('✅ Data export completed successfully!');
    console.log(`📁 Exported ${transformedData.length} submissions to: ${exportPath}`);
    
    // Create a summary report
    const uniqueUsers = [...new Set(transformedData.map(sub => sub.user_id))];
    const summary = {
      totalSubmissions: transformedData.length,
      uniqueUsers: uniqueUsers.length,
      userIds: uniqueUsers,
      exportDate: new Date().toISOString(),
      sampleSubmission: transformedData[0] || null
    };
    
    const summaryPath = path.join(migrationDir, 'export-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`📊 Export summary saved to: ${summaryPath}`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Ensure we disconnect even on error
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    process.exit(1);
  }
}

// Run the export
if (require.main === module) {
  exportMongoData()
    .then(() => {
      console.log('🎉 Export process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Export process failed:', error);
      process.exit(1);
    });
}

module.exports = { exportMongoData };
