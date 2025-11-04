import React from 'react';
import './ErrorBoundary.css';

/**
 * Error Boundary component to catch and handle React component errors
 * Provides graceful fallback UI when child components throw errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // You can also log the error to an error reporting service here
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h3>Something went wrong</h3>
            <p>
              {this.props.message || 'An unexpected error occurred. Please try again.'}
            </p>
            {this.props.showRetry !== false && (
              <button 
                onClick={this.handleRetry}
                className="error-retry-button"
              >
                Try Again
              </button>
            )}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development)</summary>
                <pre>{this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 * @param {React.Component} Component - Component to wrap
 * @param {Object} errorBoundaryProps - Props to pass to ErrorBoundary
 * @returns {React.Component} Wrapped component
 */
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

/**
 * Specialized Error Boundary for Game Tiles
 * Provides sport-specific fallback UI
 */
export const GameTileErrorBoundary = ({ children, game }) => (
  <ErrorBoundary
    message="Unable to display game information"
    fallback={
      <div className="game-tile error-state">
        <div className="game-header">
          <span className="league-badge error">
            {game?.league || 'GAME'}
          </span>
          <span className="game-status error">ERROR</span>
        </div>
        <div className="teams">
          <div className="team">
            <div className="team-info">
              <div className="team-name">
                <span className="abbrev">{game?.awayTeam?.abbreviation || '---'}</span>
              </div>
            </div>
            <div className="team-score">-</div>
          </div>
          <div className="vs">@</div>
          <div className="team">
            <div className="team-info">
              <div className="team-name">
                <span className="abbrev">{game?.homeTeam?.abbreviation || '---'}</span>
              </div>
            </div>
            <div className="team-score">-</div>
          </div>
        </div>
        <div className="game-time">Data unavailable</div>
      </div>
    }
    onError={(error, errorInfo) => {
      console.error(`Game tile error for game ${game?.id}:`, error);
    }}
  >
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;