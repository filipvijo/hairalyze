import { useEffect } from 'react';
import { reportWebVitals } from '../utils/performance';

const PerformanceMonitor = () => {
  useEffect(() => {
    // Monitor Web Vitals
    reportWebVitals((metric) => {
      // Log performance metrics
      console.log('Web Vital:', metric);
      
      // Track in analytics if available
      if (window.gtag) {
        window.gtag('event', 'web_vitals', {
          event_category: 'Performance',
          event_label: metric.name,
          value: Math.round(metric.value),
          custom_parameter_1: metric.name,
          custom_parameter_2: metric.rating
        });
      }
      
      // Send to performance monitoring service (optional)
      if (process.env.NODE_ENV === 'production') {
        // You can send metrics to your analytics service here
        fetch('/api/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: metric.name,
            value: metric.value,
            rating: metric.rating,
            timestamp: Date.now(),
            url: window.location.href
          })
        }).catch(() => {
          // Silently fail if performance endpoint is not available
        });
      }
    });

    // Monitor resource loading times
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          console.log('Navigation timing:', {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            totalTime: entry.loadEventEnd - entry.fetchStart
          });
        }
        
        if (entry.entryType === 'resource' && entry.name.includes('image')) {
          console.log('Image load time:', {
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize
          });
        }
      });
    });

    // Observe navigation and resource timing
    if ('PerformanceObserver' in window) {
      try {
        observer.observe({ entryTypes: ['navigation', 'resource'] });
      } catch (e) {
        // Fallback for older browsers
        console.log('PerformanceObserver not fully supported');
      }
    }

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      const logMemoryUsage = () => {
        const memory = performance.memory;
        console.log('Memory usage:', {
          used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
          total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
          limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
        });
      };

      // Log memory usage every 30 seconds in development
      if (process.env.NODE_ENV === 'development') {
        const memoryInterval = setInterval(logMemoryUsage, 30000);
        return () => {
          clearInterval(memoryInterval);
          observer.disconnect();
        };
      }
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default PerformanceMonitor;
