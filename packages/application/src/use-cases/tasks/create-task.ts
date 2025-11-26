import { Effect } from 'effect';
import { TaskRepository } from '../../ports/task-repository';
import { ValidationError } from '@dykstra/domain';

export interface CreateTaskCommand {
  caseId: string;
  title: string;
  description?: string;
  assignedTo?: string;
  dueDate?: Date;
  createdBy: string;
}

export interface CreateTaskResult {
  id: string;
  title: string;
  status: string;
  assignedTo: string | null;
}

/**
 * Create a new task for a case
 */
export const createTask = (command: CreateTaskCommand): Effect.Effect<
  CreateTaskResult,
  ValidationError,
  TaskRepository
> =>
  Effect.gen(function* () {
    // Validate title
    if (!command.title || command.title.trim().length === 0) {
      return yield* Effect.fail(
        new ValidationError('Task title cannot be empty')
      );
    }

    if (command.title.length > 255) {
      return yield* Effect.fail(
        new ValidationError('Task title cannot exceed 255 characters')
      );
    }

    const taskRepo = yield* TaskRepository;

    const task = yield* taskRepo.create({
      caseId: command.caseId,
      title: command.title,
      description: command.description || null,
      assignedTo: command.assignedTo || null,
      dueDate: command.dueDate || null,
      createdBy: command.createdBy,
    });

    return {
      id: task.id,
      title: task.title,
      status: task.status,
      assignedTo: task.assignee?.name || null,
    };
  });
