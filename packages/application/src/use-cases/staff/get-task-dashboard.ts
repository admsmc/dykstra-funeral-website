import { Effect } from 'effect';
import { CaseRepository, type PersistenceError } from '../../ports/case-repository';
import { TaskRepository, type TaskWithUsers } from '../../ports/task-repository';

/**
 * Get Task Dashboard
 *
 * Policy Type: Type A
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A
 * Persisted In: N/A
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

export interface GetTaskDashboardQuery {
  funeralHomeId: string;
  assignedToUserId?: string;
}

export interface GetTaskDashboardResult {
  pending: TaskWithUsers[];
  inProgress: TaskWithUsers[];
  overdue: TaskWithUsers[];
}

/**
 * Get task dashboard
 * Shows tasks categorized by status and overdue state
 */
export const getTaskDashboard = (
  query: GetTaskDashboardQuery
): Effect.Effect<
  GetTaskDashboardResult,
  PersistenceError,
  CaseRepository | TaskRepository
> =>
  Effect.gen(function* () {
    const caseRepo = yield* CaseRepository;
    const taskRepo = yield* TaskRepository;

    // Get all current cases for the funeral home
    const allCases = yield* caseRepo.findByFuneralHome(query.funeralHomeId);

    // Get all tasks for these cases
    const allTasksEffects = allCases.map((c) => taskRepo.findByCase(c.id));
    const allTasksArrays = yield* Effect.all(allTasksEffects);
    const allTasks = allTasksArrays.flat();

    // Filter by assigned user if specified
    const filteredTasks = query.assignedToUserId
      ? allTasks.filter((t) => t.assignedTo === query.assignedToUserId)
      : allTasks;

    const now = new Date();

    // Categorize tasks
    const pending = filteredTasks
      .filter((t) => t.status === 'PENDING')
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.getTime() - b.dueDate.getTime();
      });

    const inProgress = filteredTasks
      .filter((t) => t.status === 'IN_PROGRESS')
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.getTime() - b.dueDate.getTime();
      });

    const overdue = filteredTasks
      .filter(
        (t) =>
          (t.status === 'PENDING' || t.status === 'IN_PROGRESS') &&
          t.dueDate &&
          t.dueDate < now
      )
      .sort((a, b) => {
        if (!a.dueDate || !b.dueDate) return 0;
        return a.dueDate.getTime() - b.dueDate.getTime();
      });

    return {
      pending,
      inProgress,
      overdue,
    };
  });
