import React, { useState, useRef, useEffect } from 'react';

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  sizes = '100vw',
  priority = false,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef();

  // Generate WebP and responsive sources
  const getImageSources = (originalSrc) => {
    if (!originalSrc) return { webp: '', fallback: originalSrc, srcSet: '' };

    const extension = originalSrc.split('.').pop().toLowerCase();
    const basePath = originalSrc.replace(`.${extension}`, '');

    // Generate responsive image sources
    const webpSrcSet = [
      `${basePath}-small.webp 400w`,
      `${basePath}-medium.webp 800w`,
      `${basePath}.webp 1200w`
    ].join(', ');

    const fallbackSrcSet = [
      `${basePath}-small${extension} 400w`,
      `${basePath}-medium${extension} 800w`,
      `${basePath}${extension} 1200w`
    ].join(', ');

    return {
      webp: `${basePath}.webp`,
      fallback: originalSrc,
      webpSrcSet,
      fallbackSrcSet
    };
  };

  const { webp, fallback, webpSrcSet, fallbackSrcSet } = getImageSources(src);

  useEffect(() => {
    if (priority) return; // Skip intersection observer for priority images

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  // Placeholder SVG for better UX
  const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+';

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} {...props}>
      {/* Placeholder */}
      {!isLoaded && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />
      )}
      
      {/* Optimized image with WebP support and responsive sizes */}
      {isInView && (
        <picture>
          <source
            srcSet={webpSrcSet || webp}
            type="image/webp"
            sizes={sizes}
          />
          <source
            srcSet={fallbackSrcSet || fallback}
            sizes={sizes}
          />
          <img
            src={hasError ? fallback : (webp || fallback)}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading={priority ? 'eager' : 'lazy'}
            sizes={sizes}
            width="auto"
            height="auto"
          />
        </picture>
      )}
    </div>
  );
};

export default OptimizedImage;
