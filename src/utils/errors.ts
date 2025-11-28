/**
 * Enhanced Error Handling System
 * Custom error types and error boundary utilities
 */

import { ERROR_MESSAGES } from '../constants';

// Base custom error class
export class AppError extends Error {
  public readonly timestamp: string;
  public readonly context: Record<string, any> | undefined;

  constructor(
    message: string,
    public readonly code?: string,
    context?: Record<string, any>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date().toISOString();
    this.context = context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
    };
  }
}

// API-specific error
export class ApiError extends AppError {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly endpoint?: string,
    context?: Record<string, any>,
  ) {
    super(message, 'API_ERROR', { ...context, status, endpoint });
  }

  static fromResponse(response: Response, endpoint?: string) {
    return new ApiError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      endpoint,
      {
        url: response.url,
        headers: Object.fromEntries(response.headers.entries()),
      },
    );
  }
}

// Network-specific error
export class NetworkError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'NETWORK_ERROR', context);
  }
}

// Validation error
export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: any,
    context?: Record<string, any>,
  ) {
    super(message, 'VALIDATION_ERROR', { ...context, field, value });
  }
}

// Timeout error
export class TimeoutError extends AppError {
  constructor(
    message: string,
    public readonly timeout: number,
    context?: Record<string, any>,
  ) {
    super(message, 'TIMEOUT_ERROR', { ...context, timeout });
  }
}

// Cache error
export class CacheError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'CACHE_ERROR', context);
  }
}

// Game data error
export class GameDataError extends AppError {
  constructor(
    message: string,
    public readonly gameId?: string,
    public readonly league?: string,
    context?: Record<string, any>,
  ) {
    super(message, 'GAME_DATA_ERROR', { ...context, gameId, league });
  }
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error reporting interface
export interface ErrorReport {
  error: AppError;
  severity: ErrorSeverity;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
  additionalContext?: Record<string, any> | undefined;
}

// Error handler utility
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorReports: ErrorReport[] = [];
  private maxReports = 100;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Handle and report errors
  handleError(
    error: Error | AppError,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    additionalContext?: Record<string, any>,
  ): void {
    const appError = error instanceof AppError ? error : this.wrapError(error);

    const report: ErrorReport = {
      error: appError,
      severity,
      userAgent: navigator.userAgent,
      url: window.location.href,
      additionalContext: additionalContext || undefined,
    };

    this.addReport(report);
    this.logError(report);

    // Send to external service in production
    if (window.location.hostname !== 'localhost') {
      this.sendToErrorService(report);
    }
  }

  // Wrap generic errors in AppError
  private wrapError(error: Error): AppError {
    if (error instanceof AppError) {
      return error;
    }

    // Detect error types and wrap appropriately
    if (error.message.includes('fetch')) {
      return new NetworkError(error.message, { originalError: error.message });
    }

    if (error.message.includes('timeout')) {
      return new TimeoutError(error.message, 0, { originalError: error.message });
    }

    return new AppError(error.message, 'UNKNOWN_ERROR', {
      originalError: error.message,
      originalStack: error.stack,
    });
  }

  // Add error report to local storage
  private addReport(report: ErrorReport): void {
    this.errorReports.unshift(report);

    // Keep only the most recent reports
    if (this.errorReports.length > this.maxReports) {
      this.errorReports = this.errorReports.slice(0, this.maxReports);
    }

    // Store in localStorage for debugging
    try {
      localStorage.setItem('errorReports', JSON.stringify(this.errorReports.slice(0, 10)));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  // Log error to console with formatting
  private logError(report: ErrorReport): void {
    const { error, severity } = report;

    const logMethod = severity === ErrorSeverity.CRITICAL ? 'error' :
      severity === ErrorSeverity.HIGH ? 'error' :
        severity === ErrorSeverity.MEDIUM ? 'warn' : 'log';

    console[logMethod](`[${severity.toUpperCase()}] ${error.name}:`, {
      message: error.message,
      code: error.code,
      timestamp: error.timestamp,
      context: error.context,
      stack: error.stack,
    });
  }

  // Send error to external service (placeholder)
  private async sendToErrorService(_report: ErrorReport): Promise<void> {
    try {
      // In a real app, send to services like Sentry, LogRocket, etc.
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(report),
      // });
    } catch (e) {
      console.warn('Failed to send error report:', e);
    }
  }

  // Get recent error reports
  getRecentErrors(count = 10): ErrorReport[] {
    return this.errorReports.slice(0, count);
  }

  // Clear error reports
  clearReports(): void {
    this.errorReports = [];
    try {
      localStorage.removeItem('errorReports');
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  // Get error statistics
  getErrorStats(): Record<string, number> {
    const stats: Record<string, number> = {};

    this.errorReports.forEach(report => {
      const key = report.error.code || 'UNKNOWN';
      stats[key] = (stats[key] || 0) + 1;
    });

    return stats;
  }
}

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// Utility functions for common error scenarios
export const handleApiError = (error: any, endpoint?: string): never => {
  if (error instanceof Response) {
    throw ApiError.fromResponse(error, endpoint);
  }

  if (error.name === 'AbortError') {
    throw new TimeoutError('Request was aborted', 0, { endpoint });
  }

  if (error.message?.includes('fetch')) {
    throw new NetworkError(ERROR_MESSAGES.NETWORK_ERROR, { endpoint, originalError: error.message });
  }

  throw new ApiError(error.message || ERROR_MESSAGES.API_ERROR, undefined, endpoint);
};

export const handleValidationError = (field: string, value: any, message?: string): never => {
  throw new ValidationError(
    message || ERROR_MESSAGES.VALIDATION_ERROR,
    field,
    value,
  );
};

export const handleGameDataError = (gameId: string, league: string, message?: string): never => {
  throw new GameDataError(
    message || ERROR_MESSAGES.INVALID_GAME_DATA,
    gameId,
    league,
  );
};

// Error boundary hook for React components
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: any) => {
    errorHandler.handleError(error, ErrorSeverity.HIGH, { errorInfo });
  };

  const handleAsyncError = async (asyncFn: () => Promise<any>) => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error as Error);
      throw error;
    }
  };

  return {
    handleError,
    handleAsyncError,
    clearErrors: () => errorHandler.clearReports(),
    getRecentErrors: () => errorHandler.getRecentErrors(),
  };
};

// Error recovery utilities
export const withErrorRecovery = <T>(
  fn: () => T,
  fallback: T,
  onError?: (error: Error) => void,
): T => {
  try {
    return fn();
  } catch (error) {
    if (onError) {
      onError(error as Error);
    } else {
      errorHandler.handleError(error as Error, ErrorSeverity.LOW);
    }
    return fallback;
  }
};

export const withAsyncErrorRecovery = async <T>(
  fn: () => Promise<T>,
  fallback: T,
  onError?: (error: Error) => void,
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (onError) {
      onError(error as Error);
    } else {
      errorHandler.handleError(error as Error, ErrorSeverity.LOW);
    }
    return fallback;
  }
};
