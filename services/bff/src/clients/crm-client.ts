/**
 * CRM Client for TypeScript CRM backend
 * 
 * This will eventually use tRPC client to connect to the CRM backend.
 * For now, it's a stub that returns mock data.
 * 
 * TODO: Replace with actual tRPC client once CRM tRPC routers are defined
 */

export interface CRMClient {
  case: {
    finalize: (input: { businessKey: string }) => Promise<{
      id: string
      businessKey: string
      legalEntity: string
      lineItems: Array<{
        type: string
        description: string
        amount: number
      }>
    }>
    updateGLReference: (input: {
      businessKey: string
      glJournalId: string
    }) => Promise<void>
  }
  timeEntry: {
    listByPayPeriod: (input: {
      payPeriodId: string
      approved: boolean
    }) => Promise<Array<{
      employeeId: string
      caseId: string
      hours: number
      date: Date
    }>>
  }
}

/**
 * Create stub CRM client
 * 
 * @param baseUrl - Base URL of the CRM API (e.g., http://localhost:3000/api/trpc)
 * @param authToken - Optional JWT token for authenticated requests
 */
export function createCRMClient(baseUrl: string, authToken?: string): CRMClient {
  return {
    case: {
      finalize: async (input) => {
        // Stub implementation
        return {
          id: 'case-123',
          businessKey: input.businessKey,
          legalEntity: 'LE-1',
          lineItems: [
            {
              type: 'casket',
              description: 'Oak casket',
              amount: 350000, // $3,500.00 in cents
            },
            {
              type: 'embalming',
              description: 'Embalming services',
              amount: 75000, // $750.00 in cents
            },
          ],
        }
      },
      updateGLReference: async (input) => {
        // Stub implementation
        console.log(`Updated case ${input.businessKey} with GL reference ${input.glJournalId}`)
      },
    },
    timeEntry: {
      listByPayPeriod: async (input) => {
        // Stub implementation
        return [
          {
            employeeId: 'EMP-1',
            caseId: 'CASE-123',
            hours: 8.5,
            date: new Date('2025-11-15'),
          },
          {
            employeeId: 'EMP-2',
            caseId: 'CASE-124',
            hours: 6.0,
            date: new Date('2025-11-16'),
          },
        ]
      },
    },
  }
}

/**
 * Create CRM client from environment
 */
export function createCRMClientFromEnv(authToken?: string): CRMClient {
  const baseUrl = process.env.CRM_BASE_URL || 'http://localhost:3000/api/trpc'
  return createCRMClient(baseUrl, authToken)
}
