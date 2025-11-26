import { Effect } from 'effect';

/**
 * Task Status
 */
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

/**
 * Task - Domain Model
 */
export interface Task {
  id: string;
  caseId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: Date | null;
  completedAt: Date | null;
  createdBy: string;
  assignedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Task with user details
 */
export interface TaskWithUsers extends Task {
  creator: {
    name: string;
  };
  assignee: {
    name: string;
  } | null;
}

/**
 * Custom errors for Task operations
 */
export class TaskNotFoundError {
  readonly _tag = 'TaskNotFoundError';
  constructor(readonly taskId: string) {}
}

export class TaskValidationError {
  readonly _tag = 'TaskValidationError';
  constructor(readonly message: string) {}
}

/**
 * Task Repository Port
 * Defines operations for managing tasks
 */
export interface TaskRepository {
  /**
   * Find tasks by case ID
   */
  findByCase(caseId: string): Effect.Effect<TaskWithUsers[], never, never>;

  /**
   * Find task by ID
   */
  findById(taskId: string): Effect.Effect<Task | null, never, never>;

  /**
   * Create a new task
   */
  create(data: {
    caseId: string;
    title: string;
    description: string | null;
    assignedTo: string | null;
    dueDate: Date | null;
    createdBy: string;
  }): Effect.Effect<TaskWithUsers, never, never>;

  /**
   * Update task status
   */
  updateStatus(data: {
    taskId: string;
    status: TaskStatus;
  }): Effect.Effect<Task, TaskNotFoundError, never>;
}

export const TaskRepository = Effect.Tag<TaskRepository>('TaskRepository');
