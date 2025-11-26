/**
 * Custom hook for managing game data animations
 * Consolidates animation logic previously duplicated across GameTile and BaseGameTile
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Hook for managing field change animations in game tiles
 * @param {Object} game - Game object to track changes for
 * @param {number} animationDuration - Duration of animations in milliseconds (default: 15000)
 * @returns {Object} Animation states and utilities
 */
export const useGameAnimations = (game, animationDuration = 15000) => {
  // Safe accessors for team data (supports both legacy and new formats)
  const homeTeam = game?.homeTeam || game?.teams?.home || { id: null, name: '', abbreviation: '', score: 0, logo: '' };
  const awayTeam = game?.awayTeam || game?.teams?.away || { id: null, name: '', abbreviation: '', score: 0, logo: '' };

  // Track previous values for change detection
  const prevValues = useRef({
    homeScore: homeTeam.score,
    awayScore: awayTeam.score,
    homeTeamName: homeTeam.name,
    awayTeamName: awayTeam.name,
    status: game?.status?.type,
    venue: game?.venue,
    league: game?.league
  });

  // Animation states
  const [animations, setAnimations] = useState({
    homeScore: false,
    awayScore: false,
    homeTeamName: false,
    awayTeamName: false,
    status: false,
    venue: false,
    league: false
  });

  // Generic function to handle value changes and trigger animations
  const handleValueChange = (key, newValue, oldValue) => {
    if (oldValue !== newValue && oldValue !== undefined) {
      setAnimations(prev => ({ ...prev, [key]: true }));
      const timer = setTimeout(() => {
        setAnimations(prev => ({ ...prev, [key]: false }));
      }, animationDuration);
      return () => clearTimeout(timer);
    }
  };

  // Track home team score changes
  useEffect(() => {
    const newHomeScore = homeTeam?.score ?? 0;
    const cleanup = handleValueChange('homeScore', newHomeScore, prevValues.current.homeScore);
    prevValues.current.homeScore = newHomeScore;
    return cleanup;
  }, [homeTeam?.score, animationDuration]);

  // Track away team score changes
  useEffect(() => {
    const newAwayScore = awayTeam?.score ?? 0;
    const cleanup = handleValueChange('awayScore', newAwayScore, prevValues.current.awayScore);
    prevValues.current.awayScore = newAwayScore;
    return cleanup;
  }, [awayTeam?.score, animationDuration]);

  // Track home team name changes
  useEffect(() => {
    const newHomeTeamName = homeTeam?.name || '';
    const cleanup = handleValueChange('homeTeamName', newHomeTeamName, prevValues.current.homeTeamName);
    prevValues.current.homeTeamName = newHomeTeamName;
    return cleanup;
  }, [homeTeam?.name, animationDuration]);

  // Track away team name changes
  useEffect(() => {
    const newAwayTeamName = awayTeam?.name || '';
    const cleanup = handleValueChange('awayTeamName', newAwayTeamName, prevValues.current.awayTeamName);
    prevValues.current.awayTeamName = newAwayTeamName;
    return cleanup;
  }, [awayTeam?.name, animationDuration]);

  // Track status changes
  useEffect(() => {
    const newStatus = game?.status?.type;
    const cleanup = handleValueChange('status', newStatus, prevValues.current.status);
    prevValues.current.status = newStatus;
    return cleanup;
  }, [game?.status?.type, animationDuration]);

  // Track venue changes
  useEffect(() => {
    const newVenue = game?.venue;
    const cleanup = handleValueChange('venue', newVenue, prevValues.current.venue);
    prevValues.current.venue = newVenue;
    return cleanup;
  }, [game?.venue, animationDuration]);

  // Track league changes
  useEffect(() => {
    const newLeague = game?.league;
    const cleanup = handleValueChange('league', newLeague, prevValues.current.league);
    prevValues.current.league = newLeague;
    return cleanup;
  }, [game?.league, animationDuration]);

  return {
    animations,
    // Utility functions for checking specific animation states
    isAnimating: (field) => animations[field] || false,
    hasAnyAnimation: Object.values(animations).some(Boolean),
    // Helper to get animation class name
    getAnimationClass: (field, baseClass = '') => {
      const animationClass = animations[field] ? `${field}-changed` : '';
      return [baseClass, animationClass].filter(Boolean).join(' ');
    }
  };
};

/**
 * Hook for managing score-specific animations with enhanced features
 * @param {Object} game - Game object
 * @param {Object} options - Configuration options
 * @returns {Object} Score animation utilities
 */
export const useScoreAnimations = (game, options = {}) => {
  const {
    duration = 15000,
    highlightDuration = 2000,
    enableSound = false
  } = options;

  const { animations, getAnimationClass } = useGameAnimations(game, duration);
  const [scoreHighlights, setScoreHighlights] = useState({
    home: false,
    away: false
  });

  // Enhanced score change detection with highlights
  useEffect(() => {
    if (animations.homeScore) {
      setScoreHighlights(prev => ({ ...prev, home: true }));
      const timer = setTimeout(() => {
        setScoreHighlights(prev => ({ ...prev, home: false }));
      }, highlightDuration);
      return () => clearTimeout(timer);
    }
  }, [animations.homeScore, highlightDuration]);

  useEffect(() => {
    if (animations.awayScore) {
      setScoreHighlights(prev => ({ ...prev, away: true }));
      const timer = setTimeout(() => {
        setScoreHighlights(prev => ({ ...prev, away: false }));
      }, highlightDuration);
      return () => clearTimeout(timer);
    }
  }, [animations.awayScore, highlightDuration]);

  return {
    animations,
    scoreHighlights,
    getScoreClass: (isHome) => {
      const field = isHome ? 'homeScore' : 'awayScore';
      const highlight = scoreHighlights[isHome ? 'home' : 'away'];
      return getAnimationClass(field, highlight ? 'score-highlight' : '');
    }
  };
};

export default useGameAnimations;