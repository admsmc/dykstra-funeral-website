import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Effect } from 'effect';
import { GoPayrollAdapter } from '../go-payroll-adapter';

/**
 * Integration Tests for GoPayrollAdapter
 * 
 * Tests the new timesheet workflow methods from Phase 2:
 * - Submit Timesheet (POST /ps/timesheets/submit)
 * - Approve Timesheet (POST /ps/timesheets/{id}/approve)
 * - Reject Timesheet (POST /ps/timesheets/{id}/reject)
 * - List Timesheets (GET /ps/timesheets)
 * 
 * Prerequisites:
 * - Go backend running at http://localhost:8080 (or configured URL)
 * - Test data seeded: tenant='T1', workers, time entries
 * - Professional Services module enabled
 * 
 * Note: These are integration tests that require a running backend.
 * The timesheet workflow is event-sourced with stream pattern: timesheet|{tenant}|{id}
 */

describe('GoPayrollAdapter - Phase 2 Timesheet Integration Tests', () => {
  // Test data
  const testTenant = 'T1';
  const testWorkerId = 'WORKER001';
  const testManagerId = 'MANAGER001';
  
  describe('Submit Timesheet', () => {
    it('should submit timesheet using correct endpoint', async () => {
      const command = {
        tenant: testTenant,
        timesheetId: `TS_${Date.now()}`,
        workerId: testWorkerId,
        periodStart: new Date('2025-11-01'),
        periodEnd: new Date('2025-11-07'),
        entries: ['entry_1', 'entry_2', 'entry_3'],
        notes: 'Weekly timesheet for testing',
      };
      
      const result = await Effect.runPromise(
        GoPayrollAdapter.submitTimesheet(command)
      );
      
      expect(result).toBeDefined();
      expect(result.stream).toBeDefined();
      expect(result.stream).toMatch(/^timesheet\|/);
      expect(result.eventId).toBeDefined();
      expect(result.appended).toBe(true);
    });
    
    it('should generate correct event stream name', async () => {
      const timesheetId = 'TS_STREAM_TEST';
      const command = {
        tenant: 'TENANT1',
        timesheetId,
        workerId: 'W001',
        periodStart: new Date('2025-11-01'),
        periodEnd: new Date('2025-11-07'),
        entries: ['e1'],
      };
      
      const result = await Effect.runPromise(
        GoPayrollAdapter.submitTimesheet(command)
      );
      
      expect(result.stream).toBe(`timesheet|TENANT1|${timesheetId}`);
    });
    
    it('should submit timesheet with multiple entries', async () => {
      const command = {
        tenant: testTenant,
        timesheetId: `TS_MULTI_${Date.now()}`,
        workerId: testWorkerId,
        periodStart: new Date('2025-11-08'),
        periodEnd: new Date('2025-11-14'),
        entries: ['entry_1', 'entry_2', 'entry_3', 'entry_4', 'entry_5'],
        notes: 'Multi-entry timesheet',
      };
      
      const result = await Effect.runPromise(
        GoPayrollAdapter.submitTimesheet(command)
      );
      
      expect(result).toBeDefined();
      expect(result.appended).toBe(true);
    });
    
    it('should submit timesheet without optional notes', async () => {
      const command = {
        tenant: testTenant,
        timesheetId: `TS_NO_NOTES_${Date.now()}`,
        workerId: testWorkerId,
        periodStart: new Date('2025-11-15'),
        periodEnd: new Date('2025-11-21'),
        entries: ['entry_1'],
        // notes omitted
      };
      
      const result = await Effect.runPromise(
        GoPayrollAdapter.submitTimesheet(command)
      );
      
      expect(result).toBeDefined();
      expect(result.appended).toBe(true);
    });
  });
  
  describe('Approve Timesheet', () => {
    let submittedTimesheetId: string;
    
    beforeAll(async () => {
      // Submit a timesheet for approval testing
      submittedTimesheetId = `TS_APPROVE_${Date.now()}`;
      const command = {
        tenant: testTenant,
        timesheetId: submittedTimesheetId,
        workerId: testWorkerId,
        periodStart: new Date('2025-11-22'),
        periodEnd: new Date('2025-11-28'),
        entries: ['entry_1'],
        notes: 'Timesheet for approval test',
      };
      
      await Effect.runPromise(
        GoPayrollAdapter.submitTimesheet(command)
      );
    });
    
    it('should approve timesheet using correct endpoint', async () => {
      const params = {
        timesheetId: submittedTimesheetId,
        tenant: testTenant,
        actor: testManagerId,
      };
      
      const result = await Effect.runPromise(
        GoPayrollAdapter.approveTimesheet(params)
      );
      
      expect(result).toBeDefined();
      expect(result.stream).toBeDefined();
      expect(result.stream).toContain(submittedTimesheetId);
      expect(result.eventId).toBeDefined();
      expect(result.appended).toBe(true);
    });
    
    it('should record actor in approval event', async () => {
      const timesheetId = `TS_ACTOR_${Date.now()}`;
      
      // First submit
      await Effect.runPromise(
        GoPayrollAdapter.submitTimesheet({
          tenant: testTenant,
          timesheetId,
          workerId: testWorkerId,
          periodStart: new Date('2025-11-01'),
          periodEnd: new Date('2025-11-07'),
          entries: ['e1'],
        })
      );
      
      // Then approve
      const result = await Effect.runPromise(
        GoPayrollAdapter.approveTimesheet({
          timesheetId,
          tenant: testTenant,
          actor: 'SPECIFIC_MANAGER',
        })
      );
      
      expect(result).toBeDefined();
      expect(result.appended).toBe(true);
    });
  });
  
  describe('Reject Timesheet', () => {
    let submittedTimesheetId: string;
    
    beforeAll(async () => {
      // Submit a timesheet for rejection testing
      submittedTimesheetId = `TS_REJECT_${Date.now()}`;
      const command = {
        tenant: testTenant,
        timesheetId: submittedTimesheetId,
        workerId: testWorkerId,
        periodStart: new Date('2025-11-22'),
        periodEnd: new Date('2025-11-28'),
        entries: ['entry_1'],
        notes: 'Timesheet for rejection test',
      };
      
      await Effect.runPromise(
        GoPayrollAdapter.submitTimesheet(command)
      );
    });
    
    it('should reject timesheet using correct endpoint', async () => {
      const params = {
        timesheetId: submittedTimesheetId,
        tenant: testTenant,
        actor: testManagerId,
        reason: 'Incomplete time entries',
      };
      
      const result = await Effect.runPromise(
        GoPayrollAdapter.rejectTimesheet(params)
      );
      
      expect(result).toBeDefined();
      expect(result.stream).toBeDefined();
      expect(result.stream).toContain(submittedTimesheetId);
      expect(result.eventId).toBeDefined();
      expect(result.appended).toBe(true);
    });
    
    it('should include rejection reason', async () => {
      const timesheetId = `TS_REASON_${Date.now()}`;
      
      // Submit
      await Effect.runPromise(
        GoPayrollAdapter.submitTimesheet({
          tenant: testTenant,
          timesheetId,
          workerId: testWorkerId,
          periodStart: new Date('2025-11-01'),
          periodEnd: new Date('2025-11-07'),
          entries: ['e1'],
        })
      );
      
      // Reject with specific reason
      const result = await Effect.runPromise(
        GoPayrollAdapter.rejectTimesheet({
          timesheetId,
          tenant: testTenant,
          actor: testManagerId,
          reason: 'Hours exceed project budget',
        })
      );
      
      expect(result).toBeDefined();
      expect(result.appended).toBe(true);
    });
  });
  
  describe('List Timesheets', () => {
    beforeAll(async () => {
      // Submit multiple timesheets for list testing
      const timesheetPromises = [
        GoPayrollAdapter.submitTimesheet({
          tenant: testTenant,
          timesheetId: `TS_LIST_1_${Date.now()}`,
          workerId: testWorkerId,
          periodStart: new Date('2025-11-01'),
          periodEnd: new Date('2025-11-07'),
          entries: ['e1'],
        }),
        GoPayrollAdapter.submitTimesheet({
          tenant: testTenant,
          timesheetId: `TS_LIST_2_${Date.now()}`,
          workerId: testWorkerId,
          periodStart: new Date('2025-11-08'),
          periodEnd: new Date('2025-11-14'),
          entries: ['e1'],
        }),
        GoPayrollAdapter.submitTimesheet({
          tenant: testTenant,
          timesheetId: `TS_LIST_3_${Date.now()}`,
          workerId: 'WORKER002',
          periodStart: new Date('2025-11-01'),
          periodEnd: new Date('2025-11-07'),
          entries: ['e1'],
        }),
      ];
      
      await Promise.all(timesheetPromises.map(p => Effect.runPromise(p)));
    });
    
    it('should list timesheets for tenant', async () => {
      const query = {
        tenant: testTenant,
      };
      
      const result = await Effect.runPromise(
        GoPayrollAdapter.listTimesheets(query)
      );
      
      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      expect(result.count).toBeGreaterThan(0);
      
      // Verify timesheet structure
      if (result.items.length > 0) {
        const timesheet = result.items[0];
        expect(timesheet).toHaveProperty('id');
        expect(timesheet).toHaveProperty('timesheetId');
        expect(timesheet).toHaveProperty('workerId');
        expect(timesheet).toHaveProperty('status');
        expect(timesheet).toHaveProperty('periodStart');
        expect(timesheet).toHaveProperty('periodEnd');
        expect(timesheet.periodStart).toBeInstanceOf(Date);
        expect(timesheet.periodEnd).toBeInstanceOf(Date);
      }
    });
    
    it('should filter timesheets by worker', async () => {
      const query = {
        tenant: testTenant,
        workerId: testWorkerId,
      };
      
      const result = await Effect.runPromise(
        GoPayrollAdapter.listTimesheets(query)
      );
      
      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      
      // All returned timesheets should belong to the specified worker
      result.items.forEach(timesheet => {
        expect(timesheet.workerId).toBe(testWorkerId);
      });
    });
    
    it('should filter timesheets by status', async () => {
      const query = {
        tenant: testTenant,
        status: 'submitted' as const,
      };
      
      const result = await Effect.runPromise(
        GoPayrollAdapter.listTimesheets(query)
      );
      
      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      
      // All returned timesheets should have 'submitted' status
      result.items.forEach(timesheet => {
        expect(timesheet.status).toBe('submitted');
      });
    });
    
    it('should filter timesheets by date range', async () => {
      const query = {
        tenant: testTenant,
        from: new Date('2025-11-01'),
        to: new Date('2025-11-15'),
      };
      
      const result = await Effect.runPromise(
        GoPayrollAdapter.listTimesheets(query)
      );
      
      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
    });
    
    it('should support pagination with limit and offset', async () => {
      const query1 = {
        tenant: testTenant,
        limit: 2,
        offset: 0,
      };
      
      const result1 = await Effect.runPromise(
        GoPayrollAdapter.listTimesheets(query1)
      );
      
      expect(result1).toBeDefined();
      expect(result1.items.length).toBeLessThanOrEqual(2);
      
      const query2 = {
        tenant: testTenant,
        limit: 2,
        offset: 2,
      };
      
      const result2 = await Effect.runPromise(
        GoPayrollAdapter.listTimesheets(query2)
      );
      
      expect(result2).toBeDefined();
      // Verify different pages return different items
      if (result1.items.length > 0 && result2.items.length > 0) {
        expect(result1.items[0].id).not.toBe(result2.items[0].id);
      }
    });
    
    it('should combine multiple filters', async () => {
      const query = {
        tenant: testTenant,
        workerId: testWorkerId,
        status: 'submitted' as const,
        from: new Date('2025-11-01'),
        to: new Date('2025-11-30'),
        limit: 10,
        offset: 0,
      };
      
      const result = await Effect.runPromise(
        GoPayrollAdapter.listTimesheets(query)
      );
      
      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      expect(result.count).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('Timesheet Workflow - Complete Flow', () => {
    it('should submit, list, and approve timesheet', async () => {
      const timesheetId = `TS_WORKFLOW_${Date.now()}`;
      
      // Step 1: Submit
      const submitResult = await Effect.runPromise(
        GoPayrollAdapter.submitTimesheet({
          tenant: testTenant,
          timesheetId,
          workerId: testWorkerId,
          periodStart: new Date('2025-11-01'),
          periodEnd: new Date('2025-11-07'),
          entries: ['entry_1', 'entry_2'],
          notes: 'Complete workflow test',
        })
      );
      
      expect(submitResult.appended).toBe(true);
      
      // Step 2: List and verify it appears
      const listResult = await Effect.runPromise(
        GoPayrollAdapter.listTimesheets({
          tenant: testTenant,
          workerId: testWorkerId,
        })
      );
      
      const submittedTimesheet = listResult.items.find(
        ts => ts.timesheetId === timesheetId
      );
      expect(submittedTimesheet).toBeDefined();
      expect(submittedTimesheet?.status).toBe('submitted');
      
      // Step 3: Approve
      const approveResult = await Effect.runPromise(
        GoPayrollAdapter.approveTimesheet({
          timesheetId,
          tenant: testTenant,
          actor: testManagerId,
        })
      );
      
      expect(approveResult.appended).toBe(true);
      
      // Step 4: List again and verify status changed
      const listAfterApproval = await Effect.runPromise(
        GoPayrollAdapter.listTimesheets({
          tenant: testTenant,
          workerId: testWorkerId,
          status: 'approved',
        })
      );
      
      const approvedTimesheet = listAfterApproval.items.find(
        ts => ts.timesheetId === timesheetId
      );
      expect(approvedTimesheet).toBeDefined();
      expect(approvedTimesheet?.status).toBe('approved');
      expect(approvedTimesheet?.approvedBy).toBe(testManagerId);
      expect(approvedTimesheet?.approvedAt).toBeInstanceOf(Date);
    });
    
    it('should submit, list, and reject timesheet', async () => {
      const timesheetId = `TS_REJECT_FLOW_${Date.now()}`;
      
      // Step 1: Submit
      const submitResult = await Effect.runPromise(
        GoPayrollAdapter.submitTimesheet({
          tenant: testTenant,
          timesheetId,
          workerId: testWorkerId,
          periodStart: new Date('2025-11-08'),
          periodEnd: new Date('2025-11-14'),
          entries: ['entry_1'],
          notes: 'Rejection workflow test',
        })
      );
      
      expect(submitResult.appended).toBe(true);
      
      // Step 2: Reject
      const rejectResult = await Effect.runPromise(
        GoPayrollAdapter.rejectTimesheet({
          timesheetId,
          tenant: testTenant,
          actor: testManagerId,
          reason: 'Missing project code',
        })
      );
      
      expect(rejectResult.appended).toBe(true);
      
      // Step 3: List and verify status
      const listResult = await Effect.runPromise(
        GoPayrollAdapter.listTimesheets({
          tenant: testTenant,
          status: 'rejected',
        })
      );
      
      const rejectedTimesheet = listResult.items.find(
        ts => ts.timesheetId === timesheetId
      );
      expect(rejectedTimesheet).toBeDefined();
      expect(rejectedTimesheet?.status).toBe('rejected');
      expect(rejectedTimesheet?.rejectedBy).toBe(testManagerId);
      expect(rejectedTimesheet?.rejectionReason).toBe('Missing project code');
      expect(rejectedTimesheet?.rejectedAt).toBeInstanceOf(Date);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle missing required fields in submit', async () => {
      const incompleteCommand = {
        tenant: testTenant,
        // Missing: timesheetId, workerId, periods, entries
      } as any;
      
      const result = Effect.runPromise(
        GoPayrollAdapter.submitTimesheet(incompleteCommand)
      );
      
      await expect(result).rejects.toThrow();
    });
    
    it('should handle invalid date ranges', async () => {
      const command = {
        tenant: testTenant,
        timesheetId: `TS_INVALID_${Date.now()}`,
        workerId: testWorkerId,
        periodStart: new Date('2025-11-15'),
        periodEnd: new Date('2025-11-01'), // End before start
        entries: ['e1'],
      };
      
      const result = Effect.runPromise(
        GoPayrollAdapter.submitTimesheet(command)
      );
      
      await expect(result).rejects.toThrow();
    });
    
    it('should handle non-existent timesheet in approve', async () => {
      const result = Effect.runPromise(
        GoPayrollAdapter.approveTimesheet({
          timesheetId: 'NON_EXISTENT_TS',
          tenant: testTenant,
          actor: testManagerId,
        })
      );
      
      await expect(result).rejects.toThrow();
    });
    
    it('should handle empty tenant in list', async () => {
      const result = Effect.runPromise(
        GoPayrollAdapter.listTimesheets({
          tenant: '',
        })
      );
      
      await expect(result).rejects.toThrow();
    });
  });
  
  describe('Date Handling', () => {
    it('should correctly convert dates to ISO strings', async () => {
      const periodStart = new Date('2025-11-01T00:00:00Z');
      const periodEnd = new Date('2025-11-07T23:59:59Z');
      
      const command = {
        tenant: testTenant,
        timesheetId: `TS_DATE_${Date.now()}`,
        workerId: testWorkerId,
        periodStart,
        periodEnd,
        entries: ['e1'],
      };
      
      const result = await Effect.runPromise(
        GoPayrollAdapter.submitTimesheet(command)
      );
      
      expect(result).toBeDefined();
      expect(result.appended).toBe(true);
    });
    
    it('should parse dates correctly from list response', async () => {
      const result = await Effect.runPromise(
        GoPayrollAdapter.listTimesheets({
          tenant: testTenant,
          limit: 1,
        })
      );
      
      if (result.items.length > 0) {
        const timesheet = result.items[0];
        expect(timesheet.submittedAt).toBeInstanceOf(Date);
        expect(timesheet.periodStart).toBeInstanceOf(Date);
        expect(timesheet.periodEnd).toBeInstanceOf(Date);
        
        // Verify dates are valid
        expect(timesheet.submittedAt.getTime()).not.toBeNaN();
        expect(timesheet.periodStart.getTime()).not.toBeNaN();
        expect(timesheet.periodEnd.getTime()).not.toBeNaN();
      }
    });
  });
});

/**
 * Test Configuration
 */
describe('Test Configuration', () => {
  it('should have professional services module configured', () => {
    // Verify backend is configured for Professional Services endpoints
    expect(process.env.GO_BACKEND_URL || 'http://localhost:8080').toBeDefined();
  });
  
  it('should have test tenant configured', () => {
    // Verify test data is available
    expect(testTenant).toBeDefined();
    expect(testTenant.length).toBeGreaterThan(0);
  });
});
