/**
 * Test Data Factories
 * 
 * Functions to generate mock data for testing.
 * Use these instead of hardcoding test data to keep tests maintainable.
 */

/**
 * Mock Template
 */
export const mockTemplate = (overrides?: Partial<any>) => ({
  id: 'template-1',
  name: 'Test Template',
  category: 'service_program' as const,
  htmlTemplate: '<html><body>{{name}}</body></html>',
  cssTemplate: 'body { font-family: serif; }',
  isPublished: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

/**
 * Mock Payment
 */
export const mockPayment = (overrides?: Partial<any>) => ({
  id: 'payment-1',
  amount: 5000,
  method: 'credit-card' as const,
  status: 'completed' as const,
  caseId: 'case-1',
  timestamp: '2025-01-01T00:00:00Z',
  note: 'Test payment',
  ...overrides,
});

/**
 * Mock Case
 */
export const mockCase = (overrides?: Partial<any>) => ({
  id: 'case-1',
  businessKey: 'case-2025-001',
  status: 'active' as const,
  familyContact: {
    firstName: 'John',
    lastName: 'Smith',
    phone: '555-1234',
    email: 'john@example.com',
  },
  deceased: {
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1950-01-01',
    dateOfDeath: '2025-01-01',
  },
  serviceType: 'traditional' as const,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

/**
 * Mock Shift
 */
export const mockShift = (overrides?: Partial<any>) => ({
  id: 'shift-1',
  staffId: 'staff-1',
  type: 'on-call' as const,
  date: '2025-01-01',
  startTime: '09:00',
  endTime: '17:00',
  status: 'scheduled' as const,
  notes: 'Test shift',
  ...overrides,
});

/**
 * Mock User/Staff
 */
export const mockStaff = (overrides?: Partial<any>) => ({
  id: 'staff-1',
  firstName: 'John',
  lastName: 'Director',
  email: 'john.director@example.com',
  role: 'director' as const,
  ...overrides,
});

/**
 * Generate array of mock data
 * 
 * @example
 * ```typescript
 * const templates = generateMockArray(mockTemplate, 3);
 * // Returns array of 3 templates with unique IDs
 * ```
 */
export function generateMockArray<T>(
  factory: (overrides?: Partial<T>) => T,
  count: number
): T[] {
  return Array.from({ length: count }, (_, i) =>
    factory({ id: `mock-${i + 1}` } as Partial<T>)
  );
}
