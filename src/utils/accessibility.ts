/**
 * Accessibility Utilities
 * ARIA helpers, keyboard navigation, and screen reader support
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// ARIA live region manager
class AriaLiveRegionManager {
  private static instance: AriaLiveRegionManager;
  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;

  static getInstance(): AriaLiveRegionManager {
    if (!AriaLiveRegionManager.instance) {
      AriaLiveRegionManager.instance = new AriaLiveRegionManager();
    }
    return AriaLiveRegionManager.instance;
  }

  initialize(): void {
    if (typeof document === 'undefined') return;

    // Create polite live region
    if (!this.politeRegion) {
      this.politeRegion = document.createElement('div');
      this.politeRegion.setAttribute('aria-live', 'polite');
      this.politeRegion.setAttribute('aria-atomic', 'true');
      this.politeRegion.className = 'sr-only';
      this.politeRegion.id = 'aria-live-polite';
      document.body.appendChild(this.politeRegion);
    }

    // Create assertive live region
    if (!this.assertiveRegion) {
      this.assertiveRegion = document.createElement('div');
      this.assertiveRegion.setAttribute('aria-live', 'assertive');
      this.assertiveRegion.setAttribute('aria-atomic', 'true');
      this.assertiveRegion.className = 'sr-only';
      this.assertiveRegion.id = 'aria-live-assertive';
      document.body.appendChild(this.assertiveRegion);
    }
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;
    if (region) {
      region.textContent = message;
      // Clear after announcement to allow repeated messages
      setTimeout(() => {
        if (region) region.textContent = '';
      }, 1000);
    }
  }

  cleanup(): void {
    if (this.politeRegion) {
      document.body.removeChild(this.politeRegion);
      this.politeRegion = null;
    }
    if (this.assertiveRegion) {
      document.body.removeChild(this.assertiveRegion);
      this.assertiveRegion = null;
    }
  }
}

// Global instance
export const ariaLiveManager = AriaLiveRegionManager.getInstance();

/**
 * Hook for managing ARIA live announcements
 */
