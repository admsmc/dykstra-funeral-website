import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { runEffect } from '../utils/effect-runner';
import {
  getDashboardStats,
  getAnalytics,
  getTaskDashboard,
  startEmployeeOnboarding,
} from '@dykstra/application';

/**
 * Staff router
 * Provides staff-only endpoints for dashboard, analytics, and management
 */
export const staffRouter = router({
  /**
   * Get dashboard overview with KPIs
   */
  getDashboardStats: staffProcedure
    .input(
      z
        .object({
          funeralHomeId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const funeralHomeId = input?.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';

      const result = await runEffect(
        getDashboardStats({ funeralHomeId })
      );

      return {
        kpis: result.kpis,
        recentActivity: {
          cases: result.recentActivity.cases,
          payments: result.recentActivity.payments.map((p) => ({
            id: p.id,
            businessKey: p.businessKey,
            amount: p.amount,
            method: p.method,
            status: p.status,
            createdAt: p.createdAt,
            case: {
              decedentName: p.caseDecedentName,
            },
          })),
        },
      };
    }),

  /**
   * Get analytics data
   */
  getAnalytics: staffProcedure
    .input(
      z.object({
        funeralHomeId: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const funeralHomeId = input.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';
      const dateFrom = input.dateFrom ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days ago
      const dateTo = input.dateTo ?? new Date();

      return await runEffect(
        getAnalytics({
          funeralHomeId,
          dateFrom,
          dateTo,
        })
      );
    }),

  /**
   * Get task dashboard
   */
  getTaskDashboard: staffProcedure
    .input(
      z
        .object({
          funeralHomeId: z.string().optional(),
          assignedToMe: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const funeralHomeId = input?.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';
      const assignedToMe = input?.assignedToMe ?? false;

      return await runEffect(
        getTaskDashboard({
          funeralHomeId,
          assignedToUserId: assignedToMe ? ctx.user.id : undefined,
        })
      );
    }),

  /**
   * Employee Management
   */
  employees: router({
    /**
     * List all employees with optional filters
     */
    list: staffProcedure
      .input(
        z.object({
          status: z.enum(['all', 'active', 'onboarding', 'offboarding', 'inactive']).default('all'),
          department: z.enum(['all', 'Operations', 'Finance', 'Admin']).default('all'),
          funeralHomeId: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        // Mock employee data - will be replaced with Go backend integration
        const allEmployees = [
          {
            id: 'EMP-001',
            employeeNumber: 'E001',
            name: 'Sarah Martinez',
            firstName: 'Sarah',
            lastName: 'Martinez',
            title: 'Funeral Director',
            department: 'Operations',
            email: 'smartinez@dykstra.com',
            phone: '(555) 100-0001',
            hireDate: '2020-01-15',
            status: 'active' as const,
            licenseLevel: 'Director',
          },
          {
            id: 'EMP-002',
            employeeNumber: 'E002',
            name: 'John Davis',
            firstName: 'John',
            lastName: 'Davis',
            title: 'Embalmer',
            department: 'Operations',
            email: 'jdavis@dykstra.com',
            phone: '(555) 100-0002',
            hireDate: '2019-03-20',
            status: 'active' as const,
            licenseLevel: 'Embalmer',
          },
          {
            id: 'EMP-003',
            employeeNumber: 'E003',
            name: 'Michael Roberts',
            firstName: 'Michael',
            lastName: 'Roberts',
            title: 'Staff Member',
            department: 'Operations',
            email: 'mroberts@dykstra.com',
            phone: '(555) 100-0003',
            hireDate: '2021-06-10',
            status: 'active' as const,
            licenseLevel: 'Staff',
          },
          {
            id: 'EMP-004',
            employeeNumber: 'E004',
            name: 'Emily Johnson',
            firstName: 'Emily',
            lastName: 'Johnson',
            title: 'Accountant',
            department: 'Finance',
            email: 'ejohnson@dykstra.com',
            phone: '(555) 100-0004',
            hireDate: '2020-09-01',
            status: 'active' as const,
          },
          {
            id: 'EMP-005',
            employeeNumber: 'E005',
            name: 'David Wilson',
            firstName: 'David',
            lastName: 'Wilson',
            title: 'Office Manager',
            department: 'Admin',
            email: 'dwilson@dykstra.com',
            phone: '(555) 100-0005',
            hireDate: '2018-11-15',
            status: 'active' as const,
          },
          {
            id: 'EMP-006',
            employeeNumber: 'E006',
            name: 'Jennifer Garcia',
            firstName: 'Jennifer',
            lastName: 'Garcia',
            title: 'Funeral Director',
            department: 'Operations',
            email: 'jgarcia@dykstra.com',
            phone: '(555) 100-0006',
            hireDate: '2024-12-01',
            status: 'onboarding' as const,
            licenseLevel: 'Director',
          },
          {
            id: 'EMP-007',
            employeeNumber: 'E007',
            name: 'Robert Taylor',
            firstName: 'Robert',
            lastName: 'Taylor',
            title: 'Driver',
            department: 'Operations',
            email: 'rtaylor@dykstra.com',
            phone: '(555) 100-0007',
            hireDate: '2017-05-20',
            status: 'offboarding' as const,
            licenseLevel: 'Driver',
          },
        ];

        let filtered = allEmployees;

        // Filter by status
        if (input.status !== 'all') {
          filtered = filtered.filter((e) => e.status === input.status);
        }

        // Filter by department
        if (input.department !== 'all') {
          filtered = filtered.filter((e) => e.department === input.department);
        }

        return filtered;
      }),

    /**
     * Get employee by ID
     */
    getById: staffProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        // Mock implementation - will be replaced with Go backend integration
        const employee = {
          id: input.id,
          employeeNumber: 'E001',
          firstName: 'Sarah',
          lastName: 'Martinez',
          email: 'smartinez@dykstra.com',
          phone: '(555) 100-0001',
          hireDate: new Date('2020-01-15'),
          status: 'active' as const,
          positionId: 'POS-001',
          positionTitle: 'Funeral Director',
          department: 'Operations',
        };
        return employee;
      }),

    /**
     * Hire new employee (with Go backend integration)
     */
    hire: staffProcedure
      .input(
        z.object({
          firstName: z.string().min(1),
          lastName: z.string().min(1),
          email: z.string().email(),
          hireDate: z.date(),
          positionId: z.string(),
          positionTitle: z.string().min(1),
          department: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        const result = await runEffect(
          startEmployeeOnboarding({
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            hireDate: input.hireDate,
            positionId: input.positionId,
            positionTitle: input.positionTitle,
            department: input.department,
          })
        );

        return {
          id: result.employeeId,
          employeeNumber: result.employeeNumber,
          fullName: result.fullName,
          hireDate: result.hireDate,
          onboardingStatus: result.status,
          tasksTotal: result.tasksTotal,
          tasksCompleted: result.tasksCompleted,
        };
      }),
  }),
});
