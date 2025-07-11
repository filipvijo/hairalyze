const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const axios = require('axios');
const { body, validationResult } = require('express-validator');

// Supabase integration
const { supabase, testSupabaseConnection } = require('./supabase');
const { authenticateUser, authenticateUserLegacy } = require('./middleware/auth');

// Legacy imports (will be removed after migration)
const { Submission } = require('./models');
const admin = require('firebase-admin');

dotenv.config();
const app = express();

// Initialize Firebase Admin SDK
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin initialized successfully');
  }
} catch (error) {
  console.error('Firebase Admin initialization failed:', error.message);
  console.warn('SECURITY: Firebase initialization failed');
}

// Note: Authentication middleware now imported from ./middleware/auth.js
// Using new Supabase authentication by default, with legacy Firebase fallback

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Allow requests from the frontend URL or all origins in development
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID'] // Add X-User-ID for development authentication
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// S3 Client setup
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // Limit each file to 20MB
});

// Function to upload file to S3
const uploadToS3 = async (file, folder) => {
  try {
    console.log(`Uploading file to S3: ${file.originalname} to folder ${folder}`);
    console.log(`S3 Configuration: Bucket=${process.env.AWS_S3_BUCKET}, Region=${process.env.AWS_REGION}`);

    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    console.log(`S3 params prepared: Key=${fileName}, ContentType=${file.mimetype}`);
    const command = new PutObjectCommand(params);

    console.log('Sending command to S3...');
    await s3Client.send(command);

    const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    console.log(`File uploaded successfully: ${url}`);
    return url;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    console.error('Error details:', error.message);
    if (error.code) console.error('AWS Error Code:', error.code);
    if (error.$metadata) console.error('AWS Metadata:', error.$metadata);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

// Function to parse the Grok Vision API response into structured data
const parseGrokAnalysis = (analysisText, userData = {}) => {
  // Initialize the structured data object
  const structuredAnalysis = {
    rawAnalysis: analysisText,
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
  };

  try {
    // Extract AI Description section
    const aiDescriptionMatch = analysisText.match(/\*\*AI Description\*\*([\s\S]*?)(?=\*\*Hair Care Routine\*\*|$)/i);
    if (aiDescriptionMatch && aiDescriptionMatch[1]) {
      structuredAnalysis.detailedAnalysis = aiDescriptionMatch[1].trim();

      // Estimate metrics based on the description and user input
      // This is an enhanced approach that considers both the AI analysis and user-provided information
      const description = aiDescriptionMatch[1].toLowerCase();
      const hairProblem = (userData.hairProblem || '').toLowerCase();
      const washFrequency = (userData.washFrequency || '').toLowerCase();
      const isDyed = (userData.dyed || '').toLowerCase() === 'yes';

      // Moisture score - consider both description and user input
      let moistureScore = 50; // Start with default

      // Adjust based on description
      if (description.includes('very dry') || description.includes('extremely dry')) {
        moistureScore -= 30;
      } else if (description.includes('dry')) {
        moistureScore -= 15;
      } else if (description.includes('well moisturized') || description.includes('well-moisturized')) {
        moistureScore += 30;
      } else if (description.includes('moisturized') || description.includes('hydrated')) {
        moistureScore += 20;
      }

      // Adjust based on user input
      if (hairProblem.includes('dry')) {
        moistureScore -= 15;
      } else if (hairProblem.includes('oily')) {
        moistureScore += 10;
      }

      // Adjust based on wash frequency
      if (washFrequency.includes('daily') || washFrequency.includes('every day')) {
        moistureScore -= 10; // Frequent washing can reduce moisture
      }

      // Adjust for dyed hair
      if (isDyed) {
        moistureScore -= 10; // Dyed hair tends to be drier
      }

      // Ensure score is within bounds
      structuredAnalysis.metrics.moisture = Math.max(10, Math.min(100, moistureScore));

      // Strength score - consider both description and user input
      let strengthScore = 60; // Start with default

      // Adjust based on description
      if (description.includes('very brittle') || description.includes('extremely brittle') || description.includes('very weak')) {
        strengthScore -= 30;
      } else if (description.includes('brittle') || description.includes('weak')) {
        strengthScore -= 20;
      } else if (description.includes('very strong') || description.includes('extremely strong')) {
        strengthScore += 30;
      } else if (description.includes('strong')) {
        strengthScore += 15;
      }

      // Adjust based on user input
      if (hairProblem.includes('breakage') || hairProblem.includes('brittle')) {
        strengthScore -= 20;
      } else if (hairProblem.includes('split ends')) {
        strengthScore -= 15;
      }

      // Adjust for dyed hair
      if (isDyed) {
        strengthScore -= 15; // Chemical processing reduces strength
      }

      // Ensure score is within bounds
      structuredAnalysis.metrics.strength = Math.max(10, Math.min(100, strengthScore));

      // Elasticity score - consider both description and user input
      let elasticityScore = 60; // Start with default

      // Adjust based on description
      if (description.includes('no elasticity') || description.includes('lacks elasticity')) {
        elasticityScore -= 30;
      } else if (description.includes('low elasticity') || description.includes('poor elasticity')) {
        elasticityScore -= 20;
      } else if (description.includes('excellent elasticity') || description.includes('great elasticity')) {
        elasticityScore += 30;
      } else if (description.includes('good elasticity')) {
        elasticityScore += 15;
      }

      // Adjust based on user input
      if (hairProblem.includes('breakage') || hairProblem.includes('brittle')) {
        elasticityScore -= 15;
      }

      // Adjust for dyed hair
      if (isDyed) {
        elasticityScore -= 10; // Chemical processing reduces elasticity
      }

      // Ensure score is within bounds
      structuredAnalysis.metrics.elasticity = Math.max(10, Math.min(100, elasticityScore));

      // Scalp health score - consider both description and user input
      let scalpHealthScore = 70; // Start with default

      // Adjust based on description
      if (description.includes('very dry scalp') || description.includes('flaky scalp') || description.includes('dandruff')) {
        scalpHealthScore -= 30;
      } else if (description.includes('dry scalp') || description.includes('itchy scalp')) {
        scalpHealthScore -= 20;
      } else if (description.includes('healthy scalp') || description.includes('clean scalp')) {
        scalpHealthScore += 15;
      }

      // Adjust based on user input
      if (hairProblem.includes('dandruff') || hairProblem.includes('flaky')) {
        scalpHealthScore -= 25;
      } else if (hairProblem.includes('itchy') || hairProblem.includes('irritated')) {
        scalpHealthScore -= 20;
      } else if (hairProblem.includes('oily scalp')) {
        scalpHealthScore -= 15;
      }

      // Adjust based on wash frequency
      if (washFrequency.includes('once a week') || washFrequency.includes('weekly')) {
        scalpHealthScore -= 10; // Infrequent washing might affect scalp health
      } else if (washFrequency.includes('daily')) {
        scalpHealthScore += 5; // Regular cleansing can help scalp health
      }

      // Ensure score is within bounds
      structuredAnalysis.metrics.scalpHealth = Math.max(10, Math.min(100, scalpHealthScore));
    }

    // Extract Hair Care Routine section
    const routineMatch = analysisText.match(/\*\*Hair Care Routine\*\*([\s\S]*?)(?=\*\*Product Suggestions\*\*|$)/i);
    if (routineMatch && routineMatch[1]) {
      const routineText = routineMatch[1].trim();

      // Extract cleansing recommendations
      const cleansingMatch = routineText.match(/(?:1\.|Cleansing:|\*\*Cleansing:\*\*)([\s\S]*?)(?=(?:2\.|Conditioning:|\*\*Conditioning:\*\*)|$)/i);
      if (cleansingMatch && cleansingMatch[1]) {
        structuredAnalysis.haircareRoutine.cleansing = cleansingMatch[1].trim();
      }

      // Extract conditioning recommendations
      const conditioningMatch = routineText.match(/(?:2\.|Conditioning:|\*\*Conditioning:\*\*)([\s\S]*?)(?=(?:3\.|Treatments:|\*\*Treatments:\*\*)|$)/i);
      if (conditioningMatch && conditioningMatch[1]) {
        structuredAnalysis.haircareRoutine.conditioning = conditioningMatch[1].trim();
      }

      // Extract treatments recommendations
      const treatmentsMatch = routineText.match(/(?:3\.|Treatments:|\*\*Treatments:\*\*)([\s\S]*?)(?=(?:4\.|Styling:|\*\*Styling:\*\*)|$)/i);
      if (treatmentsMatch && treatmentsMatch[1]) {
        structuredAnalysis.haircareRoutine.treatments = treatmentsMatch[1].trim();
      }

      // Extract styling recommendations
      const stylingMatch = routineText.match(/(?:4\.|Styling:|\*\*Styling:\*\*)([\s\S]*?)(?=\*\*|$)/i);
      if (stylingMatch && stylingMatch[1]) {
        structuredAnalysis.haircareRoutine.styling = stylingMatch[1].trim();
      }
    }

    // Extract Daily/Weekly Hair Care Schedule section
    const scheduleMatch = analysisText.match(/\*\*Daily\/Weekly Hair Care Schedule\*\*([\s\S]*?)(?=\*\*Product Suggestions\*\*|$)/i);
    if (scheduleMatch && scheduleMatch[1]) {
      const scheduleText = scheduleMatch[1].trim();

      // Extract Daily Routine
      const dailyRoutineMatch = scheduleText.match(/\*\*DAILY ROUTINE:\*\*([\s\S]*?)(?=\*\*WEEKLY ROUTINE:\*\*|$)/i);
      if (dailyRoutineMatch && dailyRoutineMatch[1]) {
        const dailyText = dailyRoutineMatch[1].trim();

        // Extract Morning routine
        const morningMatch = dailyText.match(/Morning:([\s\S]*?)(?=Evening:|$)/i);
        if (morningMatch && morningMatch[1]) {
          const morningSteps = morningMatch[1].trim().split(/\r?\n/).filter(line =>
            line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')
          );
          structuredAnalysis.routineSchedule.dailyRoutine.morning = morningSteps.map(step =>
            step.replace(/^[•\-*]\s*/, '').trim()
          ).filter(step => step.length > 0);
        }

        // Extract Evening routine
        const eveningMatch = dailyText.match(/Evening:([\s\S]*?)$/i);
        if (eveningMatch && eveningMatch[1]) {
          const eveningSteps = eveningMatch[1].trim().split(/\r?\n/).filter(line =>
            line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')
          );
          structuredAnalysis.routineSchedule.dailyRoutine.evening = eveningSteps.map(step =>
            step.replace(/^[•\-*]\s*/, '').trim()
          ).filter(step => step.length > 0);
        }
      }

      // Extract Weekly Routine
      const weeklyRoutineMatch = scheduleText.match(/\*\*WEEKLY ROUTINE:\*\*([\s\S]*?)$/i);
      if (weeklyRoutineMatch && weeklyRoutineMatch[1]) {
        const weeklyText = weeklyRoutineMatch[1].trim();

        // Extract Wash Days
        const washDaysMatch = weeklyText.match(/Wash Days[^:]*:([\s\S]*?)(?=Weekly Treatments:|$)/i);
        if (washDaysMatch && washDaysMatch[1]) {
          const washDaysText = washDaysMatch[1].trim();

          // Extract frequency
          const frequencyMatch = washDaysText.match(/\(([^)]+)\)/);
          if (frequencyMatch && frequencyMatch[1]) {
            structuredAnalysis.routineSchedule.weeklyRoutine.washDays.frequency = frequencyMatch[1].trim();
          }

          // Extract wash day steps
          const washSteps = washDaysText.split(/\r?\n/).filter(line =>
            line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')
          );
          structuredAnalysis.routineSchedule.weeklyRoutine.washDays.steps = washSteps.map(step =>
            step.replace(/^[•\-*]\s*/, '').trim()
          ).filter(step => step.length > 0);
        }

        // Extract Weekly Treatments
        const treatmentsMatch = weeklyText.match(/Weekly Treatments:([\s\S]*?)$/i);
        if (treatmentsMatch && treatmentsMatch[1]) {
          const treatmentsText = treatmentsMatch[1].trim();

          // Extract Deep Conditioning
          const deepCondMatch = treatmentsText.match(/•\s*Deep Conditioning:(.*?)(?=•|$)/i);
          if (deepCondMatch && deepCondMatch[1]) {
            structuredAnalysis.routineSchedule.weeklyRoutine.treatments.deepConditioning = deepCondMatch[1].trim();
          }

          // Extract Scalp Care
          const scalpCareMatch = treatmentsText.match(/•\s*Scalp Care:(.*?)(?=•|$)/i);
          if (scalpCareMatch && scalpCareMatch[1]) {
            structuredAnalysis.routineSchedule.weeklyRoutine.treatments.scalpCare = scalpCareMatch[1].trim();
          }

          // Extract Special Treatments
          const specialMatch = treatmentsText.match(/•\s*Special Treatments:(.*?)(?=•|$)/i);
          if (specialMatch && specialMatch[1]) {
            structuredAnalysis.routineSchedule.weeklyRoutine.treatments.specialTreatments = specialMatch[1].trim();
          }
        }
      }
    }

    // Extract Product Suggestions section
    const suggestionsMatch = analysisText.match(/\*\*Product Suggestions\*\*([\s\S]*?)(?=\*\*AI Bonus Tips\*\*|$)/i);
    if (suggestionsMatch && suggestionsMatch[1]) {
      const suggestionsText = suggestionsMatch[1].trim();

      // Extract individual product suggestions (assuming they're in a list format)
      const productList = suggestionsText.split(/\r?\n/).filter(line =>
        line.trim().startsWith('-') || line.trim().startsWith('*') || /^\d+\./.test(line.trim())
      );

      if (productList.length > 0) {
        structuredAnalysis.productSuggestions = productList.map(item =>
          item.replace(/^[-*]|^\d+\.\s*/, '').trim()
        );
      } else {
        // If no list format is detected, just use the whole text
        structuredAnalysis.productSuggestions = [suggestionsText];
      }
    }

    // Extract AI Bonus Tips section
    const tipsMatch = analysisText.match(/\*\*AI Bonus Tips\*\*([\s\S]*?)$/i);
    if (tipsMatch && tipsMatch[1]) {
      const tipsText = tipsMatch[1].trim();

      // Extract individual tips (assuming they're in a list format)
      const tipsList = tipsText.split(/\r?\n/).filter(line =>
        line.trim().startsWith('-') || line.trim().startsWith('*') || /^\d+\./.test(line.trim())
      );

      if (tipsList.length > 0) {
        structuredAnalysis.aiBonusTips = tipsList.map(item =>
          item.replace(/^[-*]|^\d+\.\s*/, '').trim()
        );
      } else {
        // If no list format is detected, just use the whole text
        structuredAnalysis.aiBonusTips = [tipsText];
      }
    }

    return structuredAnalysis;
  } catch (error) {
    console.error('Error parsing Grok analysis:', error);
    // Return the original analysis as raw text if parsing fails
    return {
      rawAnalysis: analysisText,
      detailedAnalysis: analysisText,
      metrics: { moisture: 50, strength: 50, elasticity: 50, scalpHealth: 50 },
      haircareRoutine: { cleansing: '', conditioning: '', treatments: '', styling: '' },
      routineSchedule: {
        dailyRoutine: { morning: [], evening: [] },
        weeklyRoutine: {
          washDays: { frequency: '', steps: [] },
          treatments: { deepConditioning: '', scalpCare: '', specialTreatments: '' }
        }
      },
      productSuggestions: [],
      aiBonusTips: []
    };
  }
};

// Updated function to analyze multiple images with Grok Vision
const analyzeImageWithGrok = async (imageUrls, isHairAnalysis = true, userData = {}) => {
  if (!imageUrls || imageUrls.length === 0) {
    return 'No images provided for analysis.';
  }

  try {
    // Construct the content array with multiple images and a text prompt
    const content = [
      ...imageUrls.map((url) => ({
        type: 'image_url',
        image_url: {
          url,
          detail: 'high', // Use high detail for better analysis
        },
      })),
      {
        type: 'text',
        // Use different prompts based on whether it's hair or product analysis
        text: isHairAnalysis
          ? `Analyze these images of hair to provide a highly personalized and detailed hair analysis. The user has provided the following information:\n\n` +
            `- Main hair concern: ${userData.hairProblem || 'Not specified'}\n` +
            `- Allergies: ${userData.allergies || 'None'}\n` +
            `- Medications: ${userData.medication || 'None'}\n` +
            `- Hair dyed: ${userData.dyed || 'Not specified'}\n` +
            `- Wash frequency: ${userData.washFrequency || 'Not specified'}\n\n` +
            `Based on both the images AND this user information, provide a HIGHLY PERSONALIZED analysis. Provide the following sections formatted exactly as specified using Markdown:\n\n` +
            `**AI Description**\nProvide a detailed, personalized description of the hair, addressing the user's specific concerns. Include hair type (e.g., straight, wavy, curly, coily), quality (e.g., healthy, dry, damaged), visible damage (e.g., split ends, breakage), color, and estimated thickness (e.g., fine, medium, thick). Make direct connections to the user's stated concerns and conditions.\n\n` +
            `**Hair Care Routine**\nSuggest a detailed, personalized hair care routine specifically tailored to address the user's hair concerns, considering their allergies, medications, and current washing habits. Format this as a numbered list with clear section headers:\n\n` +
            `1. **Cleansing:** Specific recommendations for washing hair that address the user's unique needs\n` +
            '2. **Conditioning:** Specific recommendations for conditioning\n' +
            '3. **Treatments:** Specific recommendations for treatments like masks or oils\n' +
            '4. **Styling:** Specific recommendations for styling and heat protection\n\n' +
            '**Daily/Weekly Hair Care Schedule**\nProvide a comprehensive, step-by-step schedule that shows exactly when and how to use each recommended product or technique. Include specific instructions, timing, and frequency. Format as follows:\n\n' +
            '**DAILY ROUTINE:**\n' +
            'Morning:\n' +
            '• Step 1: [Specific action with detailed instructions - e.g., "Apply leave-in conditioner to damp hair, focusing on mid-lengths to ends"]\n' +
            '• Step 2: [Next specific action with instructions]\n' +
            '• Step 3: [Continue with styling steps]\n\n' +
            'Evening:\n' +
            '• Step 1: [Evening routine steps if applicable]\n' +
            '• Step 2: [Additional evening care]\n\n' +
            '**WEEKLY ROUTINE:**\n' +
            'Wash Days (specify frequency - e.g., "2-3 times per week"):\n' +
            '• Step 1: [Pre-wash treatment if needed - e.g., "Apply oil treatment 30 minutes before washing"]\n' +
            '• Step 2: [Shampooing instructions - e.g., "Massage shampoo into scalp for 2-3 minutes, avoid lengths"]\n' +
            '• Step 3: [Conditioning instructions - e.g., "Apply conditioner from mid-length to ends, leave for 3-5 minutes"]\n' +
            '• Step 4: [Post-wash care - e.g., "Gently squeeze out excess water, apply leave-in treatment"]\n\n' +
            'Weekly Treatments:\n' +
            '• Deep Conditioning: [Specific instructions and frequency - e.g., "Once weekly, apply mask for 15-20 minutes"]\n' +
            '• Scalp Care: [Scalp treatment instructions if needed]\n' +
            '• Special Treatments: [Any additional weekly treatments]\n\n' +
            '**Product Suggestions**\nRecommend specific types of hair care products that directly address the user\'s unique hair concerns, allergies, and conditions. Be specific about ingredients to look for or avoid based on their needs. Format as a bulleted list:\n' +
            '- [Specific shampoo type with ingredients beneficial for their condition]\n' +
            '- [Specific conditioner type with ingredients beneficial for their condition]\n' +
            '- [Specific treatment product with ingredients beneficial for their condition]\n\n' +
            '**AI Bonus Tips**\nProvide 3-5 additional personalized hair care tips or insights specifically for this user\'s hair type, concerns, and lifestyle. Include advice on diet, environmental factors, or techniques that would specifically benefit their situation. Format as a numbered list:\n' +
            '1. [First personalized tip addressing their specific concerns]\n' +
            '2. [Second personalized tip addressing their specific concerns]\n' +
            '3. [Third personalized tip addressing their specific concerns]'
          : 'Analyze this image of a hair product. Identify the product (brand and type) if possible and describe its potential use or key ingredients based on the packaging.',
      },
    ];

    console.log(`Sending ${imageUrls.length} image(s) to Grok for ${isHairAnalysis ? 'hair' : 'product'} analysis.`);

    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: 'grok-2-vision-latest', // Ensure this is the correct and latest model identifier
        messages: [
          {
            role: 'user',
            content, // Send the combined image and text content
          },
        ],
        temperature: 0.7, // Increased for more varied and creative responses
        // max_tokens: 1000 // Optional: Limit response length if needed
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 120000, // Increased timeout to 120 seconds for multi-image analysis
      }
    );
    console.log('Grok API Response:', JSON.stringify(response.data, null, 2));

    if (response.data.choices && response.data.choices.length > 0 && response.data.choices[0].message) {
      return response.data.choices[0].message.content || 'No analysis content provided';
    } else {
      console.error('Grok API response format unexpected:', response.data);
      return 'Analysis format error';
    }
  } catch (error) {
    console.error(`Error analyzing image(s) with Grok (isHairAnalysis: ${isHairAnalysis}):`, error.message);
    if (error.response) {
      console.error('Grok API Error Status:', error.response.status);
      console.error('Grok API Error Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error("Grok API No response received:", error.request);
    } else {
      console.error('Grok API Error:', error.message);
    }
    // Return a more specific error message if possible
    const status = error.response?.status;
    if (status === 429) return 'Failed to analyze image: Rate limit exceeded.';
    if (status === 400) return 'Failed to analyze image: Invalid request (check image URLs or prompt).';
    return 'Failed to analyze image due to an API error.';
  }
};

