import * as React from 'react';
import { FriendlyError } from './emotional';

export interface ErrorDisplayProps {
  error: Error | null;
  title?: string;
  retry?: () => void;
  className?: string;
}

export function ErrorDisplay({
  error,
  title = 'Error',
  retry,
  className,
}: ErrorDisplayProps) {
  if (!error) return null;

  // Generate contextual suggestions based on error message
  const getSuggestions = (message: string) => {
    const suggestions: string[] = [];
    
    if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
      suggestions.push('Check your internet connection');
      suggestions.push('Verify the server is running');
    }
    
    if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('auth')) {
      suggestions.push('Try signing out and back in');
      suggestions.push('Check if your session has expired');
    }
    
    if (message.toLowerCase().includes('not found')) {
      suggestions.push('Verify the resource exists');
      suggestions.push('Check if you have permission to access it');
    }
    
    // Default suggestions
    if (suggestions.length === 0) {
      suggestions.push('Try refreshing the page');
      suggestions.push('Contact support if the problem persists');
    }
    
    return suggestions.map((text, index) => ({ id: String(index), text }));
  };

  return (
    <div className={className}>
      <FriendlyError
        title={title}
        message={error.message}
        show={true}
        suggestions={getSuggestions(error.message)}
        onRetry={retry}
        onDismiss={retry ? undefined : () => {}}
      />
    </div>
  );
}
