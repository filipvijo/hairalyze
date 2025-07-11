import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authProvider, setAuthProvider] = useState(null); // 'supabase' or 'firebase'

  const signup = async (email, password) => {
    try {
      // New users always go to Supabase
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
    console.log('🔄 Starting dual authentication login...');

    // First, try Supabase authentication
    try {
      console.log('🔄 Trying Supabase authentication...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.user) {
        console.log('✅ Supabase login successful:', data.user.email);
        setAuthProvider('supabase');
        return data;
      }

      console.log('⚠️ Supabase login failed:', error?.message);
    } catch (supabaseErr) {
      console.log('⚠️ Supabase login exception:', supabaseErr.message);
    }

    // If Supabase fails, try Firebase authentication
    try {
      console.log('🔄 Trying Firebase authentication...');
      const firebaseResult = await signInWithEmailAndPassword(auth, email, password);

      if (firebaseResult.user) {
        console.log('✅ Firebase login successful:', firebaseResult.user.email);
        setAuthProvider('firebase');

        // Convert Firebase user to our standard format
        const userData = {
          user: {
            id: firebaseResult.user.uid,
            uid: firebaseResult.user.uid, // Keep uid for compatibility
            email: firebaseResult.user.email,
            // Add Firebase-specific flag and methods
            isFirebaseUser: true,
            getIdToken: () => firebaseResult.user.getIdToken() // Preserve the method
          }
        };

        return userData;
      }
    } catch (firebaseErr) {
      console.log('⚠️ Firebase login failed:', firebaseErr.message);
    }

    // If both fail, throw an error
    throw new Error('Invalid email or password. Please check your credentials or create a new account.');
  };

  const logout = async () => {
    try {
      // Sign out from both providers to be safe
      console.log('🔄 Signing out from both auth providers...');

      // Sign out from Supabase
      const { error: supabaseError } = await supabase.auth.signOut();
      if (supabaseError) {
        console.log('⚠️ Supabase signout error:', supabaseError.message);
      }

      // Sign out from Firebase
      try {
        await signOut(auth);
        console.log('✅ Firebase signout successful');
      } catch (firebaseError) {
        console.log('⚠️ Firebase signout error:', firebaseError.message);
      }

      // Reset auth provider
      setAuthProvider(null);
      console.log('✅ Logout completed');

    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  };

  useEffect(() => {
    let supabaseSubscription;
    let firebaseUnsubscribe;

    const initializeAuth = async () => {
      console.log('🔄 Initializing dual authentication...');

      // Check Supabase session first
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('✅ Found Supabase session:', session.user.email);
          setCurrentUser(session.user);
          setAuthProvider('supabase');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.log('⚠️ Supabase session check failed:', err.message);
      }

      // Check Firebase auth state
      try {
        firebaseUnsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            console.log('✅ Found Firebase session:', user.email);
            // Convert Firebase user to our standard format
            const standardUser = {
              id: user.uid,
              uid: user.uid, // Keep uid for compatibility
              email: user.email,
              isFirebaseUser: true,
              getIdToken: () => user.getIdToken() // Preserve the method
            };
            setCurrentUser(standardUser);
            setAuthProvider('firebase');
          } else if (!currentUser) {
            console.log('ℹ️ No active sessions found');
            setCurrentUser(null);
            setAuthProvider(null);
          }
          setLoading(false);
        });
      } catch (err) {
        console.log('⚠️ Firebase auth check failed:', err.message);
        setLoading(false);
      }
    };

    // Listen for Supabase auth changes
    supabaseSubscription = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Supabase auth event:', event);
      if (session?.user) {
        setCurrentUser(session.user);
        setAuthProvider('supabase');
      } else if (authProvider === 'supabase') {
        // Only clear if we were using Supabase
        setCurrentUser(null);
        setAuthProvider(null);
      }
    });

    initializeAuth();

    return () => {
      if (supabaseSubscription?.data?.subscription) {
        supabaseSubscription.data.subscription.unsubscribe();
      }
      if (firebaseUnsubscribe) {
        firebaseUnsubscribe();
      }
    };
  }, []);

  const value = {
    currentUser,
    authProvider, // 'supabase', 'firebase', or null
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