// Route to handle form submission with validation
app.post(
  '/api/submit',
  authenticateUser, // Add authentication middleware
  upload.fields([
    { name: 'hairPhotos', maxCount: 3 },
    { name: 'productImages', maxCount: 5 },
  ]),
  [ // Use validation rules from the prompt
    body('hairProblem')
      .optional({ checkFalsy: true }) // Allow empty string
      .trim()
      .isLength({ max: 500 }).withMessage('Hair problem must be less than 500 characters')
      .escape(),
    body('allergies')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 }).withMessage('Allergies must be less than 500 characters')
      .escape(),
    body('medication')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 }).withMessage('Medication must be less than 500 characters')
      .escape(),
    body('dyed')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 100 }).withMessage('Dyed description must be less than 100 characters')
      .escape(),
    body('washFrequency')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 100 }).withMessage('Wash frequency must be less than 100 characters')
      .escape(),
    body('additionalConcerns')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 1000 }).withMessage('Additional concerns must be less than 1000 characters')
      .escape(),
    body('productNames') // Validate the JSON string before parsing
       .optional()
       .isString().withMessage('Product names must be a stringified JSON array')
       .custom((value) => {
         try {
           const parsed = JSON.parse(value);
           if (!Array.isArray(parsed)) {
             throw new Error('Product names must be an array');
           }
           if (parsed.some(name => typeof name !== 'string' || name.length > 100)) {
             throw new Error('Each product name must be a string and less than 100 characters');
           }
           return true;
         } catch (e) {
           throw new Error(e.message || 'Invalid format for product names');
         }
       }),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error("Validation Errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      console.log('=== NEW SUBMISSION REQUEST ===');
      console.log('Request headers:', {
        authorization: req.headers.authorization ? 'Bearer [TOKEN]' : 'Missing',
        'x-user-id': req.headers['x-user-id'] || req.headers['X-User-ID'] || 'Missing'
      });
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('Request files:', req.files ? Object.keys(req.files) : 'No files');

      const {
        hairProblem,
        allergies,
        medication,
        dyed,
        washFrequency,
        additionalConcerns,
        productNames, // This is still the JSON string
      } = req.body;

      console.log('Extracted form data:', {
        hairProblem,
        allergies,
        medication,
        dyed,
        washFrequency,
        additionalConcerns,
        productNames: productNames ? 'Present' : 'Not present'
      });

      // Parse productNames here after validation
      let parsedProductNames = [];
      if (productNames) {
        try {
          parsedProductNames = JSON.parse(productNames);
          console.log('Parsed product names:', parsedProductNames);
        } catch (parseError) {
          console.error("Error parsing productNames despite validation:", parseError);
          return res.status(500).json({ error: 'Internal error parsing product names' });
        }
      }

      // Upload all hair photos to S3 first
      const hairPhotoUrls = [];
      if (req.files['hairPhotos']) {
        console.log(`Uploading ${req.files['hairPhotos'].length} hair photos...`);
        for (const file of req.files['hairPhotos']) {
          const url = await uploadToS3(file, 'hair-photos');
          hairPhotoUrls.push(url);
        }
        console.log("Hair photos uploaded:", hairPhotoUrls);
      }

      // Prepare user data for analysis
      const userData = {
        hairProblem,
        allergies,
        medication,
        dyed,
        washFrequency,
        additionalConcerns,
        productNames: parsedProductNames
      };

      // Analyze all hair photos together
      console.log("Starting consolidated hair analysis...");
      const hairAnalysis = hairPhotoUrls.length > 0
        ? await analyzeImageWithGrok(hairPhotoUrls, true, userData) // Pass true for hair analysis and user data
        : 'No hair photos provided for analysis.';
      console.log("Consolidated hair analysis result received.");


      // Upload and analyze product images individually
      const productImageUrls = [];
      const productImageAnalysis = [];
      if (req.files['productImages']) {
        console.log(`Processing ${req.files['productImages'].length} product images...`);
        for (const file of req.files['productImages']) {
          try {
            // Check if the file has a valid MIME type
            const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!validMimeTypes.includes(file.mimetype)) {
              console.warn(`Skipping file with unsupported MIME type: ${file.mimetype}`);
              continue; // Skip this file
            }

            console.log(`Uploading product image: ${file.originalname} (${file.mimetype})`);
            const url = await uploadToS3(file, 'product-images');
            productImageUrls.push(url);

            // Skip Grok analysis for product images for now to avoid errors
            // Instead, just store a placeholder analysis
            const placeholderAnalysis = `Product image uploaded successfully. Analysis skipped to avoid API errors.`;
            productImageAnalysis.push(placeholderAnalysis);
            console.log(`Skipped analysis for ${url} to avoid API errors`);
          } catch (error) {
            console.error(`Error processing product image: ${error.message}`);
            // Continue with the next image instead of failing the entire submission
          }
        }
        console.log("Product images processed.");
      }

      console.log("Parsing hair analysis...");
      // Parse the hair analysis to extract structured data
      const parsedAnalysis = parseGrokAnalysis(hairAnalysis, userData);
      console.log("Analysis parsed successfully.");

      console.log("Creating submission document for Supabase...");
      try {
        const submissionData = {
          user_id: req.user.uid, // Authenticated user's ID
          hair_problem: hairProblem || '',
          allergies: allergies || '',
          medication: medication || '',
          dyed: dyed || '',
          wash_frequency: washFrequency || '',
          additional_concerns: additionalConcerns || '',
          hair_photos: hairPhotoUrls,
          hair_photo_analysis: [hairAnalysis], // Store raw analysis in array
          product_images: productImageUrls,
          product_image_analysis: productImageAnalysis,
          product_names: parsedProductNames,
          analysis: parsedAnalysis, // Structured analysis data
          original_user_id: req.user.uid // For migration tracking
        };

        console.log("Attempting to save submission to Supabase...");
        const { data: savedSubmission, error: saveError } = await supabase
          .from('submissions')
          .insert([submissionData])
          .select()
          .single();

        if (saveError) {
          throw new Error(`Supabase save error: ${saveError.message}`);
        }

        console.log("Submission saved successfully:", savedSubmission.id);

        // Return success response
        return res.status(200).json({
          message: 'Submission saved successfully',
          submissionId: savedSubmission.id,
          hairAnalysis: parsedAnalysis.detailedAnalysis,
          metrics: parsedAnalysis.metrics,
          haircareRoutine: parsedAnalysis.haircareRoutine,
          productSuggestions: parsedAnalysis.productSuggestions,
          aiBonusTips: parsedAnalysis.aiBonusTips
        });
      } catch (dbError) {
        console.error("Error saving submission to Supabase:", dbError.message);
        console.error("Database Error Stack:", dbError.stack);

        // Return a partial success response with the analysis data even if saving to DB failed
        return res.status(200).json({
          message: 'Analysis completed but could not save to database. Your results are still available.',
          warning: 'Your submission could not be permanently saved due to a database issue.',
          hairAnalysis: parsedAnalysis.detailedAnalysis,
          metrics: parsedAnalysis.metrics,
          haircareRoutine: parsedAnalysis.haircareRoutine,
          productSuggestions: parsedAnalysis.productSuggestions,
          aiBonusTips: parsedAnalysis.aiBonusTips,
          dbError: dbError.message // Include error details for debugging
        });
      }
    } catch (error) {
      console.error('Error during submission process:', error.message);
      // More detailed error logging
      if (error.response) { // Axios error
          console.error('Axios Error Data:', error.response.data);
          console.error('Axios Error Status:', error.response.status);
      } else if (error.request) { // No response received
          console.error('Axios Error Request:', error.request);
      } else { // Other errors
          console.error('Error Stack:', error.stack);
      }
      res.status(500).json({ error: 'Failed to save submission due to an internal error.' });
    }
  }
);

