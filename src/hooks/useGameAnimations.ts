/**
 * Optimized Game Animations Hook
 * Enhanced with performance optimizations and better memory management
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { GameData, AnimationStates, ScoreHighlights, UseGameAnimationsReturn, UseScoreAnimationsReturn } from '../types';
import { ANIMATION_DURATIONS } from '../constants';

// Debounce utility for performance optimization
const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Hook for managing field change animations in game tiles
 * Enhanced with performance optimizations and memory management
 */
export const useGameAnimations = (
  game: GameData,
  animationDuration: number = ANIMATION_DURATIONS.SCORE_CHANGE,
): UseGameAnimationsReturn => {
  // Memoize team data extraction to prevent unnecessary recalculations
  const teamData = useMemo(() => {
    const homeTeam = game?.homeTeam || { id: null, name: '', abbreviation: '', score: 0, logo: '' };
    const awayTeam = game?.awayTeam || { id: null, name: '', abbreviation: '', score: 0, logo: '' };

    return {
      homeScore: homeTeam.score ?? 0,
      awayScore: awayTeam.score ?? 0,
      homeTeamName: homeTeam.name || '',
      awayTeamName: awayTeam.name || '',
      status: game?.status?.type,
      venue: game?.venue,
      league: game?.league,
    };
  }, [
    game?.homeTeam?.score,
    game?.awayTeam?.score,
    game?.homeTeam?.name,
    game?.awayTeam?.name,
    game?.status?.type,
    game?.venue,
    game?.league,
  ]);

  // Track previous values for change detection
  const prevValues = useRef(teamData);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Animation states
  const [animations, setAnimations] = useState<AnimationStates>({
    homeScore: false,
    awayScore: false,
    homeTeamName: false,
    awayTeamName: false,
    status: false,
    venue: false,
    league: false,
  });

  // Optimized animation trigger function with debouncing
  const triggerAnimation = useCallback(
    debounce((key: keyof AnimationStates) => {
      setAnimations(prev => ({ ...prev, [key]: true }));

      // Clear existing timer for this key
      const existingTimer = timers.current.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      const timer = setTimeout(() => {
        setAnimations(prev => ({ ...prev, [key]: false }));
        timers.current.delete(key);
      }, animationDuration);

      timers.current.set(key, timer);
    }, 50), // Debounce rapid changes
    [animationDuration],
  );

  // Generic function to handle value changes
  const handleValueChange = useCallback((key: keyof AnimationStates, newValue: any, oldValue: any) => {
    if (oldValue !== newValue && oldValue !== undefined) {
      triggerAnimation(key);
    }
  }, [triggerAnimation]);

  // Effect to detect changes and trigger animations
  useEffect(() => {
    const prev = prevValues.current;

    // Check each field for changes
    Object.entries(teamData).forEach(([key, value]) => {
      const typedKey = key as keyof typeof teamData;
      if (prev[typedKey] !== value && prev[typedKey] !== undefined) {
        handleValueChange(typedKey as keyof AnimationStates, value, prev[typedKey]);
      }
    });

    // Update previous values
    prevValues.current = teamData;
  }, [teamData, handleValueChange]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach(timer => clearTimeout(timer));
      timers.current.clear();
    };
  }, []);

  // Memoized utility functions
  const isAnimating = useCallback((field: keyof AnimationStates) => animations[field] || false, [animations]);

  const hasAnyAnimation = useMemo(() => Object.values(animations).some(Boolean), [animations]);

  const getAnimationClass = useCallback((field: keyof AnimationStates, baseClass = '') => {
    const animationClass = animations[field] ? `${field}-changed` : '';
    return [baseClass, animationClass].filter(Boolean).join(' ');
  }, [animations]);

  return {
    animations,
    isAnimating,
    hasAnyAnimation,
    getAnimationClass,
  };
};

/**
 * Hook for managing score-specific animations with enhanced features
 * Optimized for performance and memory usage
 */
export const useScoreAnimations = (
  game: GameData,
  options: {
    duration?: number;
    highlightDuration?: number;
    enableSound?: boolean;
  } = {},
): UseScoreAnimationsReturn => {
  const {
    duration = ANIMATION_DURATIONS.SCORE_CHANGE,
    highlightDuration = ANIMATION_DURATIONS.HIGHLIGHT,
    enableSound = false,
  } = options;

  const { animations, getAnimationClass, isAnimating, hasAnyAnimation } = useGameAnimations(game, duration);

  const [scoreHighlights, setScoreHighlights] = useState<ScoreHighlights>({
    home: false,
    away: false,
  });

  const highlightTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Memoized highlight trigger function
  const triggerHighlight = useCallback((team: 'home' | 'away') => {
    setScoreHighlights(prev => ({ ...prev, [team]: true }));

    // Clear existing timer
    const existingTimer = highlightTimers.current.get(team);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      setScoreHighlights(prev => ({ ...prev, [team]: false }));
      highlightTimers.current.delete(team);
    }, highlightDuration);

    highlightTimers.current.set(team, timer);

    // Play sound if enabled
    if (enableSound) {
      // Could add sound effect here
      console.log(`Score sound for ${team} team`);
    }
  }, [highlightDuration, enableSound]);

  // Enhanced score change detection with highlights
  useEffect(() => {
    if (animations.homeScore) {
      triggerHighlight('home');
    }
  }, [animations.homeScore, triggerHighlight]);

  useEffect(() => {
    if (animations.awayScore) {
      triggerHighlight('away');
    }
  }, [animations.awayScore, triggerHighlight]);

  // Cleanup highlight timers
  useEffect(() => {
    return () => {
      highlightTimers.current.forEach(timer => clearTimeout(timer));
      highlightTimers.current.clear();
    };
  }, []);

  // Memoized score class function
  const getScoreClass = useCallback((isHome: boolean) => {
    const field = isHome ? 'homeScore' : 'awayScore';
    const highlight = scoreHighlights[isHome ? 'home' : 'away'];
    return getAnimationClass(field, highlight ? 'score-highlight' : '');
  }, [scoreHighlights, getAnimationClass]);

  return {
    animations,
    scoreHighlights,
    getScoreClass,
    isAnimating,
    hasAnyAnimation,
    getAnimationClass,
  };
};

// Performance monitoring hook for animations
export const useAnimationPerformance = () => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    // Log performance warnings in development
    if (window.location.hostname === 'localhost' && timeSinceLastRender > 16) {
      console.warn(`Slow animation render: ${timeSinceLastRender}ms (render #${renderCount.current})`);
    }
  });

  return {
    renderCount: renderCount.current,
    getPerformanceStats: () => ({
      totalRenders: renderCount.current,
      averageRenderTime: renderCount.current > 0 ? (Date.now() - lastRenderTime.current) / renderCount.current : 0,
    }),
  };
};

export default useGameAnimations;
