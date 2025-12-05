/**
 * MSW Server
 * 
 * Creates and exports the MSW server for Node.js testing environment.
 */

import { setupServer } from 'msw/node';
import { handlers } from './msw-handlers';

/**
 * MSW server instance
 * 
 * This server intercepts HTTP requests during tests and returns mock responses.
 */
export const server = setupServer(...handlers);
