/**
 * Custom Render Function
 * 
 * Wraps components with necessary providers for testing.
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Create a new QueryClient for each test
 * 
 * This ensures tests are isolated and don't share cache.
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry failed queries in tests
        gcTime: Infinity, // Don't garbage collect during tests
      },
      mutations: {
        retry: false, // Don't retry failed mutations in tests
      },
    },
  });
}

/**
 * Test wrapper with all providers
 */
interface TestProvidersProps {
  children: React.ReactNode;
}

function TestProviders({ children }: TestProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Custom render function with providers
 * 
 * Use this instead of React Testing Library's render() to automatically
 * wrap components with necessary providers.
 * 
 * @example
 * ```typescript
 * import { renderWithProviders } from '@/test-utils';
 * 
 * test('renders button', () => {
 *   renderWithProviders(<Button>Click me</Button>);
 *   expect(screen.getByRole('button')).toHaveTextContent('Click me');
 * });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: TestProviders, ...options });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { renderWithProviders as render };
