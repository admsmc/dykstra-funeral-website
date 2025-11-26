import { Effect } from 'effect';
import { prisma } from './prisma-client';
import type {
  TaskRepository,
  Task,
  TaskStatus,
  TaskNotFoundError,
} from '@dykstra/application';

/**
 * Prisma implementation of Task Repository
 */
export const PrismaTaskRepository: TaskRepository = {
  findByCase: (caseId: string) =>
    Effect.tryPromise({
      try: async () => {
        const tasks = await prisma.task.findMany({
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

        return tasks.map((task: any) => ({
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
    }).pipe(Effect.orDie),

  findById: (taskId: string) =>
    Effect.tryPromise({
      try: async () => {
        const task = await prisma.task.findUnique({
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
    }).pipe(Effect.orDie),

  create: (data: {
    caseId: string;
    title: string;
    description: string | null;
    assignedTo: string | null;
    dueDate: Date | null;
    createdBy: string;
  }) =>
    Effect.tryPromise({
      try: async () => {
        const task = await prisma.task.create({
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
    }).pipe(Effect.orDie),

  updateStatus: (data: {
    taskId: string;
    status: TaskStatus;
  }) =>
    Effect.tryPromise({
      try: async () => {
        const task = await prisma.task.update({
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
          return { _tag: 'TaskNotFoundError', taskId: data.taskId } as TaskNotFoundError;
        }
        throw new Error(`Failed to update task: ${error}`);
      },
    }).pipe(
      Effect.flatMap((result: any) =>
        typeof result === 'object' && result !== null && '_tag' in result && result._tag === 'TaskNotFoundError'
          ? Effect.fail(result as TaskNotFoundError)
          : Effect.succeed(result as Task)
      )
    ),
};
