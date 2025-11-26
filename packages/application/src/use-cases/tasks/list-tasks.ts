import { Effect } from 'effect';
import { TaskRepository } from '../../ports/task-repository';

export interface ListTasksQuery {
  caseId: string;
}

export interface ListTasksResult {
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    dueDate: Date | null;
    completedAt: Date | null;
    createdBy: string;
    assignedTo: string | null;
    createdAt: Date;
  }>;
}

/**
 * List tasks for a case
 * Ordered by status (pending first), then due date
 */
export const listTasks = (query: ListTasksQuery): Effect.Effect<
  ListTasksResult,
  never,
  TaskRepository
> =>
  Effect.gen(function* () {
    const taskRepo = yield* TaskRepository;
    const tasks = yield* taskRepo.findByCase(query.caseId);

    return {
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        dueDate: task.dueDate,
        completedAt: task.completedAt,
        createdBy: task.creator.name,
        assignedTo: task.assignee?.name || null,
        createdAt: task.createdAt,
      })),
    };
  });
