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
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        console.error('Supabase signup error:', error);
        throw error;
      }

      console.log('✅ Supabase signup successful:', data);
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

  const value = {
    currentUser,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
