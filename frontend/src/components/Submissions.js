import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import HairAnalystChat from './HairAnalystChat';
import RoutineSchedule from './RoutineSchedule';

const Submissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreviousSubmissions, setShowPreviousSubmissions] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [currentChatData, setCurrentChatData] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const mobileMenuRef = React.useRef(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleBackToHomepage = () => {
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  // Close mobile menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    console.log('🔄 Submissions useEffect triggered');
    console.log('🔄 Current user:', currentUser ? { email: currentUser.email, id: currentUser.id || currentUser.uid } : 'null');

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.log('⏰ Loading timeout reached, forcing loading to false');
      setLoading(false);
      if (!latestAnalysis && submissions.length === 0) {
        setError('Loading timed out. Please refresh the page or try again.');
      }
    }, 15000); // 15 second timeout

    // Check for latest analysis in localStorage first
    const storedAnalysis = localStorage.getItem('latestAnalysis');
    let parsedAnalysis = null;

    if (storedAnalysis) {
      try {
        parsedAnalysis = JSON.parse(storedAnalysis);
        setLatestAnalysis(parsedAnalysis);
        console.log('✅ Found analysis in localStorage:', parsedAnalysis);
        // If we have data in localStorage, set loading to false immediately
        setLoading(false);
        clearTimeout(loadingTimeout); // Clear timeout since we have data
      } catch (e) {
        console.error('❌ Error parsing stored analysis:', e);
      }
    } else {
      console.log('ℹ️ No analysis found in localStorage');
    }

    // Then fetch submissions from the API
    const fetchSubmissions = async () => {
      console.log('🔄 Starting fetchSubmissions...');
      try {
        if (!currentUser) {
          console.log('❌ No current user, setting error');
          setError('Please log in to view your submissions.');
          setLoading(false);
          return;
        }

        console.log('✅ Current user found, proceeding with API call');
        // Get Supabase authentication token
        let token = null;

        console.log('🔵 Getting Supabase token for user:', currentUser.email);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          token = session?.access_token;
          if (!token) {
            throw new Error('No Supabase session found');
          }
          console.log('✅ Supabase token obtained');
        } catch (err) {
          console.error('❌ Failed to get Supabase token:', err);
          setError('Failed to get authentication token. Please log in again.');
          setLoading(false);
          clearTimeout(loadingTimeout);
          return;
        }

        // Use environment variable for API URL
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        console.log('🔧 API URL being used:', apiUrl);
        console.log('🔧 Environment check:', {
          REACT_APP_API_URL: process.env.REACT_APP_API_URL,
          NODE_ENV: process.env.NODE_ENV,
          allReactAppVars: Object.keys(process.env).filter(key => key.startsWith('REACT_APP_'))
        });

        // Get user ID (Supabase uses 'id')
        const userId = currentUser.id;
        console.log('🔧 Using user ID:', userId);
        console.log('🔧 Token length:', token ? token.length : 'null');

        console.log('🔄 Making API request to:', `${apiUrl}/api/submissions`);
        const response = await axios.get(`${apiUrl}/api/submissions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-ID': userId // Supabase user ID
          }
        });
        console.log('✅ API response received:', response.data);
        setSubmissions(response.data);
        setLoading(false);
        clearTimeout(loadingTimeout); // Clear timeout on success
      } catch (err) {
        console.error('❌ Error fetching submissions:', err);
        console.error('❌ Error details:', {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data
        });

        // If we have latestAnalysis from localStorage, don't show error
        if (parsedAnalysis) {
          console.log('ℹ️ Using localStorage data, hiding API error');
          // Just set loading to false, don't show error
          setLoading(false);
        } else {
          console.log('❌ No localStorage data, showing error');
          setError(`Failed to load submissions: ${err.response?.data?.error || err.message}`);
          setLoading(false);
        }
        clearTimeout(loadingTimeout); // Clear timeout on error
      }
    };

    if (currentUser) {
      console.log('✅ Current user exists, calling fetchSubmissions');
      fetchSubmissions();
    } else {
      console.log('ℹ️ No current user, setting loading to false');
      setLoading(false);
      clearTimeout(loadingTimeout); // Clear timeout if no user
    }

    // Cleanup function
    return () => {
      clearTimeout(loadingTimeout);
    };
  }, [currentUser]);

  // Chat functions
  const openChat = (analysisData, submissionData) => {
    setCurrentChatData({ analysisData, submissionData });
    setShowChat(true);
  };

  const closeChat = () => {
    setShowChat(false);
    setCurrentChatData(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <p className="text-gray-700 text-xl">Loading...</p>
      </div>
    );
  }

  // Only show error if we have an error AND we don't have any data in localStorage
  if (error && !latestAnalysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }

  console.log('Rendering Submissions component with:', {
    latestAnalysis: latestAnalysis ? 'Present' : 'Not present',
    submissions: submissions.length,
    error: error ? 'Present' : 'Not present',
    loading
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-light py-10 relative">
      {/* Desktop Navigation */}
      <div className="absolute top-6 right-6 hidden md:flex items-center space-x-4 z-50">
        <button
          onClick={handleBackToHomepage}
          className="flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          Back to Homepage
        </button>
      </div>

      {/* Mobile Hamburger Menu */}
      <div ref={mobileMenuRef} className="absolute top-6 right-6 md:hidden z-50">
        <button
          onClick={toggleMobileMenu}
          className="p-3 rounded-full bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-all duration-300 touch-manipulation transform hover:scale-105"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          aria-label="Toggle menu"
        >
          <div className="w-6 h-6 flex flex-col justify-center items-center">
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : 'mb-1'}`}></span>
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : 'mb-1'}`}></span>
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
          </div>
        </button>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 right-0 w-64 bg-white bg-opacity-95 backdrop-filter backdrop-blur-sm rounded-xl shadow-lg border border-white border-opacity-30 overflow-hidden mobile-menu-dropdown">
            <button
              onClick={handleBackToHomepage}
              className="w-full px-4 py-3 text-left text-gray-800 hover:bg-gray-100 transition-colors duration-200 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Back to Homepage
            </button>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4">
        <div className="relative mb-16">
          <h1 className="text-5xl font-bold text-center mb-6 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent relative z-10">Your Hair Analysis Results</h1>

          {/* Page intro */}
          <div className="mb-10 bg-white bg-opacity-80 backdrop-filter backdrop-blur-sm p-6 rounded-xl shadow-card border border-white border-opacity-20 relative z-10">
            <p className="text-lg text-neutral text-center">Here's your personalized hair analysis based on your photos and questionnaire responses. Use these insights to create your perfect hair care routine!</p>
          </div>
        </div>

        {submissions.length > 1 && (
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setShowPreviousSubmissions(!showPreviousSubmissions)}
              className="flex items-center px-4 py-2 bg-white rounded-full shadow-soft text-primary hover:bg-primary hover:text-white transition-all duration-300"
            >
              <span className="mr-2">{showPreviousSubmissions ? 'Hide' : 'Show'} Previous Analyses</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${showPreviousSubmissions ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {submissions.length === 0 && !latestAnalysis ? (
          <p className="text-gray-700 text-center">No submissions found. Complete the questionnaire to see your results.</p>
        ) : (
          <>
            {/* Show latest analysis from localStorage only if no database submissions or if there's a warning */}
            {latestAnalysis && (submissions.length === 0 || latestAnalysis.warning) && (
              <div className="mb-16 relative">
                <div className="absolute -top-8 left-0 right-0 text-center">
                  <span className="inline-block px-4 py-1 bg-secondary text-neutral rounded-full text-sm font-medium">
                    Latest Analysis from {latestAnalysis.timestamp ? new Date(latestAnalysis.timestamp).toLocaleDateString() : 'Unknown Date'}
                    {latestAnalysis.warning && (
                      <span className="ml-2 text-amber-600">⚠️ {latestAnalysis.warning}</span>
                    )}
                  </span>
                </div>

                {/* Analysis Results Card */}
                <div className="bg-gradient-to-br from-primary/5 to-accent/5 p-6 rounded-xl shadow-card mb-6 transform transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 animate-fade-in delay-100 border border-primary/10">
                  <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Your Hair Profile</h2>

                  {/* Hair Metrics */}
                  <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Moisture Metric */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-neutral">Moisture</h3>
                        <span className="text-lg font-bold text-accent">{latestAnalysis.metrics?.moisture || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-accent to-primary h-2.5 rounded-full"
                          style={{ width: `${latestAnalysis.metrics?.moisture || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Strength Metric */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-neutral">Strength</h3>
                        <span className="text-lg font-bold text-primary">{latestAnalysis.metrics?.strength || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-primary to-info h-2.5 rounded-full"
                          style={{ width: `${latestAnalysis.metrics?.strength || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Elasticity Metric */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-neutral">Elasticity</h3>
                        <span className="text-lg font-bold text-info">{latestAnalysis.metrics?.elasticity || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-info to-primary h-2.5 rounded-full"
                          style={{ width: `${latestAnalysis.metrics?.elasticity || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Scalp Health Metric */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-neutral">Scalp Health</h3>
                        <span className="text-lg font-bold text-success">{latestAnalysis.metrics?.scalpHealth || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-success to-info h-2.5 rounded-full"
                          style={{ width: `${latestAnalysis.metrics?.scalpHealth || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="text-gray-700 bg-white p-5 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-2 text-accent">What We See:</h3>
                    <div className="mb-4 whitespace-pre-line">
                      {latestAnalysis.hairAnalysis ? (
                        <p className="text-gray-700 leading-relaxed">
                          {latestAnalysis.hairAnalysis.replace(/\*\*(.*?)\*\*/g, '$1').replace(/- /g, '')}
                        </p>
                      ) : (
                        'We\'re still analyzing your hair. Check back soon for your personalized hair profile!'
                      )}
                    </div>
                  </div>
                </div>

                {/* Haircare Routine Card */}
                <div className="bg-gradient-to-br from-success/5 to-info/5 p-6 rounded-xl shadow-card mb-6 transform transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 animate-fade-in delay-200 border border-success/10">
                  <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-success to-info bg-clip-text text-transparent">Your Perfect Hair Routine</h2>
                  <p className="text-gray-600 mb-4">Based on your unique hair profile, we've crafted a personalized routine to help your hair look and feel its best.</p>
                  <div className="text-gray-700">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2 flex items-center">
                        <span className="bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center mr-2">1</span>
                        Cleansing
                      </h3>
                      <div className="mb-2 whitespace-pre-line pl-9">
                        {latestAnalysis.haircareRoutine?.cleansing ? (
                          <p className="text-gray-700 leading-relaxed">
                            {latestAnalysis.haircareRoutine.cleansing.replace(/\*\*(.*?)\*\*/g, '').replace(/- /g, '')}
                          </p>
                        ) : (
                          'We\'re working on your personalized cleansing recommendations.'
                        )}
                      </div>
                    </div>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2 flex items-center">
                        <span className="bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center mr-2">2</span>
                        Conditioning
                      </h3>
                      <div className="mb-2 whitespace-pre-line pl-9">
                        {latestAnalysis.haircareRoutine?.conditioning ? (
                          <p className="text-gray-700 leading-relaxed">
                            {latestAnalysis.haircareRoutine.conditioning.replace(/\*\*(.*?)\*\*/g, '').replace(/- /g, '')}
                          </p>
                        ) : (
                          'We\'re working on your personalized conditioning recommendations.'
                        )}
                      </div>
                    </div>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2 flex items-center">
                        <span className="bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center mr-2">3</span>
                        Treatments
                      </h3>
                      <div className="mb-2 whitespace-pre-line pl-9">
                        {latestAnalysis.haircareRoutine?.treatments ? (
                          <p className="text-gray-700 leading-relaxed">
                            {latestAnalysis.haircareRoutine.treatments.replace(/\*\*(.*?)\*\*/g, '').replace(/- /g, '')}
                          </p>
                        ) : (
                          'We\'re working on your personalized treatment recommendations.'
                        )}
                      </div>
                    </div>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2 flex items-center">
                        <span className="bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center mr-2">4</span>
                        Styling
                      </h3>
                      <div className="mb-2 whitespace-pre-line pl-9">
                        {latestAnalysis.haircareRoutine?.styling ? (
                          <p className="text-gray-700 leading-relaxed">
                            {latestAnalysis.haircareRoutine.styling.replace(/\*\*(.*?)\*\*/g, '').replace(/- /g, '')}
                          </p>
                        ) : (
                          'We\'re working on your personalized styling recommendations.'
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Routine Schedule */}
                <RoutineSchedule routineSchedule={latestAnalysis.routineSchedule} />

                {/* Product Suggestions Card */}
                <div className="bg-gradient-to-br from-primary/5 to-success/5 p-6 rounded-xl shadow-card mb-6 transform transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 animate-fade-in delay-300 border border-primary/10">
                  <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">Products We Recommend</h2>
                  <p className="text-gray-600 mb-4">These carefully selected products will help address your specific hair needs and concerns.</p>
                  <div className="text-gray-700">
                    {latestAnalysis.productSuggestions?.length > 0 ? (
                      <ul className="space-y-3">
                        {latestAnalysis.productSuggestions.map((product, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            <span>{product}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>We're preparing your personalized product recommendations.</p>
                    )}
                  </div>
                </div>

                {/* AI Bonus Tips Card */}
                <div className="bg-gradient-to-br from-info/5 to-accent/5 p-6 rounded-xl shadow-card mb-6 transform transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 animate-fade-in delay-400 border border-info/10">
                  <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-info to-accent bg-clip-text text-transparent">Expert Hair Tips</h2>
                  <p className="text-gray-600 mb-4">These insider tips will help you maintain healthy, beautiful hair between salon visits.</p>
                  <div className="text-gray-700">
                    {latestAnalysis.aiBonusTips?.length > 0 ? (
                      <div className="space-y-4">
                        {latestAnalysis.aiBonusTips.map((tip, idx) => (
                          <div key={idx} className="flex items-start">
                            <div className="bg-secondary text-primary rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0">{idx + 1}</div>
                            <p>{tip.replace(/\*\*(.*?)\*\*/g, '')}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>We're preparing your expert hair care tips.</p>
                    )}
                  </div>
                </div>

                {/* Your Submission Card - from localStorage */}
                {latestAnalysis.submissionData && (
                  <div className="bg-gradient-to-br from-info/5 to-primary/5 p-6 rounded-xl shadow-card mb-6 transform transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 animate-fade-in border border-info/10">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-info to-primary bg-clip-text text-transparent">Your Submission</h2>
                      <span className="text-sm text-gray-500">{latestAnalysis.timestamp ? new Date(latestAnalysis.timestamp).toLocaleDateString() : 'Unknown Date'}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-700">
                          <span className="font-semibold">Hair Concern:</span> {latestAnalysis.submissionData.hairProblem || 'N/A'}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-semibold">Allergies:</span> {latestAnalysis.submissionData.allergies || 'None'}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-semibold">Medications:</span> {latestAnalysis.submissionData.medication || 'None'}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-semibold">Hair Dyed:</span> {latestAnalysis.submissionData.dyed || 'N/A'}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-semibold">Wash Frequency:</span> {latestAnalysis.submissionData.washFrequency || 'N/A'}
                        </p>
                        {latestAnalysis.submissionData.additionalConcerns && (
                          <p className="text-gray-700 mt-2 p-2 bg-primary/5 rounded-lg">
                            <span className="font-semibold">Your Concerns:</span> {latestAnalysis.submissionData.additionalConcerns}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-gray-700">
                          <span className="font-semibold">Products Used:</span>{' '}
                          {latestAnalysis.submissionData.productNames?.length > 0 ? latestAnalysis.submissionData.productNames.join(', ') : 'None'}
                        </p>
                        {latestAnalysis.submissionData.hairPhotos?.length > 0 && (
                          <div className="mt-4">
                            <p className="text-gray-700 font-semibold">Hair Photos:</p>
                            <div className="flex space-x-2 mt-2">
                              {latestAnalysis.submissionData.hairPhotos.map((photo, idx) => (
                                <img
                                  key={idx}
                                  src={photo}
                                  alt={`Hair Photo ${idx + 1}`}
                                  className="w-24 h-24 object-cover rounded-lg"
                                  onError={(e) => {
                                    console.error(`Failed to load photo: ${photo}`);
                                    e.target.src = 'https://placehold.co/96x96?text=Photo+Not+Found';
                                    e.target.onerror = null;
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Styling Advice Card - from localStorage */}
                <div className="bg-gradient-to-br from-accent/5 to-secondary/5 p-6 rounded-xl shadow-card transform transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 animate-fade-in delay-500 border border-accent/10">
                  <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">Styling Advice</h2>
                  <p className="text-gray-600 mb-4">Based on your hair type and condition, here are some styling suggestions that would work beautifully for you.</p>
                  <div className="text-gray-700">
                    {latestAnalysis.stylingAdvice ? (
                      <div className="space-y-4">
                        <h3 className="font-semibold mb-2">Recommended Styles:</h3>
                        <ul className="space-y-2 mb-4">
                          {latestAnalysis.stylingAdvice.recommendedStyles?.map((style, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-primary mr-3 mt-1">•</span>
                              <span>{style}</span>
                            </li>
                          )) || (
                            <>
                              <li className="flex items-start">
                                <span className="text-primary mr-3 mt-1">•</span>
                                <span>Layered cuts to enhance your natural texture</span>
                              </li>
                              <li className="flex items-start">
                                <span className="text-primary mr-3 mt-1">•</span>
                                <span>Soft waves or natural styling to showcase your hair's health</span>
                              </li>
                            </>
                          )}
                        </ul>

                        <h3 className="font-semibold mb-2">Styling Tips:</h3>
                        <ul className="space-y-2">
                          {latestAnalysis.stylingAdvice.stylingTips?.map((tip, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-primary mr-3 mt-1">•</span>
                              <span>{tip}</span>
                            </li>
                          )) || (
                            <>
                              <li className="flex items-start">
                                <span className="text-primary mr-3 mt-1">•</span>
                                <span>Always use heat protection before styling with hot tools</span>
                              </li>
                              <li className="flex items-start">
                                <span className="text-primary mr-3 mt-1">•</span>
                                <span>Consider air-drying your hair when possible to minimize damage</span>
                              </li>
                              <li className="flex items-start">
                                <span className="text-primary mr-3 mt-1">•</span>
                                <span>Apply styling products to damp hair for best results</span>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    ) : (
                      <p>We're crafting your personalized styling advice based on your hair analysis.</p>
                    )}
                  </div>
                </div>

                {/* AI Hair Analyst Chat Button */}
                <div className="text-center mt-8 mb-6">
                  <button
                    onClick={() => openChat(latestAnalysis, latestAnalysis.submissionData)}
                    className="group relative px-8 py-4 bg-gradient-to-r from-accent to-primary text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-pulse-slow"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">💬</span>
                      <span>Ask Your AI Hair Analyst</span>
                      <span className="text-xl group-hover:animate-bounce">✨</span>
                    </div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-accent to-primary rounded-full blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                  </button>
                  <p className="text-sm text-gray-600 mt-3">
                    Get personalized advice about products, styling, routines & more!
                  </p>
                </div>
              </div>
            )}

            {/* Show submissions from the database */}
            {submissions.map((submission, index) => {
              // Only show the most recent submission if showPreviousSubmissions is false
              if (index > 0 && !showPreviousSubmissions) return null;
              // No need for chart data anymore

              return (
                <div key={index} className="mb-16 relative">
                  {index > 0 && (
                  <div className="absolute -top-8 left-0 right-0 text-center">
                    <span className="inline-block px-4 py-1 bg-secondary text-neutral rounded-full text-sm font-medium">
                      Analysis from {submission.created_at ? new Date(submission.created_at).toLocaleDateString() : 'Unknown Date'}
                    </span>
                  </div>
                )}
                {/* Submission Details Card */}
                <div className="bg-gradient-to-br from-info/5 to-primary/5 p-6 rounded-xl shadow-card mb-6 transform transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 animate-fade-in border border-info/10">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-info to-primary bg-clip-text text-transparent">Your Submission</h2>
                    <span className="text-sm text-gray-500">{submission.created_at ? new Date(submission.created_at).toLocaleDateString() : 'Unknown Date'}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-700">
                        <span className="font-semibold">Hair Concern:</span> {submission.hair_problem || 'N/A'}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">Allergies:</span> {submission.allergies || 'None'}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">Medications:</span> {submission.medication || 'None'}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">Hair Dyed:</span> {submission.dyed || 'N/A'}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">Wash Frequency:</span> {submission.wash_frequency || 'N/A'}
                      </p>
                      {submission.additional_concerns && (
                        <p className="text-gray-700 mt-2 p-2 bg-primary/5 rounded-lg">
                          <span className="font-semibold">Your Concerns:</span> {submission.additional_concerns}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-700">
                        <span className="font-semibold">Products Used:</span>{' '}
                        {submission.productNames?.length > 0 ? submission.productNames.join(', ') : 'None'}
                      </p>
                      {submission.productImages?.length > 0 && (
                        <div className="mt-4">
                          <p className="text-gray-700 font-semibold">Product Images:</p>
                          <div className="flex space-x-2 mt-2 flex-wrap">
                            {submission.productImages.map((photo, idx) => (
                              <img
                                key={idx}
                                src={photo}
                                alt={`Product Image ${idx + 1}`}
                                className="w-24 h-24 object-cover rounded-lg mb-2 mr-2"
                                onError={(e) => {
                                  console.error(`Failed to load photo: ${photo}`);
                                  e.target.src = 'https://placehold.co/96x96?text=Photo+Not+Found';
                                  e.target.onerror = null;
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {submission.hair_photos?.length > 0 && (
                        <div className="mt-4">
                          <p className="text-gray-700 font-semibold">Hair Photos:</p>
                          <div className="flex space-x-2 mt-2">
                            {submission.hair_photos.map((photo, idx) => (
                              <img
                                key={idx}
                                src={photo} // Use the photo URL directly
                                alt={`Hair Photo ${idx + 1}`}
                                className="w-24 h-24 object-cover rounded-lg"
                                onError={(e) => {
                                  console.error(`Failed to load photo: ${photo}`);
                                  e.target.src = 'https://placehold.co/96x96?text=Photo+Not+Found';
                                  e.target.onerror = null; // Prevent infinite loop
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Analysis Results Card */}
                <div className="bg-gradient-to-br from-primary/5 to-accent/5 p-6 rounded-xl shadow-card mb-6 transform transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 animate-fade-in delay-100 border border-primary/10">
                  <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Your Hair Profile</h2>

                  {/* Hair Metrics */}
                  <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Moisture Metric */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-neutral">Moisture</h3>
                        <span className="text-lg font-bold text-accent">{submission.analysis?.metrics?.moisture || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-accent to-primary h-2.5 rounded-full"
                          style={{ width: `${submission.analysis?.metrics?.moisture || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Strength Metric */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-neutral">Strength</h3>
                        <span className="text-lg font-bold text-primary">{submission.analysis?.metrics?.strength || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-primary to-info h-2.5 rounded-full"
                          style={{ width: `${submission.analysis?.metrics?.strength || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Elasticity Metric */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-neutral">Elasticity</h3>
                        <span className="text-lg font-bold text-info">{submission.analysis?.metrics?.elasticity || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-info to-primary h-2.5 rounded-full"
                          style={{ width: `${submission.analysis?.metrics?.elasticity || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Scalp Health Metric */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-neutral">Scalp Health</h3>
                        <span className="text-lg font-bold text-success">{submission.analysis?.metrics?.scalpHealth || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-success to-info h-2.5 rounded-full"
                          style={{ width: `${submission.analysis?.metrics?.scalpHealth || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="text-gray-700 bg-white p-5 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-2 text-accent">What We See:</h3>
                    <div className="mb-4 whitespace-pre-line">
                      {submission.analysis?.detailedAnalysis ? (
                        <p className="text-gray-700 leading-relaxed">
                          {submission.analysis.detailedAnalysis.replace(/\*\*(.*?)\*\*/g, '$1').replace(/- /g, '')}
                        </p>
                      ) : (
                        'We\'re still analyzing your hair. Check back soon for your personalized hair profile!'
                      )}
                    </div>
                  </div>
                </div>

                {/* Haircare Routine Card */}
                <div className="bg-gradient-to-br from-success/5 to-info/5 p-6 rounded-xl shadow-card mb-6 transform transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 animate-fade-in delay-200 border border-success/10">
                  <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-success to-info bg-clip-text text-transparent">Your Perfect Hair Routine</h2>
                  <p className="text-gray-600 mb-4">Based on your unique hair profile, we've crafted a personalized routine to help your hair look and feel its best.</p>
                  <div className="text-gray-700">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2 flex items-center">
                        <span className="bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center mr-2">1</span>
                        Cleansing
                      </h3>
                      <div className="mb-2 whitespace-pre-line pl-9">
                        {submission.analysis?.haircareRoutine?.cleansing ? (
                          <p className="text-gray-700 leading-relaxed">
                            {submission.analysis.haircareRoutine.cleansing.replace(/\*\*(.*?)\*\*/g, '').replace(/- /g, '')}
                          </p>
                        ) : (
                          'We\'re working on your personalized cleansing recommendations.'
                        )}
                      </div>
                    </div>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2 flex items-center">
                        <span className="bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center mr-2">2</span>
                        Conditioning
                      </h3>
                      <div className="mb-2 whitespace-pre-line pl-9">
                        {submission.analysis?.haircareRoutine?.conditioning ? (
                          <p className="text-gray-700 leading-relaxed">
                            {submission.analysis.haircareRoutine.conditioning.replace(/\*\*(.*?)\*\*/g, '').replace(/- /g, '')}
                          </p>
                        ) : (
                          'We\'re working on your personalized conditioning recommendations.'
                        )}
                      </div>
                    </div>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2 flex items-center">
                        <span className="bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center mr-2">3</span>
                        Treatments
                      </h3>
                      <div className="mb-2 whitespace-pre-line pl-9">
                        {submission.analysis?.haircareRoutine?.treatments ? (
                          <p className="text-gray-700 leading-relaxed">
                            {submission.analysis.haircareRoutine.treatments.replace(/\*\*(.*?)\*\*/g, '').replace(/- /g, '')}
                          </p>
                        ) : (
                          'We\'re working on your personalized treatment recommendations.'
                        )}
                      </div>
                    </div>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2 flex items-center">
                        <span className="bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center mr-2">4</span>
                        Styling
                      </h3>
                      <div className="mb-2 whitespace-pre-line pl-9">
                        {submission.analysis?.haircareRoutine?.styling ? (
                          <p className="text-gray-700 leading-relaxed">
                            {submission.analysis.haircareRoutine.styling.replace(/\*\*(.*?)\*\*/g, '').replace(/- /g, '')}
                          </p>
                        ) : (
                          'We\'re working on your personalized styling recommendations.'
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Routine Schedule */}
                <RoutineSchedule routineSchedule={submission.analysis?.routineSchedule} />

                {/* Product Suggestions Card */}
                <div className="bg-gradient-to-br from-primary/5 to-success/5 p-6 rounded-xl shadow-card mb-6 transform transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 animate-fade-in delay-300 border border-primary/10">
                  <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">Products We Recommend</h2>
                  <p className="text-gray-600 mb-4">These carefully selected products will help address your specific hair needs and concerns.</p>
                  <div className="text-gray-700">
                    {submission.analysis?.productSuggestions?.length > 0 ? (
                      <ul className="space-y-3">
                        {submission.analysis.productSuggestions.map((product, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            <span>{product}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>We're preparing your personalized product recommendations.</p>
                    )}
                  </div>
                </div>

                {/* Styling Advice Card */}
                <div className="bg-gradient-to-br from-accent/5 to-info/5 p-6 rounded-xl shadow-card mb-6 transform transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 animate-fade-in delay-350 border border-accent/10">
                  <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-accent to-info bg-clip-text text-transparent">Styling Advice</h2>
                  <p className="text-gray-600 mb-4">Based on your hair type and condition, here are some styling suggestions that would work beautifully for you.</p>
                  <div className="text-gray-700">
                    {submission.analysis?.detailedAnalysis ? (
                      <div>
                        <h3 className="font-semibold mb-2">Recommended Styles:</h3>
                        <ul className="space-y-2 mb-4">
                          {submission.hair_problem?.includes("oily") ? (
                            <>
                              <li className="flex items-start">
                                <span className="text-primary mr-3 mt-1">•</span>
                                <span>Sleek high ponytails or buns to manage oil while looking polished</span>
                              </li>
                              <li className="flex items-start">
                                <span className="text-primary mr-3 mt-1">•</span>
                                <span>Textured bob cuts that add volume and reduce the appearance of oil</span>
                              </li>
                            </>
                          ) : submission.hair_problem?.includes("dry") ? (
                            <>
                              <li className="flex items-start">
                                <span className="text-primary mr-3 mt-1">•</span>
                                <span>Loose waves or curls that don't require excessive heat</span>
                              </li>
                              <li className="flex items-start">
                                <span className="text-primary mr-3 mt-1">•</span>
                                <span>Protective styles that keep moisture locked in</span>
                              </li>
                            </>
                          ) : (
                            <>
                              <li className="flex items-start">
                                <span className="text-primary mr-3 mt-1">•</span>
                                <span>Layered cuts to enhance your natural texture</span>
                              </li>
                              <li className="flex items-start">
                                <span className="text-primary mr-3 mt-1">•</span>
                                <span>Soft waves or natural styling to showcase your hair's health</span>
                              </li>
                            </>
                          )}
                        </ul>

                        <h3 className="font-semibold mb-2">Styling Tips:</h3>
                        <ul className="space-y-2">
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">•</span>
                            <span>Always use heat protection before styling with hot tools</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">•</span>
                            <span>Consider air-drying your hair when possible to minimize damage</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">•</span>
                            <span>Apply styling products to damp hair for best results</span>
                          </li>
                        </ul>
                      </div>
                    ) : (
                      <p>We're crafting your personalized styling advice based on your hair analysis.</p>
                    )}
                  </div>
                </div>

                {/* AI Bonus Tips Card */}
                <div className="bg-gradient-to-br from-info/5 to-accent/5 p-6 rounded-xl shadow-card transform transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 animate-fade-in delay-400 border border-info/10">
                  <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-info to-accent bg-clip-text text-transparent">Expert Hair Tips</h2>
                  <p className="text-gray-600 mb-4">These insider tips will help you maintain healthy, beautiful hair between salon visits.</p>
                  <div className="text-gray-700">
                    {submission.analysis?.aiBonusTips?.length > 0 ? (
                      <div className="space-y-4">
                        {submission.analysis.aiBonusTips.map((tip, idx) => (
                          <div key={idx} className="flex items-start">
                            <div className="bg-secondary text-primary rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0">{idx + 1}</div>
                            <p>{tip.replace(/\*\*(.*?)\*\*/g, '')}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>We're preparing your expert hair care tips.</p>
                    )}
                  </div>
                </div>

                {/* AI Hair Analyst Chat Button */}
                <div className="text-center mt-8 mb-6">
                  <button
                    onClick={() => openChat(submission.analysis, submission)}
                    className="group relative px-8 py-4 bg-gradient-to-r from-accent to-primary text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-pulse-slow"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">💬</span>
                      <span>Ask Your AI Hair Analyst</span>
                      <span className="text-xl group-hover:animate-bounce">✨</span>
                    </div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-accent to-primary rounded-full blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                  </button>
                  <p className="text-sm text-gray-600 mt-3">
                    Get personalized advice about products, styling, routines & more!
                  </p>
                </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Chat Modal */}
      {showChat && currentChatData && (
        <HairAnalystChat
          analysisData={currentChatData.analysisData}
          submissionData={currentChatData.submissionData}
          onClose={closeChat}
        />
      )}
    </div>
  );
};

export default Submissions;