/**
 * ZoomControls Component
 * Extracted from App.jsx to handle all zoom-related functionality
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './ZoomControls.css';

const ZOOM_KEY = 'sportsAppZoom';

export const useZoomControls = () => {
  // Zoom state (scale factor). Persist in localStorage so user's zoom survives reloads
  const [scale, setScale] = useState(() => {
    try {
      const v = localStorage.getItem(ZOOM_KEY);
      return v ? Number(v) : 1;
    } catch (e) {
      return 1;
    }
  });

  const [transformOrigin, setTransformOrigin] = useState('top center');
  const wrapperRef = useRef(null);
  
  // For pinch handling
  const pinchRef = useRef({ active: false, startDist: 0, startScale: 1 });

  // Persist zoom level and update CSS variable
  useEffect(() => {
    try { 
      localStorage.setItem(ZOOM_KEY, String(scale)); 
    } catch (e) { 
      /* ignore */ 
    }
    try { 
      document.documentElement.style.setProperty('--app-scale', String(scale)); 
    } catch (e) { 
      /* ignore */ 
    }
  }, [scale]);

  // Touch handlers for pinch-to-zoom
  const onTouchStart = useCallback((e) => {
    if (e.touches && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { 
        active: true, 
        startDist: Math.hypot(dx, dy), 
        startScale: scale 
      };
    }
  }, [scale]);

  const onTouchMove = useCallback((e) => {
    if (pinchRef.current.active && e.touches && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / (pinchRef.current.startDist || dist || 1);
      let newScale = pinchRef.current.startScale * ratio;
      // clamp
      newScale = Math.max(0.5, Math.min(2.0, newScale));
      setScale(newScale);
      e.preventDefault();
    }
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (pinchRef.current.active) {
      pinchRef.current.active = false;
    }
  }, []);

  // Zoom helpers (buttons/keyboard)
  const zoomStep = 0.05;
  const clamp = (v) => Math.max(0.5, Math.min(2.0, v));
  const zoomIn = useCallback(() => setScale(s => clamp(Number((s + zoomStep).toFixed(2)))), []);
  const zoomOut = useCallback(() => setScale(s => clamp(Number((s - zoomStep).toFixed(2)))), []);
  const resetZoom = useCallback(() => setScale(1), []);

  // Keyboard shortcuts and wheel (trackpad pinch) support
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key === '+' || e.key === '=') { // '=' also for '+' without shift in some keyboards
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        resetZoom();
      }
    };

    const onWheel = (e) => {
      // when user pinches on trackpad in many browsers, ctrlKey is true
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const delta = -e.deltaY; // positive to zoom in
      const factor = delta > 0 ? 1 + zoomStep : 1 - zoomStep;
      setScale(s => clamp(Number((s * factor).toFixed(2))));
    };

    window.addEventListener('keydown', onKey, { passive: false });
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
    };
  }, [zoomIn, zoomOut, resetZoom]);

  // Dynamic transform origin for better UX across sizes
  useEffect(() => {
    const updateOrigin = () => {
      const w = window.innerWidth || 1024;
      // On small screens, keep origin centered to keep header aligned; on wide screens, use left top
      setTransformOrigin(w < 768 ? 'top center' : 'top left');
    };
    updateOrigin();
    window.addEventListener('resize', updateOrigin);
    return () => window.removeEventListener('resize', updateOrigin);
  }, []);

  return {
    scale,
    transformOrigin,
    wrapperRef,
    zoomIn,
    zoomOut,
    resetZoom,
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
};

/**
 * ZoomControls component for displaying zoom buttons and percentage
 */
export const ZoomControls = ({ 
  scale, 
  zoomIn, 
  zoomOut, 
  resetZoom, 
  className = '',
  showPercentage = true,
  variant = 'full' // 'full' | 'minimal'
}) => {
  const percentage = Math.round(scale * 100);

  if (variant === 'minimal') {
    return (
      <div className={`zoom-controls minimal ${className}`}>
        <button 
          className="zoom-btn minimal" 
          onClick={zoomOut} 
          title="Zoom out"
          aria-label="Zoom out"
        >
          ➖
        </button>
        {showPercentage && (
          <div 
            className="zoom-display minimal" 
            title={`Zoom: ${percentage}%`}
          >
            {percentage}%
          </div>
        )}
        <button 
          className="zoom-btn minimal" 
          onClick={zoomIn} 
          title="Zoom in"
          aria-label="Zoom in"
        >
          ➕
        </button>
      </div>
    );
  }

  return (
    <div className={`zoom-controls ${className}`}>
      <button 
        className="zoom-btn" 
        onClick={zoomOut} 
        title="Zoom out"
        aria-label="Zoom out"
      >
        ➖
      </button>
      {showPercentage && (
        <div 
          className="zoom-display" 
          title={`Zoom: ${percentage}%`}
        >
          {percentage}%
        </div>
      )}
      <button 
        className="zoom-btn" 
        onClick={zoomIn} 
        title="Zoom in"
        aria-label="Zoom in"
      >
        ➕
      </button>
      <button 
        className="zoom-reset" 
        onClick={resetZoom} 
        title="Reset zoom"
        aria-label="Reset zoom to 100%"
      >
        ↺
      </button>
    </div>
  );
};

/**
 * ZoomWrapper component that applies zoom transformation
 */
export const ZoomWrapper = ({ 
  children, 
  scale, 
  transformOrigin, 
  onTouchStart, 
  onTouchMove, 
  onTouchEnd,
  className = '',
  ...props 
}) => {
  return (
    <div
      className={`zoom-wrapper ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        transform: `scale(${scale})`,
        transformOrigin,
        transition: 'transform 0.1s ease-out'
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default ZoomControls;