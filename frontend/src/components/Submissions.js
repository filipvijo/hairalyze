import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Submissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreviousSubmissions, setShowPreviousSubmissions] = useState(false);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await axios.get(`${apiUrl}/api/submissions`);
        setSubmissions(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load submissions. Please try again later.');
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <p className="text-gray-700 text-xl">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-light py-10">
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

        {submissions.length === 0 ? (
          <p className="text-gray-700 text-center">No submissions found. Complete the questionnaire to see your results.</p>
        ) : (
          submissions.map((submission, index) => {
            // Only show the most recent submission if showPreviousSubmissions is false
            if (index > 0 && !showPreviousSubmissions) return null;
            // No need for chart data anymore

            return (
              <div key={index} className="mb-16 relative">
                {index > 0 && (
                  <div className="absolute -top-8 left-0 right-0 text-center">
                    <span className="inline-block px-4 py-1 bg-secondary text-neutral rounded-full text-sm font-medium">
                      Analysis from {new Date(submission.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {/* Submission Details Card */}
                <div className="bg-gradient-to-br from-info/5 to-primary/5 p-6 rounded-xl shadow-card mb-6 transform transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 animate-fade-in border border-info/10">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-info to-primary bg-clip-text text-transparent">Your Submission</h2>
                    <span className="text-sm text-gray-500">{new Date(submission.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-700">
                        <span className="font-semibold">Hair Concern:</span> {submission.hairProblem || 'N/A'}
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
                        <span className="font-semibold">Wash Frequency:</span> {submission.washFrequency || 'N/A'}
                      </p>
                      {submission.additionalConcerns && (
                        <p className="text-gray-700 mt-2 p-2 bg-primary/5 rounded-lg">
                          <span className="font-semibold">Your Concerns:</span> {submission.additionalConcerns}
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
                      {submission.hairPhotos?.length > 0 && (
                        <div className="mt-4">
                          <p className="text-gray-700 font-semibold">Hair Photos:</p>
                          <div className="flex space-x-2 mt-2">
                            {submission.hairPhotos.map((photo, idx) => (
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
                          {submission.hairProblem?.includes("oily") ? (
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
                          ) : submission.hairProblem?.includes("dry") ? (
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Submissions;