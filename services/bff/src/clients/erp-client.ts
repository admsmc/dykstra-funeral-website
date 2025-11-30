import createClient from 'openapi-fetch'
// import type { paths } from '../generated/erp-api' // Will be generated via openapi-typescript

/**
 * ERP Client for Go backend
 * 
 * Uses openapi-fetch for type-safe HTTP calls to the Go ERP system.
 * Type definitions are generated from the Go ERP's OpenAPI spec.
 */

// Placeholder type until we generate from OpenAPI spec
type ERPPaths = {
  '/health': {
    get: {
      responses: {
        200: {
          content: {
            'text/plain': string
          }
        }
      }
    }
  }
  '/v1/gl/journals': {
    post: {
      requestBody: {
        content: {
          'application/json': {
            book: string
            entity_id: string
            accounting_date: string
            currency: string
            description?: string
            lines: Array<{
              line_no?: number
              account_code?: string
              account_id?: string
              amount_minor: number
              dims?: Record<string, string>
              narrative?: string
            }>
          }
        }
      }
      responses: {
        200: {
          content: {
            'application/json': {
              journal_id: string
              status: string
            }
          }
        }
      }
    }
  }
}

export type ERPClient = ReturnType<typeof createERPClient>

/**
 * Create ERP client instance
 * 
 * @param baseUrl - Base URL of the Go ERP API (e.g., http://localhost:8080)
 * @param authToken - Optional JWT token for authenticated requests
 */
export function createERPClient(baseUrl: string, authToken?: string) {
  const client = createClient<ERPPaths>({
    baseUrl,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  })

  return client
}

/**
 * Create ERP client from environment
 */
export function createERPClientFromEnv(authToken?: string) {
  const baseUrl = process.env.ERP_BASE_URL || 'http://localhost:8080'
  return createERPClient(baseUrl, authToken)
}
