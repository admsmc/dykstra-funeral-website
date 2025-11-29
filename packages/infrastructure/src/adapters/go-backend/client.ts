import createClient from 'openapi-fetch';
// import type { paths } from '@/generated/go-api';

/**
 * Shared OpenAPI client for Go backend adapters
 * 
 * This client routes all requests through the BFF proxy at /api/go-proxy
 * 
 * Architecture:
 * - TypeScript adapters use this client (Infrastructure layer)
 * - Client routes through BFF proxy (Next.js API layer)
 * - BFF proxy forwards to Go backend with auth/tenant headers
 * - Never access Go infrastructure (TigerBeetle, EventStoreDB) directly
 * 
 * Usage in adapters:
 * ```typescript
 * import { goClient } from './client';
 * 
 * const res = await goClient.POST('/v1/contracts', { body: command });
 * if (res.error) throw new Error(res.error.message);
 * return res.data;
 * ```
 */

// TODO: Once OpenAPI spec is generated, replace 'any' with 'paths' type
// export const goClient = createClient<paths>({ baseUrl: '/api/go-proxy' });
export const goClient = createClient<any>({ 
  baseUrl: '/api/go-proxy' 
});

/**
 * Type guard to check if OpenAPI response has an error
 */
export function hasError<T>(
  response: { data?: T; error?: any; response: Response }
): response is { error: any; response: Response } {
  return response.error !== undefined;
}

/**
 * Extract data or throw error from OpenAPI response
 */
export function unwrapResponse<T>(
  response: { data?: T; error?: any; response: Response }
): T {
  if (hasError(response)) {
    throw new Error(response.error?.message || 'Go backend request failed');
  }
  if (!response.data) {
    throw new Error('Go backend returned no data');
  }
  return response.data;
}
