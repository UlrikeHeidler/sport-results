/**
 * Enhanced UI State Management Utilities
 * Provides advanced state management patterns for complex UI interactions
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Enhanced modal state management hook
 */
export const useModalManager = (initialModals = {}) => {
  const [modals, setModals] = useState(initialModals);
  const [modalHistory, setModalHistory] = useState([]);

  const openModal = useCallback((modalName, data = null) => {
    setModals(prev => ({ ...prev, [modalName]: { isOpen: true, data } }));
    setModalHistory(prev => [...prev, modalName]);
  }, []);

  const closeModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: { isOpen: false, data: null } }));
    setModalHistory(prev => prev.filter(name => name !== modalName));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals(prev => 
      Object.fromEntries(
        Object.keys(prev).map(key => [key, { isOpen: false, data: null }])
      )
    );
    setModalHistory([]);
  }, []);

  const toggleModal = useCallback((modalName, data = null) => {
    setModals(prev => {
      const isCurrentlyOpen = prev[modalName]?.isOpen;
      if (isCurrentlyOpen) {
        setModalHistory(prevHistory => prevHistory.filter(name => name !== modalName));
        return { ...prev, [modalName]: { isOpen: false, data: null } };
      } else {
        setModalHistory(prevHistory => [...prevHistory, modalName]);
        return { ...prev, [modalName]: { isOpen: true, data } };
      }
    });
  }, []);

  const isModalOpen = useCallback((modalName) => {
    return modals[modalName]?.isOpen || false;
  }, [modals]);

  const getModalData = useCallback((modalName) => {
    return modals[modalName]?.data || null;
  }, [modals]);

  const getOpenModals = useCallback(() => {
    return Object.entries(modals)
      .filter(([, modal]) => modal.isOpen)
      .map(([name]) => name);
  }, [modals]);

  // Close modals on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && modalHistory.length > 0) {
        const lastModal = modalHistory[modalHistory.length - 1];
        closeModal(lastModal);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [modalHistory, closeModal]);

  return {
    modals,
    openModal,
    closeModal,
    closeAllModals,
    toggleModal,
    isModalOpen,
    getModalData,
    getOpenModals,
    modalHistory
  };
};

/**
 * Advanced toast notification system
 */
export const useToastManager = (options = {}) => {
  const {
    maxToasts = 5,
    defaultDuration = 4000,
    position = 'top-right'
  } = options;

  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((message, type = 'info', duration = defaultDuration, actions = []) => {
    const id = ++toastIdRef.current;
    const toast = {
      id,
      message,
      type,
      duration,
      actions,
      timestamp: Date.now()
    };

    setToasts(prev => {
      const newToasts = [toast, ...prev];
      return newToasts.slice(0, maxToasts);
    });

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [defaultDuration, maxToasts]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const updateToast = useCallback((id, updates) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, ...updates } : toast
    ));
  }, []);

  // Convenience methods for different toast types
  const success = useCallback((message, duration, actions) => 
    addToast(message, 'success', duration, actions), [addToast]);
  
  const error = useCallback((message, duration, actions) => 
    addToast(message, 'error', duration, actions), [addToast]);
  
  const warning = useCallback((message, duration, actions) => 
    addToast(message, 'warning', duration, actions), [addToast]);
  
  const info = useCallback((message, duration, actions) => 
    addToast(message, 'info', duration, actions), [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    updateToast,
    success,
    error,
    warning,
    info,
    position
  };
};

/**
 * Loading state manager for multiple operations
 */
export const useLoadingManager = () => {
  const [loadingStates, setLoadingStates] = useState({});

  const setLoading = useCallback((key, isLoading, message = '') => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading ? { loading: true, message } : { loading: false, message: '' }
    }));
  }, []);

  const isLoading = useCallback((key) => {
    return loadingStates[key]?.loading || false;
  }, [loadingStates]);

  const getLoadingMessage = useCallback((key) => {
    return loadingStates[key]?.message || '';
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(state => state.loading);
  }, [loadingStates]);

  const getLoadingKeys = useCallback(() => {
    return Object.entries(loadingStates)
      .filter(([, state]) => state.loading)
      .map(([key]) => key);
  }, [loadingStates]);

  const clearLoading = useCallback((key) => {
    setLoadingStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  return {
    setLoading,
    isLoading,
    getLoadingMessage,
    isAnyLoading,
    getLoadingKeys,
    clearLoading,
    clearAllLoading,
    loadingStates
  };
};

/**
 * Form state manager with validation
 */
export const useFormManager = (initialValues = {}, validators = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const setFieldTouched = useCallback((field, isTouched = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }));
  }, []);

  const validateField = useCallback((field, value = values[field]) => {
    const validator = validators[field];
    if (!validator) return '';

    try {
      const result = validator(value);
      return result === true ? '' : result;
    } catch (error) {
      return `Validation error: ${error.message}`;
    }
  }, [validators, values]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validators).forEach(field => {
      const error = validateField(field);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validators, validateField]);

  const handleSubmit = useCallback(async (onSubmit) => {
    setIsSubmitting(true);
    
    // Mark all fields as touched
    const allTouched = Object.keys(validators).reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    const isValid = validateForm();
    
    if (isValid) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
    
    setIsSubmitting(false);
    return isValid;
  }, [values, validators, validateForm]);

  const reset = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const getFieldProps = useCallback((field) => ({
    value: values[field] || '',
    onChange: (e) => setValue(field, e.target.value),
    onBlur: () => {
      setFieldTouched(field);
      const error = validateField(field);
      if (error) {
        setErrors(prev => ({ ...prev, [field]: error }));
      }
    },
    error: touched[field] ? errors[field] : '',
    hasError: touched[field] && !!errors[field]
  }), [values, errors, touched, setValue, setFieldTouched, validateField]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setFieldTouched,
    validateField,
    validateForm,
    handleSubmit,
    reset,
    getFieldProps,
    isValid: Object.keys(errors).length === 0,
    isDirty: JSON.stringify(values) !== JSON.stringify(initialValues)
  };
};

/**
 * Pagination state manager
 */
export const usePagination = (totalItems, itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const goToPage = useCallback((page) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const getPageItems = useCallback((items) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [currentPage, itemsPerPage]);

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    goToPage,
    nextPage,
    prevPage,
    getPageItems,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    startIndex: (currentPage - 1) * itemsPerPage,
    endIndex: Math.min(currentPage * itemsPerPage, totalItems)
  };
};

export default {
  useModalManager,
  useToastManager,
  useLoadingManager,
  useFormManager,
  usePagination
};