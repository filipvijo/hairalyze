const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
// Import the Submission model from the models.js file
const { Submission } = require('./models');

// Firebase Admin SDK for token verification
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

// Authentication middleware (simplified for local development)
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    // For local development, we'll use a simplified approach
    // In production, this should use Firebase Admin SDK verification
    if (process.env.NODE_ENV === 'development') {
      // Extract user ID from the token (this is a simplified approach for testing)
      // In a real app, you'd verify the token with Firebase Admin
      try {
        // For now, we'll decode the token client-side info
        // This is NOT secure for production but works for testing user separation
        const userIdHeader = req.headers['x-user-id'] || req.headers['X-User-ID'];
        if (!userIdHeader) {
          return res.status(401).json({ error: 'User ID header required for development' });
        }
        req.user = { uid: userIdHeader };
        next();
      } catch (error) {
        return res.status(401).json({ error: 'Invalid user ID' });
      }
    } else {
      // Production: use Firebase Admin SDK
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      next();
    }
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

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

      console.log("Creating submission document...");
      try {
        const submission = new Submission({
          userId: req.user.uid, // Add the authenticated user's ID
          hairProblem,
          allergies,
          medication,
          dyed,
          washFrequency,
          additionalConcerns,
          hairPhotos: hairPhotoUrls,
          hairPhotoAnalysis: [hairAnalysis], // Store raw analysis in the array
          productImages: productImageUrls,
          productImageAnalysis, // Store individual product analyses
          productNames: parsedProductNames,
          analysis: parsedAnalysis, // Add the structured analysis
        });

        console.log("Attempting to save submission to MongoDB...");
        const savedSubmission = await submission.save();   // use global timeouts
        console.log("Submission saved successfully:", savedSubmission._id);

        // Return success response even if there are minor issues
        return res.status(200).json({
          message: 'Submission saved successfully',
          submissionId: savedSubmission._id,
          hairAnalysis: parsedAnalysis.detailedAnalysis,
          metrics: parsedAnalysis.metrics,
          haircareRoutine: parsedAnalysis.haircareRoutine,
          productSuggestions: parsedAnalysis.productSuggestions,
          aiBonusTips: parsedAnalysis.aiBonusTips
        });
      } catch (dbError) {
        console.error("Error saving submission to MongoDB:", dbError.message);
        console.error("MongoDB Error Stack:", dbError.stack);

        // Return a partial success response with the analysis data even if saving to DB failed
        return res.status(200).json({
          message: 'Analysis completed but could not save to database. Your results are still available.',
          warning: 'Your submission could not be permanently saved due to a database issue.',
          hairAnalysis: parsedAnalysis.detailedAnalysis,
          metrics: parsedAnalysis.metrics,
          haircareRoutine: parsedAnalysis.haircareRoutine,
          productSuggestions: parsedAnalysis.productSuggestions,
          aiBonusTips: parsedAnalysis.aiBonusTips
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

// Route to fetch submissions (only for authenticated user)
app.get('/api/submissions', authenticateUser, async (req, res) => {
  try {
    // For development: check if there are submissions without userId and assign them to current user
    if (process.env.NODE_ENV === 'development') {
      const submissionsWithoutUserId = await Submission.find({ userId: { $exists: false } });
      if (submissionsWithoutUserId.length > 0) {
        console.log(`Found ${submissionsWithoutUserId.length} submissions without userId, assigning to current user`);
        await Submission.updateMany(
          { userId: { $exists: false } },
          { $set: { userId: req.user.uid } }
        );
      }
    }

    // Fetch only submissions for the authenticated user, sort by creation date descending
    const submissions = await Submission.find({ userId: req.user.uid }).sort({ createdAt: -1 });
    res.status(200).json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error.message);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Add a health check endpoint that doesn't require MongoDB
app.get('/', (req, res) => {
  res.status(200).json({ status: 'API is running', message: 'Welcome to Hairalyze API' });
});

// Add a debug endpoint to check environment variables (without exposing secrets)
app.get('/debug', (req, res) => {
  res.status(200).json({
    nodeEnv: process.env.NODE_ENV || 'not set',
    mongoConnected: !!mongoose.connection.readyState,
    mongoUri: process.env.MONGO_URI ? `${process.env.MONGO_URI.substring(0, 20)}...` : 'not set',
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
