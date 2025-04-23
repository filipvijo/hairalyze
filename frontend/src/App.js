import React from 'react';
// Add useNavigate to the import
import { BrowserRouter as Router, Route, Routes, Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; // Import AuthProvider and useAuth
import Questionnaire from './components/Questionnaire';
import Submissions from './components/Submissions';
import Signup from './components/Signup'; // Import Signup
import Login from './components/Login'; // Import Login
import './App.css';

// PrivateRoute component to protect routes
const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  console.log("PrivateRoute check, currentUser:", currentUser ? currentUser.email : null); // Log check
  // If no user, redirect to login
  return currentUser ? children : <Navigate to="/login" />;
};

// Updated Home component with auth state and logout
const Home = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate(); // Use navigate for logout redirect

  const handleLogout = async () => {
    try {
      await logout();
      console.log("Logout successful, navigating to login.");
      navigate('/login'); // Redirect to login page after logout
    } catch (error) {
      console.error("Failed to log out:", error);
      // Handle logout error (optional)
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Hero image background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute inset-0 bg-dark bg-opacity-70"></div>
        <img
          src="/images/image_1.png"
          alt="Stylish hair background"
          className="absolute object-cover w-full h-full z-0"
        />
      </div>

      {/* Auth status and Logout/Login link */}
      <div className="absolute top-6 right-6 flex items-center space-x-4 z-10">
        {currentUser ? (
          <>
            <span className="text-white font-medium hidden md:inline">Hello, {currentUser.email.split('@')[0]}</span>
            <Link to="/submissions" className="px-4 py-2 rounded-full bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm text-white font-medium hover:bg-opacity-30 transition-all duration-300 border border-white border-opacity-30">
              View Results
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm text-white font-medium hover:bg-opacity-30 transition-all duration-300 hover:text-accent"
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="px-4 py-2 rounded-full bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm text-white font-medium hover:bg-opacity-30 transition-all duration-300 border border-white border-opacity-30">
              Log In
            </Link>
            <Link to="/signup" className="px-4 py-2 rounded-full bg-gradient-to-r from-accent to-primary text-white font-medium hover:shadow-md transition-all duration-300">
              Sign Up
            </Link>
          </>
        )}
      </div>

      <div className="relative z-10 text-center max-w-4xl px-8 py-16 animate-fade-in mx-4">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent drop-shadow-lg">Hairalyze</h1>
        <p className="text-xl text-white mb-10 max-w-2xl mx-auto leading-relaxed">Your personalized AI-powered hair analysis and care recommendation system</p>

        {/* Conditional content based on login status */}
        {currentUser ? (
          <div className="text-center">
            <Link to="/questionnaire">
              <button className="px-8 py-4 rounded-full bg-gradient-to-r from-accent to-primary text-white font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                Start Hair Analysis
              </button>
            </Link>
            <div className="mt-12 p-8 bg-black bg-opacity-30 backdrop-filter backdrop-blur-sm rounded-2xl border border-white border-opacity-20">
              <h3 className="text-xl font-semibold text-white mb-4">How It Works</h3>
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div className="p-4 bg-white rounded-xl shadow-soft">
                  <div className="w-10 h-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center text-primary font-bold mb-3">1</div>
                  <h4 className="font-medium mb-2">Answer Questions</h4>
                  <p className="text-sm text-gray-600">Tell us about your hair concerns, routine, and products you currently use</p>
                </div>
                <div className="p-4 bg-white rounded-xl shadow-soft">
                  <div className="w-10 h-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center text-primary font-bold mb-3">2</div>
                  <h4 className="font-medium mb-2">Upload Photos</h4>
                  <p className="text-sm text-gray-600">Share photos of your hair length, ends, and parting for accurate analysis</p>
                </div>
                <div className="p-4 bg-white rounded-xl shadow-soft">
                  <div className="w-10 h-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center text-primary font-bold mb-3">3</div>
                  <h4 className="font-medium mb-2">Get Recommendations</h4>
                  <p className="text-sm text-gray-600">Receive personalized hair care advice, product suggestions, and styling tips</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <div className="mb-10 p-6 bg-black bg-opacity-30 backdrop-filter backdrop-blur-sm rounded-xl border border-white border-opacity-20">
              <p className="text-lg text-white mb-0">Unlock personalized hair care recommendations powered by advanced AI analysis</p>
            </div>
            <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-6">
              <Link to="/login" className="px-8 py-4 rounded-full bg-white border border-accent text-accent font-medium hover:bg-accent hover:text-white transition-all duration-300 shadow-soft">
                Log In
              </Link>
              <Link to="/signup" className="px-8 py-4 rounded-full bg-gradient-to-r from-accent to-primary text-white font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main App component wrapped with AuthProvider
function App() {
  try {
    return (
      <AuthProvider> {/* Wrap the entire app with AuthProvider */}
        <Router>
          {/* Removed the old nav bar */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/questionnaire"
              element={
                <PrivateRoute> {/* Protect Questionnaire */}
                  <Questionnaire />
                </PrivateRoute>
              }
            />
            <Route
              path="/submissions"
              element={
                <PrivateRoute> {/* Protect Submissions */}
                  <Submissions />
                </PrivateRoute>
              }
            />
            {/* Add a catch-all route or redirect for unknown paths */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    );
  } catch (error) {
    console.error('Error rendering app:', error);
    return (
      <div className="App">
        <header className="App-header">
          <h1>Hairalyze</h1>
          <p>Loading application...</p>
          <p>If this message persists, please refresh the page.</p>
        </header>
      </div>
    );
  }
}

export default App;
