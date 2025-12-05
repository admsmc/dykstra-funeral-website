/**
 * MSW Request Handlers
 * 
 * Mock API responses for testing. These handlers intercept HTTP requests
 * and return mock data instead of hitting the real API.
 */

import { http, HttpResponse } from 'msw';

/**
 * Base URL for tRPC API calls
 */
const TRPC_BASE_URL = '/api/trpc';

/**
 * Default MSW handlers
 * 
 * Add more handlers as needed for different API endpoints.
 */
export const handlers = [
  // Template List
  http.get(`${TRPC_BASE_URL}/template.list`, () => {
    return HttpResponse.json({
      result: {
        data: [
          {
            id: 'template-1',
            name: 'Classic Memorial Program',
            category: 'service_program',
            isPublished: true,
            createdAt: '2025-01-01T00:00:00Z',
          },
          {
            id: 'template-2',
            name: 'Modern Prayer Card',
            category: 'prayer_card',
            isPublished: true,
            createdAt: '2025-01-02T00:00:00Z',
          },
        ],
      },
    });
  }),

  // Template Get by ID
  http.get(`${TRPC_BASE_URL}/template.get`, () => {
    return HttpResponse.json({
      result: {
        data: {
          id: 'template-1',
          name: 'Classic Memorial Program',
          category: 'service_program',
          htmlTemplate: '<html><body>{{name}}</body></html>',
          cssTemplate: 'body { font-family: serif; }',
          isPublished: true,
          createdAt: '2025-01-01T00:00:00Z',
        },
      },
    });
  }),

  // Payment List
  http.get(`${TRPC_BASE_URL}/payment.list`, () => {
    return HttpResponse.json({
      result: {
        data: [
          {
            id: 'payment-1',
            amount: 5000,
            method: 'credit-card',
            status: 'completed',
            caseId: 'case-1',
            timestamp: '2025-01-01T00:00:00Z',
          },
          {
            id: 'payment-2',
            amount: 2500,
            method: 'cash',
            status: 'completed',
            caseId: 'case-1',
            timestamp: '2025-01-02T00:00:00Z',
          },
        ],
      },
    });
  }),
];
