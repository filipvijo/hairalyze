import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email, password) => {
    try {
      console.log('🔄 Creating new user with Supabase...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            email_confirm: true // Skip email confirmation
          }
        }
      });

      if (error) {
        console.error('Supabase signup error:', error);
        throw error;
      }

      console.log('✅ Supabase signup successful:', data);

      // If user needs email confirmation, show appropriate message
      if (data.user && !data.session) {
        console.log('📧 Email confirmation required');
        throw new Error('Please check your email and click the confirmation link to complete your registration.');
      }

      return data;
    } catch (err) {
      console.error('❌ Signup exception:', err);
      throw err;
    }
  };

  const login = async (email, password) => {
    try {
      console.log('🔄 Attempting Supabase login...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Supabase login error:', error);
        throw error;
      }

      console.log('✅ Supabase login successful:', data.user.email);
      return data;
    } catch (err) {
      console.error('❌ Login exception:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      console.log('🔄 Logging out from Supabase...');
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Supabase logout error:', error);
        throw error;
      }

      console.log('✅ Logout completed');
    } catch (error) {
      console.error('❌ Logout exception:', error);
      throw error;
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      console.log('🔄 Updating password with Supabase...');
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Supabase password update error:', error);
        throw error;
      }

      console.log('✅ Password updated successfully');
      return { success: true };
    } catch (err) {
      console.error('❌ Password update exception:', err);
      throw err;
    }
  };

  useEffect(() => {
    console.log('🔄 Initializing Supabase authentication...');

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('✅ Found Supabase session:', session.user.email);
          setCurrentUser(session.user);
        } else {
          console.log('ℹ️ No active session found');
          setCurrentUser(null);
        }
      } catch (err) {
        console.log('⚠️ Session check failed:', err.message);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Supabase auth event:', event);
      if (session?.user) {
        console.log('✅ User authenticated:', session.user.email);
        setCurrentUser(session.user);
      } else {
        console.log('ℹ️ User logged out');
        setCurrentUser(null);
      }
      setLoading(false);
    });

    initializeAuth();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Helper function to check if user has unlimited access
  const hasUnlimitedAccess = () => {
    if (!currentUser?.user_metadata) return false;
    return currentUser.user_metadata.unlimited_access === true;
  };

  const value = {
    currentUser,
    signup,
    login,
    logout,
    updatePassword,
    hasUnlimitedAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
