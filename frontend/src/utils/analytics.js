// Google Analytics 4 Utility Functions
// Measurement ID: G-JD9VYSESBK

const GA_MEASUREMENT_ID = 'G-JD9VYSESBK';

// Check if gtag is available
const isGtagAvailable = () => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

// Track page views
export const trackPageView = (page_title, page_location) => {
  if (isGtagAvailable()) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_title,
      page_location,
      send_page_view: true
    });
  }
};

// Track custom events
export const trackEvent = (action, category, label, value) => {
  if (isGtagAvailable()) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
};

// Track hair analysis specific events
export const trackHairAnalysisEvent = (eventName, parameters = {}) => {
  if (isGtagAvailable()) {
    window.gtag('event', eventName, {
      event_category: 'hair_analysis',
      ...parameters
    });
  }
};

// Track conversion events
export const trackConversion = (eventName, transactionData = {}) => {
  if (isGtagAvailable()) {
    window.gtag('event', eventName, {
      event_category: 'conversion',
      currency: 'USD',
      value: 9.99,
      ...transactionData
    });
  }
};

// Specific tracking functions for Hairalyzer events

// Track when user starts hair analysis
export const trackAnalysisStart = (userHairProblem = '') => {
  trackHairAnalysisEvent('analysis_start', {
    hair_problem: userHairProblem,
    event_label: 'start_analysis_button'
  });
};

// Track when user completes payment
export const trackPaymentComplete = (paymentMethod = '', amount = 9.99) => {
  trackConversion('purchase', {
    transaction_id: Date.now().toString(),
    value: amount,
    currency: 'USD',
    payment_method: paymentMethod,
    item_category: 'hair_analysis'
  });
};

// Track when user completes questionnaire
export const trackQuestionnaireComplete = (hairProblem, additionalConcerns) => {
  trackHairAnalysisEvent('questionnaire_complete', {
    hair_problem: hairProblem,
    has_additional_concerns: !!additionalConcerns,
    event_label: 'questionnaire_submission'
  });
};

// Track when user uploads photos
export const trackPhotoUpload = (photoType, photoCount) => {
  trackHairAnalysisEvent('photo_upload', {
    photo_type: photoType,
    photo_count: photoCount,
    event_label: 'photo_upload_complete'
  });
};

// Track when analysis results are viewed
export const trackResultsView = (analysisId = '') => {
  trackHairAnalysisEvent('results_view', {
    analysis_id: analysisId,
    event_label: 'view_analysis_results'
  });
};

// Track user engagement events
export const trackUserEngagement = (action, section = '') => {
  trackEvent(action, 'engagement', section);
};

// Track signup/login events
export const trackUserAuth = (action, method = '') => {
  trackEvent(action, 'user_auth', method);
};

// Track navigation events
export const trackNavigation = (destination, source = '') => {
  trackEvent('navigate', 'navigation', `${source}_to_${destination}`);
};

// Track CTA button clicks
export const trackCTAClick = (buttonName, location = '') => {
  trackEvent('click', 'cta', `${buttonName}_${location}`);
};

// Track form interactions
export const trackFormInteraction = (formName, action, field = '') => {
  trackEvent(action, 'form', `${formName}_${field}`);
};

// Track error events
export const trackError = (errorType, errorMessage = '', page = '') => {
  trackEvent('error', 'error_tracking', `${errorType}_${page}`, {
    error_message: errorMessage
  });
};

// Track performance metrics
export const trackPerformance = (metricName, value, unit = 'ms') => {
  trackEvent('performance', 'performance_metrics', metricName, value);
};

// Enhanced ecommerce tracking for product recommendations
export const trackProductRecommendation = (productName, category = 'hair_care') => {
  trackEvent('product_recommendation', 'ecommerce', productName, {
    item_category: category,
    event_label: 'ai_recommendation'
  });
};

// Track AI chat interactions
export const trackAIChatInteraction = (action, messageType = '') => {
  trackHairAnalysisEvent('ai_chat', {
    chat_action: action,
    message_type: messageType,
    event_label: 'ai_hair_analyst_chat'
  });
};

// Debug function for development
export const debugAnalytics = (eventName, parameters) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Analytics Debug:', {
      event: eventName,
      parameters,
      timestamp: new Date().toISOString()
    });
  }
};

// Initialize analytics on app load
export const initializeAnalytics = () => {
  if (isGtagAvailable()) {
    // Track initial page load
    trackPageView(document.title, window.location.href);

    // Set user properties if available
    const userId = localStorage.getItem('userId');
    if (userId) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        user_id: userId
      });
    }

    console.log('✅ Google Analytics 4 initialized with ID:', GA_MEASUREMENT_ID);
  } else {
    console.warn('⚠️ Google Analytics not available');
  }
};
