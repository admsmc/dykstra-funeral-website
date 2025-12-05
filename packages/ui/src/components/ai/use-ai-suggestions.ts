import { useEffect, useState } from 'react';

export interface AISuggestion {
  id: string;
  text: string;
  confidence: number;
}

interface UseAISuggestionsOptions {
  debounceMs?: number;
  minLength?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch AI-powered suggestions based on user input.
 * This is a mock implementation that should be replaced with real API calls.
 */
export function useAISuggestions(
  query: string,
  options: UseAISuggestionsOptions = {}
) {
  const {
    debounceMs = 300,
    minLength = 2,
    enabled = true,
  } = options;

  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || query.length < minLength) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    const timer = setTimeout(async () => {
      // Mock implementation - replace with actual API call
      const mockSuggestions = await fetchMockSuggestions(query);
      setSuggestions(mockSuggestions);
      setIsLoading(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, minLength, enabled]);

  return { suggestions, isLoading };
}

/**
 * Mock function to simulate AI suggestion API.
 * Replace this with actual API integration.
 */
async function fetchMockSuggestions(query: string): Promise<AISuggestion[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const lowerQuery = query.toLowerCase();

  // Mock suggestions based on common patterns
  const suggestions: AISuggestion[] = [];

  if (lowerQuery.includes('create') || lowerQuery.includes('new')) {
    suggestions.push({
      id: '1',
      text: 'Create a new case with default settings',
      confidence: 0.9,
    });
    suggestions.push({
      id: '2',
      text: 'Create a pre-need contract',
      confidence: 0.7,
    });
  }

  if (lowerQuery.includes('search') || lowerQuery.includes('find')) {
    suggestions.push({
      id: '3',
      text: 'Search for cases by family name',
      confidence: 0.85,
    });
    suggestions.push({
      id: '4',
      text: 'Find available inventory items',
      confidence: 0.75,
    });
  }

  if (lowerQuery.includes('report') || lowerQuery.includes('analytics')) {
    suggestions.push({
      id: '5',
      text: 'Generate monthly revenue report',
      confidence: 0.8,
    });
    suggestions.push({
      id: '6',
      text: 'View case statistics dashboard',
      confidence: 0.7,
    });
  }

  // Default suggestions if no specific patterns match
  if (suggestions.length === 0) {
    suggestions.push({
      id: '7',
      text: `Show help for "${query}"`,
      confidence: 0.5,
    });
  }

  return suggestions;
}
