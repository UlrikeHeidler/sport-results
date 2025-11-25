/**
 * Custom hook for managing UI state
 * Handles modals, toasts, header state, and other UI interactions
 */

import { useState, useEffect, useCallback } from 'react';

export const useUIState = () => {
  // Header expand/collapse state
  const [headerExpanded, setHeaderExpanded] = useState(false);
  
  // Modal states
  const [showSettings, setShowSettings] = useState(false);
  const [showIncrementalMonitor, setShowIncrementalMonitor] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Close header when clicking outside
  useEffect(() => {
    if (!headerExpanded) return;
    
    function handleClick(e) {
      const header = document.querySelector('.header');
      if (header && !header.contains(e.target)) {
        setHeaderExpanded(false);
      }
    }
    
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [headerExpanded]);

  // Add toast notification
  const addToast = useCallback((message, type = 'success', ttl = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const toast = { id, message, type };
    
    setToasts(prev => [toast, ...prev]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, ttl);
  }, []);

  // Remove toast notification
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Close all modals
  const closeAllModals = useCallback(() => {
    setShowSettings(false);
    setShowIncrementalMonitor(false);
    setShowInfo(false);
  }, []);

  return {
    // Header state
    headerExpanded,
    setHeaderExpanded,
    
    // Modal states
    showSettings,
    setShowSettings,
    showIncrementalMonitor,
    setShowIncrementalMonitor,
    showInfo,
    setShowInfo,
    closeAllModals,
    
    // Toast notifications
    toasts,
    addToast,
    removeToast
  };
};