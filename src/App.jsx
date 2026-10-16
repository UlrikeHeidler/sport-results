import React, { useState, useEffect, useCallback } from 'react';

const LiveClock = () => {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="live-clock">{time.toLocaleTimeString()}</span>;
};
import { useRef } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import ActiveGameLayout from './components/layout/ActiveGameLayout';
import LeagueSelector from './components/LeagueSelector';
import Settings from './components/Settings';
import IncrementalUpdatesMonitor from './components/IncrementalUpdatesMonitor';
import Toast from './components/Toast';
import InfoModal from './components/InfoModal';
import { useIncrementalUpdates } from './hooks/useIncrementalUpdates';
import { useSettings } from './hooks/useSettings';
import { useUIState } from './hooks/useUIState';
import { useGameFiltering } from './hooks/useGameFiltering';
import { useDetailMode } from './hooks/useDetailMode';
import { fetchAllGames } from './services/sportsApi';
import { extractTeams } from './services/gameUtils';
import { AVAILABLE_LEAGUES } from './config/constants';

function App() {
  // Custom hooks for state management
  const { settings, handleSettingsChange, handleLeagueToggle, handleClearSettings } = useSettings();
  const {
    headerExpanded,
    setHeaderExpanded,
    showSettings,
    setShowSettings,
    showIncrementalMonitor,
    setShowIncrementalMonitor,
    showInfo,
    setShowInfo,
    toasts,
    addToast,
    removeToast
  } = useUIState();

  // Game data state
  const [availableTeams, setAvailableTeams] = useState([]);
  const [useIncrementalMode, setUseIncrementalMode] = useState(true);

  // Pinned games — session-only, keyed by `${league}-${id}`
  const [pinnedIds, setPinnedIds] = useState(() => new Set());
  const togglePin = useCallback((gameKey) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(gameKey)) next.delete(gameKey);
      else next.add(gameKey);
      return next;
    });
  }, []);

  // Detail mode
  const { activeDetailKeys, toggleDetailMode, isInDetailMode } = useDetailMode();


  // Incremental updates hook
  const {
    games: incrementalGames,
    loading: incrementalLoading,
    error: incrementalError,
    lastUpdated: incrementalLastUpdated,
    forceRefresh: incrementalForceRefresh,
    updateStats,
    recentChanges,
    changeSummary,
    liveGamesCount,
    updateFrequency
  } = useIncrementalUpdates(settings.selectedLeagues, settings.refreshInterval, useIncrementalMode);

  // Zoom state (scale factor). Persist in localStorage so user's zoom survives reloads
  const ZOOM_KEY = 'sportsAppZoom';
  const [scale, setScale] = useState(() => {
    try {
      const v = localStorage.getItem(ZOOM_KEY);
      return v ? Number(v) : 1;
    } catch (e) {
      return 1;
    }
  });
  const wrapperRef = useRef(null);
  const [transformOrigin, setTransformOrigin] = useState('top center');
  // For pinch handling
  const pinchRef = useRef({ active: false, startDist: 0, startScale: 1 });

  useEffect(() => {
    try { localStorage.setItem(ZOOM_KEY, String(scale)); } catch (e) { /* ignore */ }
    try { document.documentElement.style.setProperty('--app-scale', String(scale)); } catch (e) { /* ignore */ }
  }, [scale]);

  // Touch handlers for pinch-to-zoom
  const onTouchStart = useCallback((e) => {
    if (e.touches && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { active: true, startDist: Math.hypot(dx, dy), startScale: scale };
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
      if (e.key === '+' || e.key === '=' ) { // '=' also for '+' without shift in some keyboards
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

  // Fallback to traditional loading
  const [games, setGames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  // Records fetched via detail pane, keyed by gameKey, used to enrich main-tile display
  const [recordsOverlay, setRecordsOverlay] = useState({});

  const handleRecordsUpdate = useCallback((gameKey, homeRecord, awayRecord) => {
    setRecordsOverlay(prev => ({ ...prev, [gameKey]: { homeRecord, awayRecord } }));
  }, []);

  // Bulk-replace the selected leagues array (used by LeagueSelector sport-group toggle)
  const handleSelectLeagues = useCallback((newLeagues) => {
    handleSettingsChange({ ...settings, selectedLeagues: newLeagues });
  }, [settings, handleSettingsChange]);

  // Traditional fetch games data (fallback)
  const loadGames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const gamesData = await fetchAllGames(settings.selectedLeagues);
      setGames(gamesData);
      setLastUpdated(new Date());
      
      // Extract teams for settings
      const teams = extractTeams(gamesData);
      setAvailableTeams(teams);
    } catch (err) {
      setError('Failed to load games. Please try again later.');
      console.error('Error loading games:', err);
    } finally {
      setLoading(false);
    }
  }, [settings.selectedLeagues]);

  // Use incremental or traditional mode
  const currentGames = useIncrementalMode ? incrementalGames : games;
  const currentLoading = useIncrementalMode ? incrementalLoading : loading;
  const currentError = useIncrementalMode ? incrementalError : error;
  const currentLastUpdated = useIncrementalMode ? incrementalLastUpdated : lastUpdated;

  // Game filtering and sorting
  const { filteredGames } = useGameFiltering({
    games: currentGames,
    selectedLeagues: settings.selectedLeagues,
    hiddenTeams: settings.hiddenTeams,
    pinnedIds,
    showYesterdayResults: settings.showYesterdayResults
  });

  // Extract teams when games change
  useEffect(() => {
    if (Object.keys(currentGames).length > 0) {
      const teams = extractTeams(currentGames);
      setAvailableTeams(teams);
    }
  }, [currentGames]);

  // Initial load for traditional mode
  useEffect(() => {
    if (!useIncrementalMode) {
      loadGames();
    }
  }, [loadGames, useIncrementalMode]);

  // Auto-refresh for traditional mode
  useEffect(() => {
    if (!useIncrementalMode) {
      const interval = setInterval(() => {
        loadGames();
      }, settings.refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [loadGames, settings.refreshInterval, useIncrementalMode]);

  // Toggle between incremental and traditional mode
  const toggleUpdateMode = useCallback(() => {
    setUseIncrementalMode(prev => !prev);
  }, []);

  // Handle force refresh
  const handleForceRefresh = useCallback(() => {
    if (useIncrementalMode) {
      incrementalForceRefresh();
    } else {
      loadGames();
    }
  }, [useIncrementalMode, incrementalForceRefresh, loadGames]);

  // Enhanced settings change handler with toast notification
  const handleSettingsChangeWithToast = useCallback((newSettings) => {
    handleSettingsChange(newSettings);
    try { 
      addToast('Settings saved'); 
    } catch (e) { 
      /* ignore */ 
    }
  }, [handleSettingsChange, addToast]);

  // Enhanced clear settings handler with toast notification
  const handleClearSettingsWithToast = useCallback(() => {
    handleClearSettings();
    addToast('Cleared saved settings');
  }, [handleClearSettings, addToast]);

  return (
    <ErrorBoundary
      message="The sports results application encountered an unexpected error. Please refresh the page to try again."
      onError={(error, errorInfo) => {
        console.error('App-level error:', error, errorInfo);
        // Could send to error reporting service here
      }}
    >
      <div
        className="App"
        ref={wrapperRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
      <header className={`header${headerExpanded ? ' expanded' : ''}`}> 
        {!headerExpanded && (
          <div className="header-content-minimized">
            <div className="header-minimized"></div>
            <div className="header-clock-center"><LiveClock /></div>
            <div className="header-menu-icon" onClick={() => setHeaderExpanded(true)}>
              <span>🏆</span>
            </div>
            <div className="minimized-controls" onClick={(e) => e.stopPropagation()}>
              <label
                className="yesterday-toggle"
                title={settings.showYesterdayResults ? "Hide yesterday's results" : "Show yesterday's results"}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={settings.showYesterdayResults}
                  onChange={() => handleSettingsChange({ ...settings, showYesterdayResults: !settings.showYesterdayResults })}
                />
                <span className="yesterday-toggle-track">
                  <span className="yesterday-toggle-thumb" />
                </span>
                <span className="yesterday-toggle-label">Show yesterday's results?</span>
              </label>
              <button className="min-info-btn" onClick={(e) => { e.stopPropagation(); setShowInfo(true); }} title="About & License">ℹ️</button>
              <button className="min-zoom-btn" onClick={(e) => { e.stopPropagation(); zoomOut(); }} title="Zoom out">➖</button>
              <div className="min-zoom-display" title={`Zoom: ${Math.round(scale * 100)}%`}>{Math.round(scale * 100)}%</div>
              <button className="min-zoom-btn" onClick={(e) => { e.stopPropagation(); zoomIn(); }} title="Zoom in">➕</button>
            </div>
          </div>
          
        )}
        {headerExpanded && (
          <div className="header-expanded">
            <button className="header-close-button" onClick={() => setHeaderExpanded(false)} title="Close header">✕</button>
            <div className="container">
              <div className="header-content">
                <div className="header-text">
                  <h1>🏆 Live Sports Results</h1>
                  <p>Real-time scores for Major American Sports and Soccer, including Bundesliga and FIFA World Cup.</p>
                  {currentLastUpdated && (
                    <div className="last-updated">
                      Last updated: {currentLastUpdated.toLocaleTimeString()}
                      {useIncrementalMode ? (
                        <span className="refresh-interval">
                          ({updateFrequency})
                        </span>
                      ) : (
                        settings.refreshInterval && (
                          <span className="refresh-interval">
                            (Updates every {settings.refreshInterval}s)
                          </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="header-controls">
                  <LeagueSelector
                    selectedLeagues={settings.selectedLeagues}
                    onLeagueToggle={handleLeagueToggle}
                    onSelectLeagues={handleSelectLeagues}
                    availableLeagues={AVAILABLE_LEAGUES}
                  />
                </div>
                <div className="header-buttons">
                  <button
                    className="update-mode-button"
                    onClick={toggleUpdateMode}
                    title={`Switch to ${useIncrementalMode ? 'Traditional' : 'Incremental'} Updates`}
                  >
                    {useIncrementalMode ? '🔄' : '⏱️'}
                  </button>
                  {/* Zoom controls and percentage display */}
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.4rem'}}>
                    <button className="zoom-btn" onClick={zoomOut} title="Zoom out">➖</button>
                    <div className="zoom-display" title={`Zoom: ${Math.round(scale * 100)}%`}>{Math.round(scale * 100)}%</div>
                    <button className="zoom-btn" onClick={zoomIn} title="Zoom in">➕</button>
                    <button className="zoom-reset" onClick={resetZoom} title="Reset zoom">↺</button>
                  </div>
                  <button
                    className="monitor-button"
                    onClick={() => setShowIncrementalMonitor(true)}
                    title="Incremental Updates Monitor"
                  >
                    📊
                  </button>
                  <button
                    className="info-button"
                    onClick={() => setShowInfo(true)}
                    title="About & License"
                  >
                    ℹ️
                  </button>
                  <button
                    className="settings-button"
                    onClick={() => setShowSettings(true)}
                    title="Settings"
                  >
                    ⚙️
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <ActiveGameLayout
        filteredGames={filteredGames}
        settings={settings}
        loading={currentLoading}
        error={currentError}
        useIncrementalMode={useIncrementalMode}
        updateFrequency={updateFrequency}
        liveGamesCount={liveGamesCount}
        onForceRefresh={handleForceRefresh}
        recordsOverlay={recordsOverlay}
        pinnedIds={pinnedIds}
        activeDetailKeys={activeDetailKeys}
        togglePin={togglePin}
        isInDetailMode={isInDetailMode}
        toggleDetailMode={toggleDetailMode}
        onRecordsUpdate={handleRecordsUpdate}
      />

      <Settings
        settings={settings}
        onSettingsChange={handleSettingsChangeWithToast}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        availableTeams={availableTeams}
        onClearStorage={handleClearSettingsWithToast}
      />

      <InfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
      />
      
      <Toast toasts={toasts} onRemove={removeToast} />

      <IncrementalUpdatesMonitor
        isVisible={showIncrementalMonitor}
        onClose={() => setShowIncrementalMonitor(false)}
        changeSummary={changeSummary}
        updateStats={updateStats}
        updateFrequency={updateFrequency}
        liveGamesCount={liveGamesCount}
        recentChanges={recentChanges}
      />
      </div>
    </ErrorBoundary>
  );
}

export default App;