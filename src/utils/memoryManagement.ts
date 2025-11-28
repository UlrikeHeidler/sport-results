/**
 * Memory Management Utilities
 * Optimized cleanup, memory leak prevention, and performance monitoring
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Memory leak detector for development
 */
class MemoryLeakDetector {
  private static instance: MemoryLeakDetector;
  private listeners: Map<string, number> = new Map();
  private timers: Set<any> = new Set();
  private intervals: Set<any> = new Set();
  private observers: Set<any> = new Set();

  static getInstance(): MemoryLeakDetector {
    if (!MemoryLeakDetector.instance) {
      MemoryLeakDetector.instance = new MemoryLeakDetector();
    }
    return MemoryLeakDetector.instance;
  }

  // Track event listeners
  trackListener(event: string): void {
    const count = this.listeners.get(event) || 0;
    this.listeners.set(event, count + 1);
  }

  untrackListener(event: string): void {
    const count = this.listeners.get(event) || 0;
    if (count > 0) {
      this.listeners.set(event, count - 1);
    }
  }

  // Track timers
  trackTimer(id: any): void {
    this.timers.add(id);
  }

  untrackTimer(id: any): void {
    this.timers.delete(id);
  }

  // Track intervals
  trackInterval(id: any): void {
    this.intervals.add(id);
  }

  untrackInterval(id: any): void {
    this.intervals.delete(id);
  }

  // Track observers
  trackObserver(observer: any): void {
    this.observers.add(observer);
  }

  untrackObserver(observer: any): void {
    this.observers.delete(observer);
  }

  // Get memory usage report
  getReport(): {
    listeners: Map<string, number>;
    activeTimers: number;
    activeIntervals: number;
    activeObservers: number;
    memoryUsage?: any;
    } {
    return {
      listeners: new Map(this.listeners),
      activeTimers: this.timers.size,
      activeIntervals: this.intervals.size,
      activeObservers: this.observers.size,
      memoryUsage: (performance as any).memory,
    };
  }

  // Cleanup all tracked resources
  cleanup(): void {
    // Clear timers
    this.timers.forEach(id => clearTimeout(id));
    this.timers.clear();

    // Clear intervals
    this.intervals.forEach(id => clearInterval(id));
    this.intervals.clear();

    // Disconnect observers
    this.observers.forEach(observer => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect();
      }
    });
    this.observers.clear();

    // Reset listener counts
    this.listeners.clear();
  }
}

// Global instance
export const memoryLeakDetector = MemoryLeakDetector.getInstance();

/**
 * Enhanced useEffect with automatic cleanup tracking
 */
export const useTrackedEffect = (
  effect: () => void | (() => void),
  deps?: React.DependencyList,
  debugName?: string,
) => {
  useEffect(() => {
    if (window.location.hostname === 'localhost' && debugName) {
      console.log(`Effect mounted: ${debugName}`);
    }

    const cleanup = effect();

    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
      if (window.location.hostname === 'localhost' && debugName) {
        console.log(`Effect cleaned up: ${debugName}`);
      }
    };
  }, deps);
};

/**
 * Memory-optimized event listener hook
 */
export const useOptimizedEventListener = (
  target: EventTarget | null,
  event: string,
  handler: (event: Event) => void,
  options?: AddEventListenerOptions,
) => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!target) return;

    const eventHandler = (e: Event) => handlerRef.current(e);

    target.addEventListener(event, eventHandler, options);
    memoryLeakDetector.trackListener(event);

    return () => {
      target.removeEventListener(event, eventHandler, options);
      memoryLeakDetector.untrackListener(event);
    };
  }, [target, event, options]);
};

/**
 * Memory-optimized timer hooks
 */
export const useOptimizedTimeout = (
  callback: () => void,
  delay: number | null,
  dependencies: React.DependencyList = [],
) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (delay === null) return;

    const id = setTimeout(() => callbackRef.current(), delay);
    memoryLeakDetector.trackTimer(id);

    return () => {
      clearTimeout(id);
      memoryLeakDetector.untrackTimer(id);
    };
  }, [delay, ...dependencies]);
};

export const useOptimizedInterval = (
  callback: () => void,
  delay: number | null,
  dependencies: React.DependencyList = [],
) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => callbackRef.current(), delay);
    memoryLeakDetector.trackInterval(id);

    return () => {
      clearInterval(id);
      memoryLeakDetector.untrackInterval(id);
    };
  }, [delay, ...dependencies]);
};

/**
 * Memory-optimized observer hooks
 */
