import { z } from 'zod';
import { router, staffProcedure } from '../trpc';

/**
 * Payroll router
 * Payroll processing and management (Use Cases 4.1-4.4)
 */
export const payrollRouter = router({
  /**
   * List payroll runs
   */
  list: staffProcedure
    .input(
      z.object({
        status: z.enum(['all', 'draft', 'processing', 'approved', 'paid']).default('all'),
        year: z.number().optional(),
        funeralHomeId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      // Mock payroll run data - will be replaced with Go backend integration
      const allRuns = [
        {
          id: 'PR-2024-24',
          period: 'Dec 1-15, 2024',
          status: 'approved' as const,
          employees: 12,
          totalGross: 42500,
          totalNet: 31800,
          payDate: '2024-12-20',
        },
        {
          id: 'PR-2024-23',
          period: 'Nov 16-30, 2024',
          status: 'paid' as const,
          employees: 12,
          totalGross: 41200,
          totalNet: 30900,
          payDate: '2024-12-05',
        },
        {
          id: 'PR-2024-22',
          period: 'Nov 1-15, 2024',
          status: 'paid' as const,
          employees: 11,
          totalGross: 38900,
          totalNet: 29200,
          payDate: '2024-11-20',
        },
        {
          id: 'PR-2024-21',
          period: 'Oct 16-31, 2024',
          status: 'paid' as const,
          employees: 11,
          totalGross: 40100,
          totalNet: 30100,
          payDate: '2024-11-05',
        },
      ];

      let filtered = allRuns;

      // Filter by status
      if (input.status !== 'all') {
        filtered = filtered.filter((r) => r.status === input.status);
      }

      return filtered;
    }),

  /**
   * Get payroll run details with employee breakdown
   */
  getById: staffProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        id: input.id,
        period: 'Dec 1-15, 2024',
        status: 'approved' as const,
        employees: 12,
        totalGross: 42500,
        totalNet: 31800,
        payDate: '2024-12-20',
        employeeDetails: [
          {
            name: 'Sarah Martinez',
            hours: 80,
            rate: 28.5,
            gross: 2280,
            deductions: 540,
            net: 1740,
          },
          {
            name: 'John Davis',
            hours: 85,
            rate: 26.0,
            gross: 2210,
            deductions: 525,
            net: 1685,
          },
          {
            name: 'Michael Roberts',
            hours: 78,
            rate: 24.0,
            gross: 1872,
            deductions: 445,
            net: 1427,
          },
          {
            name: 'Emily Johnson',
            hours: 80,
            rate: 22.5,
            gross: 1800,
            deductions: 428,
            net: 1372,
          },
          {
            name: 'David Wilson',
            hours: 76,
            rate: 21.0,
            gross: 1596,
            deductions: 380,
            net: 1216,
          },
        ],
      };
    }),

  /**
   * Get employee payroll details for a specific run
   */
  getEmployees: staffProcedure
    .input(z.object({ payrollRunId: z.string() }))
    .query(async ({ input: _input }) => {
      // Mock implementation - will be replaced with Go backend integration
      return [
        {
          name: 'Sarah Martinez',
          hours: 80,
          rate: 28.5,
          gross: 2280,
          deductions: 540,
          net: 1740,
        },
        {
          name: 'John Davis',
          hours: 85,
          rate: 26.0,
          gross: 2210,
          deductions: 525,
          net: 1685,
        },
        {
          name: 'Michael Roberts',
          hours: 78,
          rate: 24.0,
          gross: 1872,
          deductions: 445,
          net: 1427,
        },
        {
          name: 'Emily Johnson',
          hours: 80,
          rate: 22.5,
          gross: 1800,
          deductions: 428,
          net: 1372,
        },
        {
          name: 'David Wilson',
          hours: 76,
          rate: 21.0,
          gross: 1596,
          deductions: 380,
          net: 1216,
        },
      ];
    }),

  /**
   * Create/run payroll (Use Case 4.1)
   */
  runPayroll: staffProcedure
    .input(
      z.object({
        periodStart: z.string(),
        periodEnd: z.string(),
        payDate: z.string(),
        funeralHomeId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        id: `PR-${Date.now()}`,
        period: `${input.periodStart} - ${input.periodEnd}`,
        status: 'draft' as const,
        employees: 0,
        totalGross: 0,
        totalNet: 0,
        payDate: input.payDate,
        createdAt: new Date(),
      };
    }),

  /**
   * Approve payroll run
   */
  approve: staffProcedure
    .input(z.object({ payrollRunId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        payrollRunId: input.payrollRunId,
        status: 'approved' as const,
        approvedBy: ctx.user.id,
        approvedAt: new Date(),
      };
    }),

  /**
   * Generate direct deposit file (Use Case 4.2)
   */
  generateDirectDeposit: staffProcedure
    .input(z.object({ payrollRunId: z.string() }))
    .mutation(async ({ input }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        payrollRunId: input.payrollRunId,
        fileName: `DD_${input.payrollRunId}.ach`,
        recordCount: 12,
        totalAmount: 31800,
        generatedAt: new Date(),
        downloadUrl: '/api/payroll/download-dd',
      };
    }),

  /**
   * Generate payroll journal entry (Use Case 4.3)
   */
  generateJournalEntry: staffProcedure
    .input(z.object({ payrollRunId: z.string() }))
    .mutation(async ({ input }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        payrollRunId: input.payrollRunId,
        journalEntryId: `JE-${Date.now()}`,
        entries: [
          { account: '5010 - Payroll Expense', debit: 42500, credit: 0 },
          { account: '2010 - Payroll Payable', debit: 0, credit: 31800 },
          { account: '2020 - Payroll Tax Payable', debit: 0, credit: 10700 },
        ],
        createdAt: new Date(),
      };
    }),

  /**
   * Generate W-2 forms (Use Case 4.4)
   */
  generateW2s: staffProcedure
    .input(z.object({ year: z.number() }))
    .mutation(async ({ input }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        year: input.year,
        employeeCount: 12,
        w2sGenerated: 12,
        downloadUrl: '/api/payroll/w2s',
        generatedAt: new Date(),
      };
    }),
});
