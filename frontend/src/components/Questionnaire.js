import React, { useState } from 'react';
import Modal from 'react-modal';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';

Modal.setAppElement('#root');

const Questionnaire = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    hairProblem: '',
    allergies: '',
    medication: '',
    dyed: '',
    washFrequency: '',
    hairPhotos: [],
    productImages: [],
    productNames: [],
    additionalConcerns: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e, type) => {
    const files = Array.from(e.target.files);
    const compressedFiles = [];
    const options = {
      maxSizeMB: 0.8, // Reduced from 1MB for better performance
      maxWidthOrHeight: 1024,
      useWebWorker: true,
      fileType: 'image/jpeg', // Convert to JPEG for better compression
      quality: 0.85, // Good balance between quality and size
    };

    try {
      for (const file of files) {
        const compressedFile = await imageCompression(file, options);
        compressedFiles.push(compressedFile);
      }
      setFormData((prev) => ({
        ...prev,
        [type === 'hair' ? 'hairPhotos' : 'productImages']: compressedFiles,
      }));
    } catch (error) {
      console.error('Error compressing images:', error);
    }
  };

  const handleProductNamesChange = (e) => {
    const value = e.target.value.split(',').map((item) => item.trim());
    setFormData((prev) => ({ ...prev, productNames: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Get authentication token based on provider
      let token = null;

      if (currentUser.isFirebaseUser) {
        // Firebase user - get Firebase token
        console.log('🔥 Getting Firebase token for submission');
        token = await currentUser.getIdToken();
      } else {
        // Supabase user - get Supabase token
        console.log('🔵 Getting Supabase token for submission');
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
        if (!token) {
          throw new Error('Supabase authentication token not available. Please log in again.');
        }
      }

      const data = new FormData();
      data.append('hairProblem', formData.hairProblem);
      data.append('allergies', formData.allergies);
      data.append('medication', formData.medication);
      data.append('dyed', formData.dyed);
      data.append('washFrequency', formData.washFrequency);
      data.append('additionalConcerns', formData.additionalConcerns);
      data.append('productNames', JSON.stringify(formData.productNames));
      formData.hairPhotos.forEach((photo) => data.append('hairPhotos', photo));
      formData.productImages.forEach((image) => data.append('productImages', image));

      // Use environment variable for API URL
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      console.log('🔧 Submitting to API URL:', apiUrl);

      console.log('About to submit with headers:', {
        'Authorization': `Bearer ${token}`,
        'X-User-ID': currentUser.id
      });

      // Get user ID based on auth provider
      const userId = currentUser.isFirebaseUser ? currentUser.uid : currentUser.id;

      const response = await axios.post(`${apiUrl}/api/submit`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-ID': userId // Works for both Firebase (uid) and Supabase (id)
        }
      });
      console.log('Submission response:', response.data);

      // Store the analysis results in localStorage for immediate access
      if (response.data) {
        // If submission was successful (has submissionId), don't store in localStorage
        // as it will be fetched from database
        if (!response.data.submissionId) {
          localStorage.setItem('latestAnalysis', JSON.stringify({
            timestamp: new Date().toISOString(),
            hairAnalysis: response.data.hairAnalysis,
            metrics: response.data.metrics,
            haircareRoutine: response.data.haircareRoutine,
            productSuggestions: response.data.productSuggestions,
            aiBonusTips: response.data.aiBonusTips,
            stylingAdvice: response.data.stylingAdvice,
            warning: response.data.warning || null,
            submissionData: {
              hairProblem: formData.hairProblem,
              allergies: formData.allergies,
              medication: formData.medication,
              dyed: formData.dyed,
              washFrequency: formData.washFrequency,
              additionalConcerns: formData.additionalConcerns,
              productNames: formData.productNames,
              hairPhotos: formData.hairPhotos
            }
          }));
        } else {
          // Clear any existing localStorage data since we have a successful database save
          localStorage.removeItem('latestAnalysis');
        }
      }

      setTimeout(() => {
        setIsSubmitting(false);
        navigate('/submissions');
      }, 2000); // Simulate animation delay
    } catch (error) {
      console.error('Error submitting form:', error);

      // Check if we got a response with data despite the error
      if (error.response && error.response.data) {
        console.log('Error response data:', error.response.data);

        // If we have analysis data in the error response, store it and continue
        if (error.response.data.hairAnalysis) {
          localStorage.setItem('latestAnalysis', JSON.stringify({
            timestamp: new Date().toISOString(),
            hairAnalysis: error.response.data.hairAnalysis,
            metrics: error.response.data.metrics,
            haircareRoutine: error.response.data.haircareRoutine,
            productSuggestions: error.response.data.productSuggestions,
            aiBonusTips: error.response.data.aiBonusTips,
            stylingAdvice: error.response.data.stylingAdvice,
            warning: 'Your analysis was completed but could not be saved to our database.',
            submissionData: {
              hairProblem: formData.hairProblem,
              allergies: formData.allergies,
              medication: formData.medication,
              dyed: formData.dyed,
              washFrequency: formData.washFrequency,
              additionalConcerns: formData.additionalConcerns,
              productNames: formData.productNames,
              hairPhotos: formData.hairPhotos
            }
          }));

          setTimeout(() => {
            setIsSubmitting(false);
            navigate('/submissions');
          }, 2000);
          return;
        }
      }

      // If we couldn't recover any data, show an error
      setIsSubmitting(false);
      alert('There was an error processing your submission. Please try again later.');
    }
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const modalVariants = {
    hidden: { opacity: 0, y: 20, x: 0 },
    visible: { opacity: 1, y: 0, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    exit: { opacity: 0, y: -20, x: 0, transition: { duration: 0.3, ease: 'easeIn' } },
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative py-10">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-dark bg-opacity-70"></div>
        <img
          src="/images/image_7.png"
          alt="Stylish hair background"
          className="absolute object-cover w-full h-full"
        />
      </div>
      <AnimatePresence>
        {step === 1 && (
          <motion.div
            key="step1"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white bg-opacity-80 backdrop-filter backdrop-blur-sm p-8 rounded-xl shadow-card w-full max-w-md animate-fade-in relative z-10 border border-white border-opacity-20"
          >
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Tell Us About Your Hair</h2>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">What’s your main hair concern?</label>
              <input
                type="text"
                name="hairProblem"
                value={formData.hairProblem}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
                placeholder="E.g., Dry scalp, dandruff"
              />
            </div>
            <button
              onClick={nextStep}
              className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-accent to-primary text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              Next
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white bg-opacity-80 backdrop-filter backdrop-blur-sm p-8 rounded-xl shadow-card w-full max-w-md animate-fade-in relative z-10 border border-white border-opacity-20"
          >
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Health Information</h2>
            <p className="text-sm text-gray-500 mb-4 italic">We ask about this information only to see if it could be related to your specific hair condition. You can skip these fields if you're not comfortable sharing this information.</p>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Any allergies?</label>
              <input
                type="text"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
                placeholder="E.g., Nuts, sulfates"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Current medications?</label>
              <input
                type="text"
                name="medication"
                value={formData.medication}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
                placeholder="E.g., Thyroid medication"
              />
            </div>
            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="px-6 py-3 rounded-full bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-all duration-300"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-accent to-primary text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white bg-opacity-80 backdrop-filter backdrop-blur-sm p-8 rounded-xl shadow-card w-full max-w-md animate-fade-in relative z-10 border border-white border-opacity-20"
          >
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Hair Care Habits</h2>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Is your hair dyed?</label>
              <select
                name="dyed"
                value={formData.dyed}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
              >
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">How often do you wash your hair?</label>
              <input
                type="text"
                name="washFrequency"
                value={formData.washFrequency}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
                placeholder="E.g., Every other day"
              />
            </div>
            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="px-6 py-3 rounded-full bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-all duration-300"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-accent to-primary text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white bg-opacity-80 backdrop-filter backdrop-blur-sm p-8 rounded-xl shadow-card w-full max-w-md animate-fade-in relative z-10 border border-white border-opacity-20"
          >
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Upload Hair Photos</h2>
            <p className="text-gray-600 mb-4">Upload 1-3 photos of your hair for analysis. For best results, we recommend including:</p>
            <ul className="list-disc pl-5 mb-4 text-gray-600">
              <li>Hair length from the back</li>
              <li>Hair ends close-up</li>
              <li>Hair parting or scalp close-up</li>
            </ul>
            <p className="text-sm text-gray-500 italic mb-4">More photos = more accurate analysis. You can upload 1-3 photos.</p>
            <div className="mb-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'hair')}
                className="w-full p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300 cursor-pointer"
              />
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-500">
                    {formData.hairPhotos.length} photo(s) uploaded
                  </p>
                  <p className="text-sm font-medium">
                    {formData.hairPhotos.length === 0 && 'No photos'}
                    {formData.hairPhotos.length === 1 && 'Basic analysis'}
                    {formData.hairPhotos.length === 2 && 'Good analysis'}
                    {formData.hairPhotos.length === 3 && 'Comprehensive analysis'}
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${formData.hairPhotos.length === 1 ? 'bg-amber-500' : formData.hairPhotos.length === 2 ? 'bg-lime-500' : formData.hairPhotos.length === 3 ? 'bg-gradient-to-r from-accent to-primary' : 'bg-gray-300'}`}
                    style={{ width: `${formData.hairPhotos.length * 33.33}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="px-6 py-3 rounded-full bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-all duration-300"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-accent to-primary text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                disabled={formData.hairPhotos.length < 1 || formData.hairPhotos.length > 3}
              >
                Next
              </button>
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div
            key="step5"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white bg-opacity-80 backdrop-filter backdrop-blur-sm p-8 rounded-xl shadow-card w-full max-w-md animate-fade-in relative z-10 border border-white border-opacity-20"
          >
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Optional: Products</h2>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Product names (comma-separated)</label>
              <input
                type="text"
                onChange={handleProductNamesChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
                placeholder="E.g., Shampoo X, Conditioner Y"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Upload product images (optional)</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'product')}
                className="w-full p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300 cursor-pointer"
              />
              <p className="text-sm text-gray-500 mt-2">
                {formData.productImages.length} image(s) uploaded
              </p>
            </div>
            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="px-6 py-3 rounded-full bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-all duration-300"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-accent to-primary text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}

        {step === 6 && (
          <motion.div
            key="step6"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white bg-opacity-80 backdrop-filter backdrop-blur-sm p-8 rounded-xl shadow-card w-full max-w-md animate-fade-in relative z-10 border border-white border-opacity-20"
          >
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Additional Concerns</h2>
            <p className="text-gray-600 mb-4">Please share any specific concerns or questions you'd like our AI to address about your hair.</p>
            <div className="mb-6">
              <textarea
                name="additionalConcerns"
                value={formData.additionalConcerns}
                onChange={handleChange}
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300 min-h-[120px]"
                placeholder="E.g., I'm concerned about split ends, I want to know if my current routine is good for my hair type, etc."
              />
            </div>
            <div className="flex justify-between mb-8">
              <button
                onClick={prevStep}
                className="px-6 py-3 rounded-full bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-all duration-300"
              >
                Back
              </button>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={handleSubmit}
                className="px-10 py-5 rounded-full bg-gradient-to-r from-accent to-primary text-white font-semibold text-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden group disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed w-full max-w-xs"
                disabled={isSubmitting}
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-90 transition-opacity duration-300 z-0"></span>
                <span className="relative z-20 flex items-center justify-center">
                  {isSubmitting ? 'Analyzing...' : 'Analyze My Hair'}
                  {!isSubmitting && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isSubmitting && (
        <motion.div
          className="fixed inset-0 flex flex-col items-center justify-center bg-dark bg-opacity-80 backdrop-filter backdrop-blur-sm z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white bg-opacity-90 backdrop-filter backdrop-blur-sm p-10 rounded-2xl shadow-elevated flex flex-col items-center border border-white border-opacity-20 relative overflow-hidden"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden z-0">
              <div className="absolute top-0 right-0 bg-primary opacity-5 rounded-full w-64 h-64 -mt-16 -mr-16"></div>
              <div className="absolute bottom-0 left-0 bg-accent opacity-5 rounded-full w-64 h-64 -mb-16 -ml-16"></div>
            </div>

            {/* Spinner */}
            <div className="relative z-10">
              <motion.div
                className="w-24 h-24 mb-6 rounded-full border-4 border-t-accent border-r-primary border-b-info border-l-transparent"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              />

              {/* Inner spinner for extra flair */}
              <motion.div
                className="w-16 h-16 rounded-full border-4 border-t-transparent border-r-accent border-b-primary border-l-info absolute top-4 left-4"
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
              />
            </div>

            {/* Text content */}
            <motion.h3
              className="text-3xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent mb-3 relative z-10"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              Hairalyzing...
            </motion.h3>
            <p className="text-gray-600 text-lg relative z-10">Our AI is analyzing your hair data</p>

            {/* Progress dots */}
            <div className="mt-4 flex space-x-2 relative z-10">
              <motion.div
                className="w-2 h-2 rounded-full bg-accent"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 1, delay: 0 }}
              />
              <motion.div
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 1, delay: 0.3 }}
              />
              <motion.div
                className="w-2 h-2 rounded-full bg-info"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 1, delay: 0.6 }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Questionnaire;