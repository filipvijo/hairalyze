const { supabase } = require('../supabase');

// Supabase-only authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');

      // Check if we're in development mode for fallback auth
      const isProduction = process.env.NODE_ENV === 'production';
      console.log('Environment:', process.env.NODE_ENV);

      // Development fallback - check for X-User-ID header
      if (!isProduction) {
        const userIdHeader = req.headers['x-user-id'] || req.headers['X-User-ID'];
        if (userIdHeader) {
          console.log('Development mode: Using X-User-ID header');
          req.user = { uid: userIdHeader, authProvider: 'supabase' };
          console.log(`User authenticated with ID: ${userIdHeader} (development)`);
          return next();
        }
      }

      return res.status(401).json({ error: 'No valid authorization token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('🔄 Supabase auth: Token received, length:', token.length);

    // Try Supabase authentication
    try {
      console.log('🔄 Verifying Supabase token...');
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
      return res.status(401).json({
        error: 'Authentication failed',
        details: error?.message || 'Invalid token'
      });
    } catch (supabaseError) {
      console.log('⚠️ Supabase authentication exception:', supabaseError.message);
      return res.status(401).json({
        error: 'Authentication failed',
        details: supabaseError.message
      });
    }

  } catch (error) {
    console.error('Authentication middleware error:', error.message);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = {
  authenticateUser
};
