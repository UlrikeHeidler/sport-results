/**
 * Lazy Loading Utilities
 * Code splitting and dynamic imports for better performance
 */

import React, { Suspense, ComponentType, LazyExoticComponent } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Loading fallback component
const LoadingFallback: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="loading-fallback" role="status" aria-live="polite">
    <div className="loading-spinner">⏳</div>
    <span className="loading-message">{message}</span>
  </div>
);

// Error fallback component
const ErrorFallback: React.FC<{ error?: string }> = ({ error = 'Failed to load component' }) => (
  <div className="error-fallback" role="alert">
    <div className="error-icon">⚠️</div>
    <span className="error-message">{error}</span>
    <button onClick={() => window.location.reload()} className="retry-button">
      Retry
    </button>
  </div>
);

/**
 * Higher-order component for lazy loading with error boundary and loading state
 */
export const withLazyLoading = <P extends object>(
  LazyComponent: LazyExoticComponent<ComponentType<P>>,
  options: {
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    loadingMessage?: string;
    errorMessage?: string;
  } = {},
) => {
  const {
    fallback,
    errorFallback,
    loadingMessage = 'Loading component...',
    errorMessage = 'Failed to load component',
  } = options;

  return (props: P) => (
    <ErrorBoundary fallback={errorFallback || <ErrorFallback error={errorMessage} />}>
      <Suspense fallback={fallback || <LoadingFallback message={loadingMessage} />}>
        <LazyComponent {...(props as any)} />
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * Lazy load components with retry mechanism
 */
export const lazyWithRetry = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  maxRetries: number = 3,
): LazyExoticComponent<T> => {
  return React.lazy(async () => {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await importFunc();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Failed to load component (attempt ${i + 1}/${maxRetries}):`, error);

        // Wait before retrying (exponential backoff)
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    throw lastError!;
  });
};

/**
 * Preload a lazy component
 */
export const preloadComponent = (importFunc: () => Promise<any>): Promise<any> => {
  return importFunc();
};

/**
 * Hook for lazy loading with intersection observer
 */
export const useLazyLoad = (threshold: number = 0.1) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

/**
 * Lazy loaded components for the sports app
 */

// Settings component
export const LazySettings = lazyWithRetry(
  () => import('../components/Settings'),
  3,
);

// Info Modal component
export const LazyInfoModal = lazyWithRetry(
  () => import('../components/InfoModal'),
  3,
);

// Incremental Updates Monitor
export const LazyIncrementalUpdatesMonitor = lazyWithRetry(
  () => import('../components/IncrementalUpdatesMonitor'),
  3,
);

// Game Tile Factory (for dynamic loading)
export const LazyGameTileFactory = lazyWithRetry(
  () => import('../components/game-tiles/GameTileFactory'),
  3,
);

// Enhanced Settings with lazy loading
export const EnhancedLazySettings = withLazyLoading(LazySettings, {
  loadingMessage: 'Loading settings...',
  errorMessage: 'Failed to load settings',
});

// Enhanced Info Modal with lazy loading
export const EnhancedLazyInfoModal = withLazyLoading(LazyInfoModal, {
  loadingMessage: 'Loading information...',
  errorMessage: 'Failed to load information',
});

// Enhanced Incremental Updates Monitor with lazy loading
export const EnhancedLazyIncrementalUpdatesMonitor = withLazyLoading(LazyIncrementalUpdatesMonitor, {
  loadingMessage: 'Loading monitor...',
  errorMessage: 'Failed to load monitor',
});

/**
 * Route-based lazy loading (for future use)
 */
export const createLazyRoute = (
  importFunc: () => Promise<{ default: ComponentType<any> }>,
  fallback?: React.ReactNode,
) => {
  const LazyComponent = React.lazy(importFunc);

  return (props: any) => (
    <ErrorBoundary>
      <Suspense fallback={fallback || <LoadingFallback message="Loading page..." />}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * Bundle splitting utilities
 */
export const bundleUtils = {
  // Preload critical components
  preloadCritical: async () => {
    const promises = [
      preloadComponent(() => import('../components/game-tiles/UnifiedGameTile')),
      preloadComponent(() => import('../components/shared/TeamInfo')),
      preloadComponent(() => import('../components/shared/TeamScore')),
    ];

    try {
      await Promise.all(promises);
      console.log('Critical components preloaded');
    } catch (error) {
      console.warn('Failed to preload some critical components:', error);
    }
  },

  // Preload non-critical components
  preloadNonCritical: async () => {
    const promises = [
      preloadComponent(() => import('../components/Settings')),
      preloadComponent(() => import('../components/InfoModal')),
      preloadComponent(() => import('../components/IncrementalUpdatesMonitor')),
    ];

    try {
      await Promise.all(promises);
      console.log('Non-critical components preloaded');
    } catch (error) {
      console.warn('Failed to preload some non-critical components:', error);
    }
  },

  // Get bundle size information (development only)
  getBundleInfo: () => {
    if (window.location.hostname === 'localhost') {
      return {
        chunks: performance.getEntriesByType('navigation'),
        resources: performance.getEntriesByType('resource'),
        memory: (performance as any).memory,
      };
    }
    return null;
  },
};

/**
 * Performance monitoring for lazy loading
 */
export const useLazyLoadingPerformance = () => {
  const [metrics, setMetrics] = React.useState({
    loadTime: 0,
    chunkCount: 0,
    totalSize: 0,
  });

  React.useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      let totalSize = 0;
      let chunkCount = 0;

      entries.forEach((entry) => {
        if (entry.name.includes('chunk')) {
          chunkCount++;
          totalSize += (entry as any).transferSize || 0;
        }
      });

      setMetrics(prev => ({
        ...prev,
        chunkCount: prev.chunkCount + chunkCount,
        totalSize: prev.totalSize + totalSize,
      }));
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => observer.disconnect();
  }, []);

  return metrics;
};

export default {
  withLazyLoading,
  lazyWithRetry,
  preloadComponent,
  useLazyLoad,
  bundleUtils,
  useLazyLoadingPerformance,
  // Lazy components
  LazySettings: EnhancedLazySettings,
  LazyInfoModal: EnhancedLazyInfoModal,
  LazyIncrementalUpdatesMonitor: EnhancedLazyIncrementalUpdatesMonitor,
};
