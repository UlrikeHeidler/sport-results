/**
 * Enhanced Error Boundary Component
 * Provides better error handling and recovery for React components
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorHandler, ErrorSeverity, AppError } from '../utils/errors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  isolate?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to our error handling system
    const appError = new AppError(
      error.message,
      'REACT_ERROR_BOUNDARY',
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
      },
    );

    errorHandler.handleError(appError, ErrorSeverity.HIGH, {
      errorInfo,
      props: this.props,
    });

    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  override componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state if resetKeys have changed
    if (hasError && resetOnPropsChange && resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (resetKey, idx) => prevProps.resetKeys?.[idx] !== resetKey,
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  override componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  handleRetry = () => {
    this.resetErrorBoundary();
  };

  handleReload = () => {
    window.location.reload();
  };

  override render() {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, fallback, isolate } = this.props;

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary" data-error-id={errorId}>
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p>
              We're sorry, but something unexpected happened. The error has been
              logged and we'll look into it.
            </p>

            {window.location.hostname === 'localhost' && error && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <div className="error-stack">
                  <h4>Error Message:</h4>
                  <pre>{error.message}</pre>

                  <h4>Stack Trace:</h4>
                  <pre>{error.stack}</pre>

                  {errorInfo && (
                    <>
                      <h4>Component Stack:</h4>
                      <pre>{errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="error-actions">
              <button
                onClick={this.handleRetry}
                className="error-button error-button-primary"
              >
                Try Again
              </button>

              {!isolate && (
                <button
                  onClick={this.handleReload}
                  className="error-button error-button-secondary"
                >
                  Reload Page
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>,
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

// Hook for error boundary functionality
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    captureError,
    resetError,
  };
};

// Specialized error boundaries for different sections
export const GameTileErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    isolate={true}
    fallback={
      <div className="game-tile-error">
        <div className="error-icon">⚠️</div>
        <p>Unable to load game</p>
        <button onClick={() => window.location.reload()}>Refresh</button>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export const SettingsErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    isolate={true}
    fallback={
      <div className="settings-error">
        <div className="error-icon">⚠️</div>
        <p>Settings temporarily unavailable</p>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export const ApiErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    isolate={true}
    fallback={
      <div className="api-error">
        <div className="error-icon">🌐</div>
        <p>Connection error</p>
        <p>Please check your internet connection and try again.</p>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;
