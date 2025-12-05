/**
 * Test Utilities
 * 
 * Central export for all testing utilities, helpers, and factories.
 * 
 * @example
 * ```typescript
 * import { render, screen, userEvent, mockTemplate } from '@/test-utils';
 * 
 * test('my component', async () => {
 *   render(<MyComponent />);
 *   await userEvent.click(screen.getByRole('button'));
 *   expect(screen.getByText('Success')).toBeInTheDocument();
 * });
 * ```
 */

// Custom render with providers
export { renderWithProviders, render } from './render';

// Re-export React Testing Library utilities
export {
  screen,
  waitFor,
  within,
  fireEvent,
  renderHook,
  act,
} from '@testing-library/react';

// Re-export user-event
export { default as userEvent } from '@testing-library/user-event';

// Test data factories
export * from './factories';

// MSW
export { server } from './msw-server';
export { handlers } from './msw-handlers';
