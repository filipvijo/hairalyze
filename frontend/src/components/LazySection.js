import React from 'react';
import useIntersectionObserver from '../hooks/useIntersectionObserver';

const LazySection = ({ 
  children, 
  className = '', 
  placeholder = null,
  threshold = 0.1,
  rootMargin = '50px',
  once = true
}) => {
  const { elementRef, hasIntersected } = useIntersectionObserver({
    threshold,
    rootMargin
  });

  const shouldRender = once ? hasIntersected : hasIntersected;

  return (
    <div ref={elementRef} className={className}>
      {shouldRender ? children : (placeholder || <div className="h-32 bg-gray-100 animate-pulse rounded"></div>)}
    </div>
  );
};

export default LazySection;
