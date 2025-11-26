/**
 * AppHeader Component
 * Extracted from App.jsx to handle header functionality
 */

import React from 'react';
import LeagueSelector from '../LeagueSelector';
import { ZoomControls } from './ZoomControls';
import { AVAILABLE_LEAGUES } from '../../config/constants';
import './AppHeader.css';

/**
 * Minimized header component
 */
export const MinimizedHeader = ({ 
  onExpand, 
  onShowInfo, 
  scale, 
  zoomIn, 
  zoomOut 
}) => (
  <div className="header-content-minimized">
    <div className="header-minimized"></div>
    <div className="header-menu-icon" onClick={onExpand}>
      <span>🏆</span>
    </div>
    <div className="minimized-controls" onClick={(e) => e.stopPropagation()}>
      <button 
        className="min-info-btn" 
        onClick={(e) => { 
          e.stopPropagation(); 
          onShowInfo(); 
        }} 
        title="About & License"
        aria-label="Show information"
      >
        ℹ️
      </button>
      <ZoomControls
        scale={scale}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        variant="minimal"
        className="minimized-zoom"
      />
    </div>
  </div>
);

/**
 * Expanded header component
 */
export const ExpandedHeader = ({
  onClose,
  currentLastUpdated,
  useIncrementalMode,
  updateFrequency,
  settings,
  onLeagueToggle,
  toggleUpdateMode,
  scale,
  zoomIn,
  zoomOut,
  resetZoom,
  onShowIncrementalMonitor,
  onShowInfo,
  onShowSettings
}) => (
  <div className="header-expanded">
    <button 
      className="header-close-button" 
      onClick={onClose} 
      title="Close header"
      aria-label="Close header"
    >
      ✕
    </button>
    <div className="container">
      <div className="header-content">
        <div className="header-text">
          <h1>🏆 Live Sports Results</h1>
          <p>Real-time scores for Major American Sports and German Soccer.</p>
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
                )
              )}
            </div>
          )}
        </div>
        <div className="header-controls">
          <LeagueSelector
            selectedLeagues={settings.selectedLeagues}
            onLeagueToggle={onLeagueToggle}
            availableLeagues={AVAILABLE_LEAGUES}
          />
        </div>
        <div className="header-buttons">
          <button
            className="update-mode-button"
            onClick={toggleUpdateMode}
            title={`Switch to ${useIncrementalMode ? 'Traditional' : 'Incremental'} Updates`}
            aria-label={`Switch to ${useIncrementalMode ? 'Traditional' : 'Incremental'} Updates`}
          >
            {useIncrementalMode ? '🔄' : '⏱️'}
          </button>
          
          <ZoomControls
            scale={scale}
            zoomIn={zoomIn}
            zoomOut={zoomOut}
            resetZoom={resetZoom}
            className="header-zoom"
          />
          
          <button
            className="monitor-button"
            onClick={onShowIncrementalMonitor}
            title="Incremental Updates Monitor"
            aria-label="Show incremental updates monitor"
          >
            📊
          </button>
          <button
            className="info-button"
            onClick={onShowInfo}
            title="About & License"
            aria-label="Show information"
          >
            ℹ️
          </button>
          <button
            className="settings-button"
            onClick={onShowSettings}
            title="Settings"
            aria-label="Show settings"
          >
            ⚙️
          </button>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Main AppHeader component
 */
export const AppHeader = ({
  headerExpanded,
  setHeaderExpanded,
  currentLastUpdated,
  useIncrementalMode,
  updateFrequency,
  settings,
  onLeagueToggle,
  toggleUpdateMode,
  scale,
  zoomIn,
  zoomOut,
  resetZoom,
  onShowIncrementalMonitor,
  onShowInfo,
  onShowSettings
}) => {
  return (
    <header className={`header${headerExpanded ? ' expanded' : ''}`}>
      {!headerExpanded ? (
        <MinimizedHeader
          onExpand={() => setHeaderExpanded(true)}
          onShowInfo={onShowInfo}
          scale={scale}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
        />
      ) : (
        <ExpandedHeader
          onClose={() => setHeaderExpanded(false)}
          currentLastUpdated={currentLastUpdated}
          useIncrementalMode={useIncrementalMode}
          updateFrequency={updateFrequency}
          settings={settings}
          onLeagueToggle={onLeagueToggle}
          toggleUpdateMode={toggleUpdateMode}
          scale={scale}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          resetZoom={resetZoom}
          onShowIncrementalMonitor={onShowIncrementalMonitor}
          onShowInfo={onShowInfo}
          onShowSettings={onShowSettings}
        />
      )}
    </header>
  );
};

export default AppHeader;