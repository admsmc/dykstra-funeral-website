/**
 * Global Test Setup
 * 
 * This file runs before all tests to configure the testing environment.
 */

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './msw-server';

// Setup MSW server for API mocking
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
  cleanup(); // Cleanup React Testing Library
  localStorage.clear(); // Clear localStorage between tests
});

// Cleanup after all tests
afterAll(() => {
  server.close();
});
