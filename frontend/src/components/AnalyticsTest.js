import React from 'react';
import { 
  trackEvent, 
  trackHairAnalysisEvent, 
  trackCTAClick, 
  trackUserEngagement,
  debugAnalytics 
} from '../utils/analytics';

const AnalyticsTest = () => {
  const testAnalyticsEvents = () => {
    console.log('🧪 Testing Google Analytics Events...');
    
    // Test basic event tracking
    trackEvent('test_event', 'testing', 'analytics_test', 1);
    debugAnalytics('test_event', { category: 'testing', label: 'analytics_test' });
    
    // Test hair analysis specific events
    trackHairAnalysisEvent('test_hair_analysis', { hair_problem: 'test_problem' });
    debugAnalytics('test_hair_analysis', { hair_problem: 'test_problem' });
    
    // Test CTA tracking
    trackCTAClick('test_cta_button', 'test_page');
    debugAnalytics('test_cta_click', { button: 'test_cta_button', location: 'test_page' });
    
    // Test user engagement
    trackUserEngagement('test_engagement', 'test_section');
    debugAnalytics('test_engagement', { section: 'test_section' });
    
    alert('Analytics test events sent! Check browser console and Google Analytics Real-time reports.');
  };

  const checkGtagAvailability = () => {
    const isAvailable = typeof window !== 'undefined' && typeof window.gtag === 'function';
    const dataLayerExists = typeof window !== 'undefined' && Array.isArray(window.dataLayer);
    
    console.log('🔍 Google Analytics Status Check:', {
      gtagAvailable: isAvailable,
      dataLayerExists: dataLayerExists,
      dataLayerLength: dataLayerExists ? window.dataLayer.length : 0,
      measurementId: 'G-JD9VYSESBK'
    });
    
    alert(`Google Analytics Status:\n- gtag available: ${isAvailable}\n- dataLayer exists: ${dataLayerExists}\n- Measurement ID: G-JD9VYSESBK`);
  };

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#f0f0f0',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: 9999,
      fontSize: '12px',
      maxWidth: '200px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Analytics Test</h4>
      <button 
        onClick={checkGtagAvailability}
        style={{
          display: 'block',
          width: '100%',
          margin: '5px 0',
          padding: '5px',
          fontSize: '11px',
          cursor: 'pointer'
        }}
      >
        Check GA4 Status
      </button>
      <button 
        onClick={testAnalyticsEvents}
        style={{
          display: 'block',
          width: '100%',
          margin: '5px 0',
          padding: '5px',
          fontSize: '11px',
          cursor: 'pointer'
        }}
      >
        Test Events
      </button>
      <p style={{ margin: '5px 0 0 0', fontSize: '10px', color: '#666' }}>
        Dev mode only
      </p>
    </div>
  );
};

export default AnalyticsTest;