export const useAriaLive = () => {
  useEffect(() => {
    ariaLiveManager.initialize();
    return () => {
      // Don't cleanup on unmount as other components might be using it
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    ariaLiveManager.announce(message, priority);
  }, []);

  return { announce };
};

/**
 * Hook for keyboard navigation
 */
export const useKeyboardNavigation = (
  onKeyDown?: (event: KeyboardEvent) => void,
  dependencies: any[] = [],
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle common accessibility shortcuts
      if (event.key === 'Escape') {
        // Close modals, dropdowns, etc.
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.blur) {
          activeElement.blur();
        }
      }

      // Skip to main content
      if (event.key === 'Tab' && !event.shiftKey && event.target === document.body) {
        const mainContent = document.querySelector('main, [role="main"]') as HTMLElement;
        if (mainContent) {
          event.preventDefault();
          mainContent.focus();
        }
      }

      // Custom handler
      if (onKeyDown) {
        onKeyDown(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, dependencies);
};

/**
 * Hook for focus management
 */
export const useFocusManagement = () => {
  const focusRef = useRef<HTMLElement | null>(null);

  const setFocus = useCallback((element: HTMLElement | null) => {
    if (element) {
      focusRef.current = element;
      // Use setTimeout to ensure element is rendered
      setTimeout(() => {
        element.focus();
      }, 0);
    }
  }, []);

  const restoreFocus = useCallback(() => {
    if (focusRef.current) {
      focusRef.current.focus();
      focusRef.current = null;
    }
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  }, []);

  return { setFocus, restoreFocus, trapFocus };
};

/**
 * Hook for skip links
 */
export const useSkipLinks = () => {
  useEffect(() => {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 9999;
      border-radius: 4px;
    `;

    const showSkipLink = () => {
      skipLink.style.top = '6px';
    };

    const hideSkipLink = () => {
      skipLink.style.top = '-40px';
    };

    skipLink.addEventListener('focus', showSkipLink);
    skipLink.addEventListener('blur', hideSkipLink);

    document.body.insertBefore(skipLink, document.body.firstChild);

    return () => {
      if (document.body.contains(skipLink)) {
        document.body.removeChild(skipLink);
      }
    };
  }, []);
};

/**
 * Generate accessible IDs
 */
export const generateAccessibleId = (prefix: string = 'a11y'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * ARIA attribute helpers
 */
export const ariaHelpers = {
  // Expanded state for collapsible elements
  expanded: (isExpanded: boolean) => ({
    'aria-expanded': isExpanded.toString(),
  }),

  // Selected state for selectable elements
  selected: (isSelected: boolean) => ({
    'aria-selected': isSelected.toString(),
  }),

  // Checked state for checkboxes/radio buttons
  checked: (isChecked: boolean) => ({
    'aria-checked': isChecked.toString(),
  }),

  // Disabled state
  disabled: (isDisabled: boolean) => ({
    'aria-disabled': isDisabled.toString(),
    ...(isDisabled && { tabIndex: -1 }),
  }),

  // Hidden state
  hidden: (isHidden: boolean) => ({
    'aria-hidden': isHidden.toString(),
    ...(isHidden && { tabIndex: -1 }),
  }),

  // Loading state
  loading: (isLoading: boolean) => ({
    'aria-busy': isLoading.toString(),
    ...(isLoading && { 'aria-live': 'polite' }),
  }),

  // Error state
  invalid: (hasError: boolean, errorId?: string) => ({
    'aria-invalid': hasError.toString(),
    ...(hasError && errorId && { 'aria-describedby': errorId }),
  }),

  // Required field
  required: (isRequired: boolean) => ({
    'aria-required': isRequired.toString(),
  }),

  // Labelled by
  labelledBy: (labelId: string) => ({
    'aria-labelledby': labelId,
  }),

  // Described by
  describedBy: (descriptionId: string) => ({
    'aria-describedby': descriptionId,
  }),

  // Controls relationship
  controls: (controlsId: string) => ({
    'aria-controls': controlsId,
  }),

  // Owns relationship
  owns: (ownsId: string) => ({
    'aria-owns': ownsId,
  }),
};

/**
 * Screen reader utilities
 */
export const screenReaderUtils = {
  // Announce score changes
  announceScoreChange: (homeTeam: string, awayTeam: string, homeScore: number, awayScore: number) => {
    const message = `Score update: ${homeTeam} ${homeScore}, ${awayTeam} ${awayScore}`;
    ariaLiveManager.announce(message, 'polite');
  },

  // Announce game status changes
  announceStatusChange: (homeTeam: string, awayTeam: string, status: string) => {
    const message = `Game status update: ${homeTeam} vs ${awayTeam} is now ${status}`;
    ariaLiveManager.announce(message, 'polite');
  },

  // Announce data refresh
  announceDataRefresh: () => {
    ariaLiveManager.announce('Game data has been refreshed', 'polite');
  },

  // Announce error
  announceError: (error: string) => {
    ariaLiveManager.announce(`Error: ${error}`, 'assertive');
  },

  // Announce success
  announceSuccess: (message: string) => {
    ariaLiveManager.announce(message, 'polite');
  },
};

/**
 * Color contrast utilities
 */
export const colorContrastUtils = {
  // Calculate relative luminance
  getLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // Calculate contrast ratio
  getContrastRatio: (color1: [number, number, number], color2: [number, number, number]): number => {
    const lum1 = colorContrastUtils.getLuminance(...color1);
    const lum2 = colorContrastUtils.getLuminance(...color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Check if contrast meets WCAG standards
  meetsWCAG: (color1: [number, number, number], color2: [number, number, number], level: 'AA' | 'AAA' = 'AA'): boolean => {
    const ratio = colorContrastUtils.getContrastRatio(color1, color2);
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
  },
};

/**
 * Reduced motion utilities
 */
export const reducedMotionUtils = {
  // Check if user prefers reduced motion
  prefersReducedMotion: (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Get animation duration based on user preference
  getAnimationDuration: (normalDuration: number): number => {
    return reducedMotionUtils.prefersReducedMotion() ? 0 : normalDuration;
  },

  // Hook for reduced motion
  useReducedMotion: () => {
    const [prefersReduced, setPrefersReduced] = useState(false);

    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReduced(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReduced(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return prefersReduced;
  },
};

// Export all utilities
export default {
  ariaLiveManager,
  useAriaLive,
  useKeyboardNavigation,
  useFocusManagement,
  useSkipLinks,
  generateAccessibleId,
  ariaHelpers,
  screenReaderUtils,
  colorContrastUtils,
  reducedMotionUtils,
};
