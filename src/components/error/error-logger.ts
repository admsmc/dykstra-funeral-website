/**
 * Error Logger
 * 
 * Centralized error logging utility for tracking errors.
 * In production, this would integrate with services like Sentry, LogRocket, or Datadog.
 */

export interface ErrorLog {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  environment: string;
}

/**
 * Log an error to the console and future error tracking service
 */
export function logError(error: Error, errorInfo?: React.ErrorInfo): void {
  const errorLog: ErrorLog = {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack ?? undefined,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  // Always log to console
  console.error('Error caught by boundary:', errorLog);

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with Sentry, LogRocket, or similar
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
    sendToErrorTrackingService(errorLog);
  }
}

/**
 * Send error to remote tracking service
 * @private
 */
function sendToErrorTrackingService(errorLog: ErrorLog): void {
  // Placeholder for future integration
  // This would typically send to Sentry, LogRocket, etc.
  
  // Example implementation:
  // fetch('/api/errors', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(errorLog),
  // }).catch(() => {
  //   // Silently fail if error reporting fails
  // });
}
