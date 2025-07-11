import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom'; // Import Link

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    setLoading(true); // Set loading state

    try {
      console.log("Attempting login with:", email);
      await login(email, password);
      console.log("Login successful, navigating to home.");
      navigate('/'); // Navigate to home page after successful login
    } catch (err) {
      console.error("Login failed:", err);
      // Provide more specific error messages based on Supabase error messages
      if (err.message.includes('Invalid login credentials') ||
          err.message.includes('Email not confirmed') ||
          err.message.includes('invalid_credentials')) {
         setError('Invalid email or password. Please check your credentials and try again.');
      } else if (err.message.includes('Email not confirmed')) {
         setError('Please check your email and click the confirmation link before logging in.');
      } else if (err.message.includes('invalid email')) {
         setError('Please enter a valid email address.');
      } else if (err.message.includes('too many requests')) {
         setError('Too many login attempts. Please wait a moment and try again.');
      } else {
         setError(err.message || 'Failed to log in. Please try again later.');
      }
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative py-10">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-dark bg-opacity-70"></div>
        <img
          src="/images/image_3.png"
          alt="Stylish hair background"
          className="absolute object-cover w-full h-full"
        />
      </div>
      <div className="bg-white bg-opacity-80 backdrop-filter backdrop-blur-sm p-8 rounded-xl shadow-card w-full max-w-md animate-fade-in relative z-10 border border-white border-opacity-20">
        <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Log In</h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 animate-fade-in">
            <p className="text-center">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
              required
              autoComplete="email"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading} // Disable button when loading
            className={`w-full px-6 py-3 rounded-full bg-gradient-to-r from-accent to-primary text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 ${loading ? 'opacity-50 cursor-not-allowed hover:transform-none' : ''}`}
          >
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>
        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          {/* Use Link component for internal navigation */}
          <Link to="/signup" className="text-primary font-medium hover:text-accent transition-colors duration-300">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
