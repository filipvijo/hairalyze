import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const WhatYouGet = () => {
  const { currentUser } = useAuth();

  const features = [
    {
      icon: "🔬",
      title: "AI-Powered Hair Analysis",
      description: "Advanced computer vision analyzes your hair photos to identify texture, condition, damage levels, and specific concerns",
      value: "Worth $25+"
    },
    {
      icon: "📋",
      title: "Personalized Hair Report",
      description: "Detailed analysis covering hair type, porosity, density, scalp condition, and damage assessment with professional insights",
      value: "Worth $30+"
    },
    {
      icon: "💡",
      title: "Custom Care Routine",
      description: "Step-by-step daily, weekly, and monthly hair care schedule tailored specifically to your hair's unique needs",
      value: "Worth $20+"
    },
    {
      icon: "🛍️",
      title: "Product Recommendations",
      description: "Curated list of specific shampoos, conditioners, treatments, and styling products perfect for your hair type",
      value: "Worth $15+"
    },
    {
      icon: "✨",
      title: "Styling Advice",
      description: "Professional tips on how to style your hair, which tools to use, and techniques that work best for your texture",
      value: "Worth $20+"
    },
    {
      icon: "🎯",
      title: "Problem-Specific Solutions",
      description: "Targeted treatments and solutions for your specific hair concerns like dryness, breakage, frizz, or thinning",
      value: "Worth $25+"
    },
    {
      icon: "👩‍⚕️",
      title: "Expert Tips & Insights",
      description: "Professional hairstylist knowledge and insider secrets for maintaining healthy, beautiful hair at home",
      value: "Worth $30+"
    },
    {
      icon: "🤖",
      title: "AI Hair Analyst Chat",
      description: "Unlimited follow-up questions with our AI hair expert about products, routines, styling, and hair concerns",
      value: "Worth $40+"
    },
    {
      icon: "📱",
      title: "Lifetime Access",
      description: "Keep your analysis results forever, revisit recommendations, and track your hair journey over time",
      value: "Worth $10+"
    },
    {
      icon: "🔄",
      title: "Progress Tracking",
      description: "Monitor your hair health improvements and adjust your routine as your hair changes and grows",
      value: "Worth $15+"
    }
  ];

  const totalValue = 250; // Sum of all individual values

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <div className="absolute top-6 left-6 z-50">
        <Link
          to="/"
          className="px-4 py-2 rounded-full bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm text-white font-medium hover:bg-opacity-30 transition-all duration-300 border border-white border-opacity-30"
        >
          ← Back to Home
        </Link>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
            What You Get for Just $9.99
          </h1>
          <p className="text-xl text-white mb-8 max-w-3xl mx-auto leading-relaxed">
            Professional-grade hair analysis and personalized recommendations that would cost hundreds at a salon
          </p>
          
          {/* Value comparison */}
          <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto border border-white border-opacity-20">
            <div className="text-gray-300 text-lg mb-2">Total Value:</div>
            <div className="text-4xl font-bold text-white line-through opacity-75">${totalValue}</div>
            <div className="text-green-400 text-2xl font-semibold mt-2">Your Price: Only $9.99</div>
            <div className="text-green-300 text-lg mt-1">Save ${(totalValue - 9.99).toFixed(2)}!</div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-sm rounded-2xl p-6 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-300 mb-4 leading-relaxed">{feature.description}</p>
              <div className="text-green-400 font-semibold">{feature.value}</div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto border border-white border-opacity-20">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Hair?
            </h2>
            <p className="text-gray-300 mb-6 text-lg">
              Get instant access to your personalized hair analysis and start your journey to healthier, more beautiful hair today.
            </p>
            
            {currentUser ? (
              <Link
                to="/"
                className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-accent to-primary text-white font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Start Your Analysis Now - $5
              </Link>
            ) : (
              <div className="space-y-4">
                <Link
                  to="/signup"
                  className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-accent to-primary text-white font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 mr-4"
                >
                  Sign Up & Get Started
                </Link>
                <Link
                  to="/login"
                  className="inline-block px-8 py-4 rounded-full bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm text-white font-semibold text-lg hover:bg-opacity-30 transition-all duration-300 border border-white border-opacity-30"
                >
                  Already Have Account? Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatYouGet;