export const useOptimizedIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit,
) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries, obs) => callbackRef.current(entries, obs),
      options,
    );

    observerRef.current = observer;
    memoryLeakDetector.trackObserver(observer);

    return () => {
      observer.disconnect();
      memoryLeakDetector.untrackObserver(observer);
      observerRef.current = null;
    };
  }, [options]);

  const observe = useCallback((element: Element) => {
    if (observerRef.current) {
      observerRef.current.observe(element);
    }
  }, []);

  const unobserve = useCallback((element: Element) => {
    if (observerRef.current) {
      observerRef.current.unobserve(element);
    }
  }, []);

  return { observe, unobserve };
};

export const useOptimizedResizeObserver = (
  callback: ResizeObserverCallback,
  options?: ResizeObserverOptions,
) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const observer = new ResizeObserver(
      (entries, obs) => callbackRef.current(entries, obs),
    );

    observerRef.current = observer;
    memoryLeakDetector.trackObserver(observer);

    return () => {
      observer.disconnect();
      memoryLeakDetector.untrackObserver(observer);
      observerRef.current = null;
    };
  }, []);

  const observe = useCallback((element: Element) => {
    if (observerRef.current) {
      observerRef.current.observe(element, options);
    }
  }, [options]);

  const unobserve = useCallback((element: Element) => {
    if (observerRef.current) {
      observerRef.current.unobserve(element);
    }
  }, []);

  return { observe, unobserve };
};

/**
 * Memory-optimized cache with automatic cleanup
 */
export class OptimizedCache<T> {
  private cache = new Map<string, { value: T; timestamp: number; accessCount: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = 100, ttl: number = 300000, cleanupInterval: number = 60000) {
    this.maxSize = maxSize;
    this.ttl = ttl;

    // Start cleanup interval
    const intervalId = setInterval(() => this.cleanup(), cleanupInterval);
    memoryLeakDetector.trackInterval(intervalId as any);
  }

  set(key: string, value: T): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 0,
    });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Update access count
    entry.accessCount++;
    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private evictLeastUsed(): void {
    let leastUsedKey = '';
    let leastAccessCount = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < leastAccessCount) {
        leastAccessCount = entry.accessCount;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    memoryUsage: number;
    } {
    let totalAccess = 0;
    let totalHits = 0;

    for (const entry of this.cache.values()) {
      totalAccess += entry.accessCount;
      if (entry.accessCount > 0) totalHits++;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalAccess > 0 ? totalHits / totalAccess : 0,
      memoryUsage: JSON.stringify([...this.cache.entries()]).length,
    };
  }
}

/**
 * Hook for memory usage monitoring
 */
export const useMemoryMonitor = (interval: number = 5000) => {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);

  useOptimizedInterval(() => {
    if ((performance as any).memory) {
      setMemoryInfo({
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit,
        timestamp: Date.now(),
      });
    }
  }, interval);

  return memoryInfo;
};

/**
 * Hook for component unmount cleanup
 */
export const useUnmountCleanup = (cleanup: () => void) => {
  const cleanupRef = useRef(cleanup);
  cleanupRef.current = cleanup;

  useEffect(() => {
    return () => {
      cleanupRef.current();
    };
  }, []);
};

/**
 * Weak reference utilities for preventing memory leaks
 */
export const createWeakCache = <K extends object, V>(): {
  set: (key: K, value: V) => void;
  get: (key: K) => V | undefined;
  has: (key: K) => boolean;
  delete: (key: K) => boolean;
} => {
  const cache = new WeakMap<K, V>();

  return {
    set: (key: K, value: V) => cache.set(key, value),
    get: (key: K) => cache.get(key),
    has: (key: K) => cache.has(key),
    delete: (key: K) => cache.delete(key),
  };
};

/**
 * Performance monitoring utilities
 */
export const performanceUtils = {
  // Measure component render time
  measureRender: (componentName: string) => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      if (window.location.hostname === 'localhost') {
        console.log(`${componentName} render time: ${(end - start).toFixed(2)}ms`);
      }
    };
  },

  // Measure function execution time
  measureFunction: <T extends (...args: any[]) => any>(
    fn: T,
    name: string,
  ): T => {
    return ((...args: Parameters<T>) => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();

      if (window.location.hostname === 'localhost') {
        console.log(`${name} execution time: ${(end - start).toFixed(2)}ms`);
      }

      return result;
    }) as T;
  },

  // Get performance metrics
  getMetrics: () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
      memory: (performance as any).memory,
    };
  },
};

export default {
  memoryLeakDetector,
  useTrackedEffect,
  useOptimizedEventListener,
  useOptimizedTimeout,
  useOptimizedInterval,
  useOptimizedIntersectionObserver,
  useOptimizedResizeObserver,
  OptimizedCache,
  useMemoryMonitor,
  useUnmountCleanup,
  createWeakCache,
  performanceUtils,
};
