const mongoose = require('mongoose');

// Define a nested schema for the analysis structure
const analysisSchema = new mongoose.Schema({
  // Raw analysis text from Grok Vision
  rawAnalysis: { type: String, default: '' },

  // Structured analysis data
  detailedAnalysis: { type: String, default: '' },

  // Hair metrics (for visualization)
  metrics: {
    moisture: { type: Number, default: 0 },
    strength: { type: Number, default: 0 },
    elasticity: { type: Number, default: 0 },
    scalpHealth: { type: Number, default: 0 }
  },

  // Hair care routine recommendations
  haircareRoutine: {
    cleansing: { type: String, default: '' },
    conditioning: { type: String, default: '' },
    treatments: { type: String, default: '' },
    styling: { type: String, default: '' }
  },

  // Detailed routine schedule with step-by-step instructions
  routineSchedule: {
    dailyRoutine: {
      morning: [{ type: String }], // Array of morning routine steps
      evening: [{ type: String }]  // Array of evening routine steps
    },
    weeklyRoutine: {
      washDays: {
        frequency: { type: String, default: '' }, // e.g., "2-3 times per week"
        steps: [{ type: String }] // Array of wash day steps
      },
      treatments: {
        deepConditioning: { type: String, default: '' },
        scalpCare: { type: String, default: '' },
        specialTreatments: { type: String, default: '' }
      }
    }
  },

  // Product suggestions
  productSuggestions: [{ type: String }],

  // Bonus tips
  aiBonusTips: [{ type: String }]
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  hairProblem: { type: String, required: false, default: '' }, // Made optional
  allergies: { type: String, default: '' },
  medication: { type: String, default: '' },
  dyed: { type: String, default: '' }, // Made optional
  washFrequency: { type: String, default: '' }, // Made optional
  additionalConcerns: { type: String, default: '' }, // User's specific concerns
  hairPhotos: [{ type: String }], // Array of S3 URLs for hair photos
  hairPhotoAnalysis: [{ type: String }], // Raw analyses for hair photos
  productImages: [{ type: String }], // Array of S3 URLs for product images
  productImageAnalysis: [{ type: String }], // Raw analyses for product images
  productNames: [{ type: String }],

  // Add the structured analysis
  analysis: { type: analysisSchema, default: () => ({}) }
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

module.exports = mongoose.model('Submission', submissionSchema);
