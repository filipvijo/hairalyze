import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom'; // Import Link

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    setSuccess(''); // Clear previous success messages
    setLoading(true); // Set loading state

    // Basic password validation (example)
    if (password.length < 6) {
      setError('Password should be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      console.log("Attempting signup with:", email);
      const result = await signup(email, password);
      console.log("Signup result:", result);

      // Check if user was created successfully
      if (result.user) {
        if (result.session) {
          // User is immediately logged in (email confirmation disabled)
          console.log("Signup successful, user logged in, navigating to home.");
          setSuccess('Account created successfully! Welcome to Hairalyze!');
          setTimeout(() => navigate('/'), 1500); // Small delay to show success message
        } else {
          // User created but needs email confirmation
          setSuccess('Account created! Please check your email and click the confirmation link to complete your registration.');
        }
      }
    } catch (err) {
      console.error("Signup failed:", err);
      // Handle specific error messages
      if (err.message.includes('email confirmation')) {
        setSuccess(err.message);
      } else if (err.message.includes('already registered') || err.message.includes('already been registered')) {
        setError('This email address is already registered. Please try logging in instead.');
      } else if (err.message.includes('invalid email')) {
        setError('Please enter a valid email address.');
      } else if (err.message.includes('weak password')) {
        setError('Password is too weak. Please choose a stronger password.');
      } else {
        setError(err.message || 'Failed to create an account. Please try again.');
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
          src="/images/image_5.png"
          alt="Stylish hair background"
          className="absolute object-cover w-full h-full"
        />
      </div>
      <div className="bg-white bg-opacity-80 backdrop-filter backdrop-blur-sm p-8 rounded-xl shadow-card w-full max-w-md animate-fade-in relative z-10 border border-white border-opacity-20">
        <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Sign Up</h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 animate-fade-in">
            <p className="text-center">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6 animate-fade-in">
            <p className="text-center">{success}</p>
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
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading} // Disable button when loading
            className={`w-full px-6 py-3 rounded-full bg-gradient-to-r from-accent to-primary text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 ${loading ? 'opacity-50 cursor-not-allowed hover:transform-none' : ''}`}
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          {/* Use Link component for internal navigation */}
          <Link to="/login" className="text-primary font-medium hover:text-accent transition-colors duration-300">Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
