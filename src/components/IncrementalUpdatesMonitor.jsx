// Incremental Updates Monitor Component
// Provides real-time visualization of the incremental updates system

import React, { useState } from 'react';
import { useIncrementalUpdatesMonitor, useIncrementalUpdatesDebug } from '../hooks/useIncrementalUpdates';

const IncrementalUpdatesMonitor = ({ 
  isVisible = false, 
  onClose, 
  changeSummary = {}, 
  updateStats = {},
  updateFrequency = '',
  liveGamesCount = 0,
  recentChanges = []
}) => {
  const { stats, isMonitoring, startMonitoring, stopMonitoring } = useIncrementalUpdatesMonitor();
  const { debugInfo, enableDebug, disableDebug } = useIncrementalUpdatesDebug();
  const [activeTab, setActiveTab] = useState('overview');

  if (!isVisible) return null;

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getChangeTypeIcon = (type) => {
    switch (type) {
      case 'NEW_GAME': return '🆕';
      case 'GAME_UPDATED': return '🔄';
      case 'GAME_REMOVED': return '🗑️';
      default: return '📝';
    }
  };

  const getChangePriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return '#ff4444';
      case 'MEDIUM': return '#ffaa00';
      case 'LOW': return '#44aa44';
      default: return '#666666';
    }
  };

  return (
    <div className="incremental-monitor-overlay">
      <div className="incremental-monitor">
        <div className="monitor-header">
          <h3>🔄 Incremental Updates Monitor</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="monitor-tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab ${activeTab === 'changes' ? 'active' : ''}`}
            onClick={() => setActiveTab('changes')}
          >
            Recent Changes
          </button>
          <button 
            className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            Performance
          </button>
          <button 
            className={`tab ${activeTab === 'debug' ? 'active' : ''}`}
            onClick={() => setActiveTab('debug')}
          >
            Debug
          </button>
        </div>

        <div className="monitor-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Live Games</div>
                  <div className="stat-value live-games">{liveGamesCount}</div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-label">Update Frequency</div>
                  <div className="stat-value">{updateFrequency}</div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-label">Recent Changes</div>
                  <div className="stat-value">{changeSummary.recentChanges || 0}</div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-label">Score Updates</div>
                  <div className="stat-value score-updates">{changeSummary.scoreChanges || 0}</div>
                </div>
              </div>

              <div className="cache-info">
                <h4>Cache Information</h4>
                <div className="cache-stats">
                  <div className="cache-stat">
                    <span>Cached Leagues:</span>
                    <span>{updateStats.cachedLeagues || 0}</span>
                  </div>
                  <div className="cache-stat">
                    <span>Total Games:</span>
                    <span>{updateStats.totalGames || 0}</span>
                  </div>
                  <div className="cache-stat">
                    <span>Cache Size:</span>
                    <span>{formatBytes(updateStats.cacheSize || 0)}</span>
                  </div>
                  <div className="cache-stat">
                    <span>Last Update:</span>
                    <span>{updateStats.lastUpdate ? formatTimestamp(updateStats.lastUpdate) : 'Never'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'changes' && (
            <div className="changes-tab">
              <div className="changes-header">
                <h4>Recent Changes ({recentChanges.length})</h4>
                <div className="change-filters">
                  <span className="filter-label">Last 50 changes</span>
                </div>
              </div>
              
              <div className="changes-list">
                {recentChanges.length === 0 ? (
                  <div className="no-changes">No recent changes</div>
                ) : (
                  recentChanges.map((change, index) => (
                    <div key={index} className="change-item">
                      <div className="change-header">
                        <span className="change-icon">{getChangeTypeIcon(change.type)}</span>
                        <span className="change-type">{change.type}</span>
                        <span className="change-league">{change.league}</span>
                        <span className="change-time">{formatTimestamp(change.timestamp)}</span>
                      </div>
                      
                      {change.changes && (
                        <div className="change-details">
                          {change.changes.map((detail, detailIndex) => (
                            <div key={detailIndex} className="change-detail">
                              <span 
                                className="change-priority"
                                style={{ color: getChangePriorityColor(detail.priority) }}
                              >
                                {detail.field}:
                              </span>
                              <span className="change-values">
                                {detail.oldValue} → {detail.newValue}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="performance-tab">
              <div className="monitoring-controls">
                <button 
                  className={`monitor-btn ${isMonitoring ? 'active' : ''}`}
                  onClick={isMonitoring ? stopMonitoring : startMonitoring}
                >
                  {isMonitoring ? '⏸️ Stop Monitoring' : '▶️ Start Monitoring'}
                </button>
              </div>

              {isMonitoring && (
                <div className="performance-stats">
                  <h4>Real-time Performance</h4>
                  <div className="perf-grid">
                    <div className="perf-stat">
                      <span>Cached Leagues:</span>
                      <span>{stats.cachedLeagues || 0}</span>
                    </div>
                    <div className="perf-stat">
                      <span>Total Games:</span>
                      <span>{stats.totalGames || 0}</span>
                    </div>
                    <div className="perf-stat">
                      <span>Memory Usage:</span>
                      <span>{formatBytes(stats.cacheSize || 0)}</span>
                    </div>
                    <div className="perf-stat">
                      <span>Last Update:</span>
                      <span>{stats.lastUpdate ? formatTimestamp(stats.lastUpdate) : 'Never'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="performance-tips">
                <h4>Performance Tips</h4>
                <ul>
                  <li>Live games update every 5 seconds for real-time scores</li>
                  <li>Upcoming games update every 15 seconds</li>
                  <li>Finished games update every 60 seconds</li>
                  <li>Cache is automatically cleared after 5 minutes of inactivity</li>
                  <li>Updates pause when browser tab is hidden</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'debug' && (
            <div className="debug-tab">
              <div className="debug-controls">
                <button 
                  className={`debug-btn ${debugInfo.enabled ? 'active' : ''}`}
                  onClick={debugInfo.enabled ? disableDebug : enableDebug}
                >
                  {debugInfo.enabled ? '🔍 Disable Debug' : '🔍 Enable Debug'}
                </button>
              </div>

              {debugInfo.enabled && (
                <div className="debug-logs">
                  <h4>Debug Logs ({debugInfo.logs.length})</h4>
                  <div className="logs-container">
                    {debugInfo.logs.length === 0 ? (
                      <div className="no-logs">No debug logs yet</div>
                    ) : (
                      debugInfo.logs.map((log, index) => (
                        <div key={index} className="debug-log">
                          <span className="log-time">{formatTimestamp(log.timestamp)}</span>
                          <span className="log-message">{log.message}</span>
                          {log.data && (
                            <pre className="log-data">{JSON.stringify(log.data, null, 2)}</pre>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="debug-info">
                <h4>System Information</h4>
                <div className="system-info">
                  <div>Browser: {navigator.userAgent.split(' ')[0]}</div>
                  <div>Timestamp: {new Date().toISOString()}</div>
                  <div>Page Visibility: {document.hidden ? 'Hidden' : 'Visible'}</div>
                  <div>Online Status: {navigator.onLine ? 'Online' : 'Offline'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncrementalUpdatesMonitor;