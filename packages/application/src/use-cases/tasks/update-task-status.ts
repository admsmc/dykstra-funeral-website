import { Effect } from 'effect';
import { TaskRepository, TaskStatus, TaskNotFoundError } from '../../ports/task-repository';

export interface UpdateTaskStatusCommand {
  taskId: string;
  status: TaskStatus;
}

export interface UpdateTaskStatusResult {
  id: string;
  status: string;
}

/**
 * Update task status
 * Automatically sets completedAt when status is COMPLETED
 */
export const updateTaskStatus = (
  command: UpdateTaskStatusCommand
): Effect.Effect<UpdateTaskStatusResult, TaskNotFoundError, TaskRepository> =>
  Effect.gen(function* () {
    const taskRepo = yield* TaskRepository;

    const task = yield* taskRepo.updateStatus({
      taskId: command.taskId,
      status: command.status,
    });

    return {
      id: task.id,
      status: task.status,
    };
  });
