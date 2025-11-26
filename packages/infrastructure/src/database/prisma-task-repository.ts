import { Effect } from 'effect';
import { PrismaClient } from '@prisma/client';
import {
  TaskRepository,
  Task,
  TaskWithUsers,
  TaskStatus,
  TaskNotFoundError,
} from '@dykstra/application/ports/task-repository';

export class PrismaTaskRepository implements TaskRepository {
  constructor(private prisma: PrismaClient) {}

  findByCase(caseId: string): Effect.Effect<TaskWithUsers[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const tasks = await this.prisma.task.findMany({
          where: { caseId },
          include: {
            creator: {
              select: {
                name: true,
              },
            },
            assignee: {
              select: {
                name: true,
              },
            },
          },
          orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
        });

        return tasks.map((task) => ({
          id: task.id,
          caseId: task.caseId,
          title: task.title,
          description: task.description,
          status: task.status as TaskStatus,
          dueDate: task.dueDate,
          completedAt: task.completedAt,
          createdBy: task.createdBy,
          assignedTo: task.assignedTo,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          creator: {
            name: task.creator.name,
          },
          assignee: task.assignee
            ? {
                name: task.assignee.name,
              }
            : null,
        }));
      },
      catch: (error) => new Error(`Failed to fetch tasks: ${error}`),
    }).pipe(Effect.orDie);
  }

  findById(taskId: string): Effect.Effect<Task | null, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const task = await this.prisma.task.findUnique({
          where: { id: taskId },
        });

        if (!task) return null;

        return {
          id: task.id,
          caseId: task.caseId,
          title: task.title,
          description: task.description,
          status: task.status as TaskStatus,
          dueDate: task.dueDate,
          completedAt: task.completedAt,
          createdBy: task.createdBy,
          assignedTo: task.assignedTo,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        };
      },
      catch: (error) => new Error(`Failed to find task: ${error}`),
    }).pipe(Effect.orDie);
  }

  create(data: {
    caseId: string;
    title: string;
    description: string | null;
    assignedTo: string | null;
    dueDate: Date | null;
    createdBy: string;
  }): Effect.Effect<TaskWithUsers, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const task = await this.prisma.task.create({
          data: {
            caseId: data.caseId,
            title: data.title,
            description: data.description,
            assignedTo: data.assignedTo,
            dueDate: data.dueDate,
            createdBy: data.createdBy,
            status: 'PENDING',
          },
          include: {
            creator: {
              select: {
                name: true,
              },
            },
            assignee: {
              select: {
                name: true,
              },
            },
          },
        });

        return {
          id: task.id,
          caseId: task.caseId,
          title: task.title,
          description: task.description,
          status: task.status as TaskStatus,
          dueDate: task.dueDate,
          completedAt: task.completedAt,
          createdBy: task.createdBy,
          assignedTo: task.assignedTo,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          creator: {
            name: task.creator.name,
          },
          assignee: task.assignee
            ? {
                name: task.assignee.name,
              }
            : null,
        };
      },
      catch: (error) => new Error(`Failed to create task: ${error}`),
    }).pipe(Effect.orDie);
  }

  updateStatus(data: {
    taskId: string;
    status: TaskStatus;
  }): Effect.Effect<Task, TaskNotFoundError, never> {
    return Effect.tryPromise({
      try: async () => {
        const task = await this.prisma.task.update({
          where: { id: data.taskId },
          data: {
            status: data.status,
            completedAt: data.status === 'COMPLETED' ? new Date() : null,
          },
        });

        return {
          id: task.id,
          caseId: task.caseId,
          title: task.title,
          description: task.description,
          status: task.status as TaskStatus,
          dueDate: task.dueDate,
          completedAt: task.completedAt,
          createdBy: task.createdBy,
          assignedTo: task.assignedTo,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        };
      },
      catch: (error: any) => {
        if (error?.code === 'P2025') {
          return new TaskNotFoundError(data.taskId);
        }
        throw new Error(`Failed to update task: ${error}`);
      },
    }).pipe(
      Effect.flatMap((result) =>
        result instanceof TaskNotFoundError
          ? Effect.fail(result)
          : Effect.succeed(result)
      )
    );
  }
}
