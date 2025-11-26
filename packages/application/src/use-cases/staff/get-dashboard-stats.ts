import { Effect } from 'effect';
import { CaseRepository, PersistenceError } from '../../ports/case-repository';
import { TaskRepository } from '../../ports/task-repository';
import { PaymentRepository } from '../../ports/payment-repository';

export interface GetDashboardStatsQuery {
  funeralHomeId: string;
}

export interface GetDashboardStatsResult {
  kpis: {
    activeCases: number;
    inquiries: number;
    upcomingServices: number;
    pendingTasks: number;
  };
  recentActivity: {
    cases: Array<{
      id: string;
      businessKey: string;
      decedentName: string;
      type: string;
      status: string;
      serviceDate: Date | null;
      createdAt: Date;
    }>;
    payments: Array<{
      id: string;
      businessKey: string;
      amount: string;
      method: string;
      status: string;
      createdAt: Date;
      caseDecedentName: string;
    }>;
  };
}

/**
 * Get dashboard statistics for staff overview
 * Includes KPIs and recent activity
 */
export const getDashboardStats = (
  query: GetDashboardStatsQuery
): Effect.Effect<
  GetDashboardStatsResult,
  PersistenceError,
  CaseRepository | TaskRepository | PaymentRepository
> =>
  Effect.gen(function* () {
    const caseRepo = yield* CaseRepository;
    const taskRepo = yield* TaskRepository;
    const paymentRepo = yield* PaymentRepository;

    // Get all current cases for the funeral home
    const allCases = yield* caseRepo.findByFuneralHome(query.funeralHomeId);

    // Calculate KPIs
    const activeCasesCount = allCases.filter((c) => c.status === 'active').length;
    const inquiriesCount = allCases.filter((c) => c.status === 'inquiry').length;

    // Upcoming services (next 7 days)
    const now = new Date();
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const upcomingServicesCount = allCases.filter(
      (c) =>
        c.status === 'active' &&
        c.serviceDate &&
        c.serviceDate >= now &&
        c.serviceDate <= sevenDaysFromNow
    ).length;

    // Get pending tasks count across all cases
    const allTasksEffects = allCases.map((c) => taskRepo.findByCase(c.id));
    const allTasksArrays = yield* Effect.all(allTasksEffects);
    const allTasks = allTasksArrays.flat();
    const pendingTasksCount = allTasks.filter(
      (t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS'
    ).length;

    // Recent cases (last 10)
    const recentCases = [...allCases]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map((c) => ({
        id: c.id,
        businessKey: c.businessKey,
        decedentName: c.decedentName,
        type: c.type,
        status: c.status,
        serviceDate: c.serviceDate,
        createdAt: c.createdAt,
      }));

    // Recent payments (last 10)
    const allPaymentsEffects = allCases.map((c) => paymentRepo.findByCase(c.id));
    const allPaymentsArrays = yield* Effect.all(allPaymentsEffects);
    const allPayments = allPaymentsArrays.flat();
    const recentPayments = allPayments
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map((p) => {
        const caseData = allCases.find((c) => c.id === p.caseId);
        return {
          id: p.id,
          businessKey: p.businessKey,
          amount: p.amount.toString(),
          method: p.method,
          status: p.status,
          createdAt: p.createdAt,
          caseDecedentName: caseData?.decedentName || 'Unknown',
        };
      });

    return {
      kpis: {
        activeCases: activeCasesCount,
        inquiries: inquiriesCount,
        upcomingServices: upcomingServicesCount,
        pendingTasks: pendingTasksCount,
      },
      recentActivity: {
        cases: recentCases,
        payments: recentPayments,
      },
    };
  });
