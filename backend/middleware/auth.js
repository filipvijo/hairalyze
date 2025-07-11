const { supabase } = require('../supabase');

// Dual authentication middleware (Supabase + Firebase)
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return res.status(401).json({ error: 'No valid authorization token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('🔄 Dual auth: Token received, length:', token.length);

    // Check if we're in development mode for fallback auth
    const isProduction = process.env.NODE_ENV === 'production';
    console.log('Environment:', process.env.NODE_ENV);

    if (!isProduction) {
      // Development fallback - check for X-User-ID header
      const userIdHeader = req.headers['x-user-id'] || req.headers['X-User-ID'];
      if (userIdHeader) {
        console.log('Development mode: Using X-User-ID header');

        // Determine auth provider based on user ID format
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdHeader);
        const authProvider = isUUID ? 'supabase' : 'firebase';

        req.user = { uid: userIdHeader, authProvider };
        console.log(`User authenticated with ID: ${userIdHeader} (${authProvider})`);
        return next();
      }
    }

    // Try both Supabase and Firebase authentication
    console.log('🔄 Trying dual authentication...');

    // For development, always fall back to X-User-ID if available
    const userIdHeader = req.headers['x-user-id'] || req.headers['X-User-ID'];
    if (!isProduction && userIdHeader) {
      console.log('Development mode: Using X-User-ID header directly');
      req.user = { uid: userIdHeader };
      return next();
    }

    // First, try Supabase authentication
    try {
      console.log('🔄 Trying Supabase token verification...');
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (!error && user) {
        console.log('✅ Supabase authentication successful:', user.email);
        req.user = {
          uid: user.id,
          email: user.email,
          authProvider: 'supabase',
          supabaseUser: user
        };
        return next();
      }

      console.log('⚠️ Supabase authentication failed:', error?.message);
    } catch (supabaseError) {
      console.log('⚠️ Supabase authentication exception:', supabaseError.message);
    }

    // If Supabase fails, try Firebase authentication
    try {
      console.log('🔄 Trying Firebase token verification...');
      const admin = require('firebase-admin');

      if (admin.apps.length === 0) {
        console.log('⚠️ Firebase Admin not initialized, skipping Firebase auth');
      } else {
        const decodedToken = await admin.auth().verifyIdToken(token);

        if (decodedToken) {
          console.log('✅ Firebase authentication successful:', decodedToken.email);
          req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            authProvider: 'firebase',
            firebaseUser: decodedToken
          };
          return next();
        }
      }
    } catch (firebaseError) {
      console.log('⚠️ Firebase authentication failed:', firebaseError.message);
    }

    // If both fail, try X-User-ID header as final fallback
    if (userIdHeader) {
      console.log('🔄 Using X-User-ID header as final fallback');

      // Try to determine if this is a Firebase or Supabase user ID based on format
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdHeader);
      const authProvider = isUUID ? 'supabase' : 'firebase';

      console.log(`🔍 Detected user ID format: ${authProvider} (${userIdHeader})`);
      req.user = { uid: userIdHeader, authProvider };
      return next();
    }

    // If everything fails, return error
    return res.status(401).json({
      error: 'Authentication failed with both providers',
      details: 'Token verification failed for both Supabase and Firebase'
    });

  } catch (error) {
    console.error('Authentication middleware error:', error.message);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Legacy Firebase authentication middleware (for gradual migration)
const authenticateUserLegacy = async (req, res, next) => {
  try {
    const admin = require('firebase-admin');
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return res.status(401).json({ error: 'No valid authorization token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Check if we're in development mode or if Firebase Admin is not properly initialized
    const isProduction = process.env.NODE_ENV === 'production';
    const firebaseInitialized = admin.apps.length > 0;

    if (!isProduction || !firebaseInitialized) {
      // Development fallback
      const userIdHeader = req.headers['x-user-id'] || req.headers['X-User-ID'];
      if (userIdHeader) {
        req.user = { uid: userIdHeader };
        console.log('User authenticated with ID:', userIdHeader);
        next();
      } else {
        return res.status(401).json({ error: 'Development mode requires X-User-ID header' });
      }
    } else {
      // Production with Firebase Admin SDK
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        console.log('User authenticated via Firebase:', decodedToken.uid);
        next();
      } catch (firebaseError) {
        console.error('Firebase token verification failed:', firebaseError.message);
        // Fallback to simplified auth if Firebase fails
        const userIdHeader = req.headers['x-user-id'] || req.headers['X-User-ID'];
        if (userIdHeader) {
          console.log('Falling back to simplified auth');
          req.user = { uid: userIdHeader };
          next();
        } else {
          return res.status(401).json({ error: 'Token verification failed and no user ID header provided' });
        }
      }
    }
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = { 
  authenticateUser,           // New Supabase auth
  authenticateUserLegacy      // Legacy Firebase auth
};