// Route for AI Hair Analyst Chat
app.post('/api/chat-analyst', authenticateUser, async (req, res) => {
  try {
    const { message, analysisData, submissionData, chatHistory } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('=== AI CHAT REQUEST ===');
    console.log('User message:', message);
    console.log('Has analysis data:', !!analysisData);
    console.log('Has submission data:', !!submissionData);

    // Build context for the AI based on user's analysis
    let contextPrompt = `You are an expert AI Hair Analyst providing personalized advice. You have access to the user's detailed hair analysis and questionnaire responses.

USER'S HAIR ANALYSIS CONTEXT:
`;

    // Add analysis data if available
    if (analysisData) {
      if (analysisData.detailedAnalysis) {
        contextPrompt += `Hair Analysis: ${analysisData.detailedAnalysis}\n`;
      }
      if (analysisData.metrics) {
        contextPrompt += `Hair Metrics - Moisture: ${analysisData.metrics.moisture}%, Strength: ${analysisData.metrics.strength}%, Elasticity: ${analysisData.metrics.elasticity}%, Scalp Health: ${analysisData.metrics.scalpHealth}%\n`;
      }
      if (analysisData.haircareRoutine) {
        contextPrompt += `Recommended Routine - Cleansing: ${analysisData.haircareRoutine.cleansing}, Conditioning: ${analysisData.haircareRoutine.conditioning}, Treatments: ${analysisData.haircareRoutine.treatments}, Styling: ${analysisData.haircareRoutine.styling}\n`;
      }
      if (analysisData.productSuggestions && analysisData.productSuggestions.length > 0) {
        contextPrompt += `Product Suggestions: ${analysisData.productSuggestions.join(', ')}\n`;
      }
    }

    // Add submission data if available
    if (submissionData) {
      contextPrompt += `User's Concerns: ${submissionData.hairProblem || 'Not specified'}\n`;
      contextPrompt += `Allergies: ${submissionData.allergies || 'None mentioned'}\n`;
      contextPrompt += `Medications: ${submissionData.medication || 'None mentioned'}\n`;
      contextPrompt += `Hair Dyed: ${submissionData.dyed || 'Not specified'}\n`;
      contextPrompt += `Wash Frequency: ${submissionData.washFrequency || 'Not specified'}\n`;
      if (submissionData.additionalConcerns) {
        contextPrompt += `Additional Concerns: ${submissionData.additionalConcerns}\n`;
      }
    }

    contextPrompt += `
INSTRUCTIONS:
- Provide personalized, specific advice based on the user's analysis
- Reference their specific metrics, concerns, and hair condition when relevant
- Be conversational, friendly, and encouraging
- Keep responses focused and actionable
- If asked about products, suggest types/ingredients rather than specific brands
- Always relate advice back to their specific hair analysis

CHAT HISTORY:`;

    // Add recent chat history for context
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.slice(-3).forEach(msg => {
        contextPrompt += `\n${msg.type === 'user' ? 'User' : 'AI'}: ${msg.content}`;
      });
    }

    contextPrompt += `\n\nUser's current question: ${message}

Please provide a helpful, personalized response based on their hair analysis:`;

    // Call Grok API for chat response
    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: 'grok-2-vision-latest',
        messages: [
          {
            role: 'user',
            content: contextPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500 // Limit response length for chat
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000
      }
    );

    const aiResponse = response.data.choices[0]?.message?.content || 'I apologize, but I had trouble generating a response. Please try asking your question again.';

    console.log('AI chat response generated successfully');

    res.status(200).json({
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API error:', error.message);
    if (error.response) {
      console.error('API Error Status:', error.response.status);
      console.error('API Error Data:', error.response.data);
    }

    res.status(500).json({
      error: 'Failed to process chat request',
      message: 'I apologize, but I had trouble processing your question. Please try again in a moment.'
    });
  }
});

// Route to fetch submissions (only for authenticated user) - SUPABASE VERSION
app.get('/api/submissions', authenticateUser, async (req, res) => {
  try {
    console.log('Fetching submissions for user:', req.user.uid);

    // Handle submissions linking for both auth providers
    console.log(`🔄 Checking submissions for user: ${req.user.uid} (${req.user.authProvider || 'unknown'})`);

    // Check if there are submissions with null user_id that match this user
    const { data: nullUserSubmissions, error: nullError } = await supabase
      .from('submissions')
      .select('id, original_user_id')
      .is('user_id', null)
      .eq('original_user_id', req.user.uid);

    if (nullError) {
      console.error('Error checking null user submissions:', nullError.message);
    } else if (nullUserSubmissions && nullUserSubmissions.length > 0) {
      console.log(`Found ${nullUserSubmissions.length} submissions with null user_id, linking to current user...`);

      // Update submissions to assign current user
      const { error: updateError } = await supabase
        .from('submissions')
        .update({ user_id: req.user.uid })
        .is('user_id', null)
        .eq('original_user_id', req.user.uid);

      if (updateError) {
        console.error('Error updating user_id:', updateError.message);
      } else {
        console.log(`✅ Successfully linked ${nullUserSubmissions.length} submissions to user`);
      }
    }

    // Fetch submissions for the authenticated user, sorted by creation date descending
    console.log(`🔍 Querying Supabase for user: ${req.user.uid} (provider: ${req.user.authProvider})`);

    let submissions, error;

    if (req.user.authProvider === 'firebase') {
      // Firebase users: query by original_user_id (TEXT field)
      console.log('🔥 Querying by original_user_id for Firebase user');
      const result = await supabase
        .from('submissions')
        .select('*')
        .eq('original_user_id', req.user.uid)
        .order('created_at', { ascending: false });
      submissions = result.data;
      error = result.error;
    } else {
      // Supabase users: query by user_id (UUID field)
      console.log('🔵 Querying by user_id for Supabase user');
      const result = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', req.user.uid)
        .order('created_at', { ascending: false });
      submissions = result.data;
      error = result.error;
    }

    console.log(`📊 Query result: ${submissions ? submissions.length : 0} submissions, error: ${error ? error.message : 'none'}`);

    if (error) {
      console.error('Supabase error fetching submissions:', error.message);
      console.error('Full error details:', error);
      return res.status(500).json({ error: 'Failed to fetch submissions from database', details: error.message });
    }

    console.log(`Successfully fetched ${submissions.length} submissions for user ${req.user.uid}`);
    res.status(200).json(submissions || []);

  } catch (error) {
    console.error('Error fetching submissions:', error.message);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Add a health check endpoint that doesn't require MongoDB
app.get('/', (req, res) => {
  res.status(200).json({ status: 'API is running', message: 'Welcome to Hairalyze API' });
});

// Test auth endpoint
app.get('/test-auth', authenticateUser, (req, res) => {
  res.status(200).json({
    message: 'Authentication successful',
    user: {
      uid: req.user.uid,
      authProvider: req.user.authProvider,
      email: req.user.email
    }
  });
});

// Add a debug endpoint to check environment variables (without exposing secrets)
app.get('/debug', async (req, res) => {
  // Test Supabase connection
  let supabaseStatus = 'unknown';
  let submissionCount = 0;
  try {
    const { count, error } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true });

    if (error) {
      supabaseStatus = `error: ${error.message}`;
    } else {
      supabaseStatus = 'connected';
      submissionCount = count;
    }
  } catch (err) {
    supabaseStatus = `exception: ${err.message}`;
  }

  res.status(200).json({
    nodeEnv: process.env.NODE_ENV || 'not set',
    // Legacy MongoDB status
    mongoConnected: !!mongoose.connection.readyState,
    mongoUri: process.env.MONGO_URI ? `${process.env.MONGO_URI.substring(0, 20)}...` : 'not set',
    // Supabase status
    supabaseStatus,
    supabaseSubmissions: submissionCount,
    supabaseUrl: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.substring(0, 30)}...` : 'not set',
    // Legacy Firebase status
    firebaseConfigured: !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL),
    firebaseAppsLength: admin.apps.length,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'not set',
    // Other services
    xaiConfigured: !!process.env.XAI_API_KEY,
    awsConfigured: !!(process.env.AWS_REGION && process.env.AWS_S3_BUCKET),
    frontendUrl: process.env.FRONTEND_URL || 'not set',
    port: process.env.PORT || '10000',
    timestamp: new Date().toISOString()
  });
});

// Add a test endpoint for MongoDB connection
app.get('/test-mongo', async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    res.status(200).json({ success: true, message: 'MongoDB connection successful' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'MongoDB connection failed',
      error: error.message,
      mongoUri: process.env.MONGO_URI ? `${process.env.MONGO_URI.substring(0, 20)}...` : 'not set'
    });
  }
});

// MongoDB connection and Server Start
let isConnectedToMongo = false;

const connectToMongo = async () => {
  if (isConnectedToMongo) return true;

  try {
    // Check if we already have an active connection
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      isConnectedToMongo = true;
      return true;
    }

    // Close any existing connection - COMMENTED OUT
    // if (mongoose.connection.readyState !== 0) {
    //   await mongoose.connection.close();
    // }

    // Connect with more robust options
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // Increased timeout to 30s
      socketTimeoutMS: 60000, // Close sockets after 60s of inactivity
      connectTimeoutMS: 30000, // Connection timeout
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 10,
      minPoolSize: 5,
      bufferCommands: false, // Disable command buffering
      autoIndex: false, // Don't build indexes automatically in production
      maxIdleTimeMS: 60000 // Close idle connections after 60s
    });
    console.log('MongoDB connected successfully');
    isConnectedToMongo = true;
    return true;
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    isConnectedToMongo = false;
    return false;
  }
};

// ------------------ NEW: connect once at startup ------------------
(async () => {
  const ok = await connectToMongo();
  if (!ok) {
    console.error('❌  Could not connect to MongoDB on boot – exiting');
    process.exit(1);
  }
  console.log('✅  MongoDB ready – starting HTTP server...');
})();
// -----------------------------------------------------------------

// Middleware to connect to MongoDB before processing API requests
app.use(async (req, res, next) => {
  // Skip MongoDB connection for health check, debug, and test endpoints
  if (req.path === '/' || req.path === '/debug' || req.path === '/test-mongo') {
    return next();
  }

  try {
    const connected = await connectToMongo();
    if (!connected) {
      return res.status(503).json({
        error: 'Database connection failed. Please try again later.',
        message: 'The server is temporarily unable to connect to the database. This is likely due to network issues or database maintenance.'
      });
    }
    next();
  } catch (error) {
    console.error('Error in MongoDB connection middleware:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while connecting to the database.'
    });
  }
});

// Always start the server (required for Render.com)
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Export the Express app for Vercel
module.exports = app;
