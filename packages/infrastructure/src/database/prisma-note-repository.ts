import { Effect } from 'effect';
import { prisma } from './prisma-client';
import type {
  NoteRepository,
  Note,
  NoteNotFoundError,
} from '@dykstra/application';

/**
 * Prisma implementation of Note Repository
 * Handles SCD2 (Slowly Changing Dimension Type 2) pattern
 */
export const PrismaNoteRepository: NoteRepository = {
  findCurrentByCase: (caseId: string) =>
    Effect.tryPromise({
      try: async () => {
        const notes = await prisma.internalNote.findMany({
          where: {
            caseId,
            isCurrent: true,
          },
          include: {
            creator: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return notes.map((note: any) => ({
          id: note.id,
          businessKey: note.businessKey,
          version: note.version,
          caseId: note.caseId,
          content: note.content,
          createdBy: note.createdBy,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          validFrom: note.validFrom,
          validTo: note.validTo,
          isCurrent: note.isCurrent,
          creator: {
            name: note.creator.name,
            email: note.creator.email,
          },
        }));
      },
      catch: (error) => new Error(`Failed to fetch notes: ${error}`),
    }).pipe(Effect.orDie),

  findHistory: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const history = await prisma.internalNote.findMany({
          where: {
            businessKey,
          },
          include: {
            creator: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            version: 'desc',
          },
        });

        return history.map((note: any) => ({
          id: note.id,
          version: note.version,
          content: note.content,
          createdBy: note.creator.name,
          validFrom: note.validFrom,
          validTo: note.validTo,
          isCurrent: note.isCurrent,
        }));
      },
      catch: (error) => new Error(`Failed to fetch note history: ${error}`),
    }).pipe(Effect.orDie),

  findCurrentByBusinessKey: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const note = await prisma.internalNote.findFirst({
          where: {
            businessKey,
            isCurrent: true,
          },
        });

        if (!note) return null;

        return {
          id: note.id,
          businessKey: note.businessKey,
          version: note.version,
          caseId: note.caseId,
          content: note.content,
          createdBy: note.createdBy,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          validFrom: note.validFrom,
          validTo: note.validTo,
          isCurrent: note.isCurrent,
        };
      },
      catch: (error) => new Error(`Failed to find note: ${error}`),
    }).pipe(Effect.orDie),

  create: (data: {
    businessKey: string;
    caseId: string;
    content: string;
    createdBy: string;
  }) =>
    Effect.tryPromise({
      try: async () => {
        const note = await prisma.internalNote.create({
          data: {
            businessKey: data.businessKey,
            version: 1,
            caseId: data.caseId,
            content: data.content,
            createdBy: data.createdBy,
            isCurrent: true,
            validFrom: new Date(),
          },
          include: {
            creator: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        });

        return {
          id: note.id,
          businessKey: note.businessKey,
          version: note.version,
          caseId: note.caseId,
          content: note.content,
          createdBy: note.createdBy,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          validFrom: note.validFrom,
          validTo: note.validTo,
          isCurrent: note.isCurrent,
          creator: {
            name: note.creator.name,
            email: note.creator.email,
          },
        };
      },
      catch: (error) => new Error(`Failed to create note: ${error}`),
    }).pipe(Effect.orDie),

  createNewVersion: (data: {
    businessKey: string;
    content: string;
    createdBy: string;
    previousVersion: Note;
  }) =>
    Effect.tryPromise({
      try: async () => {
        return await prisma.$transaction(async (tx: any) => {
          // 1. Close current version (SCD2 temporal closure)
          const now = new Date();
          await tx.internalNote.update({
            where: { id: data.previousVersion.id },
            data: {
              isCurrent: false,
              validTo: now,
            },
          });

          // 2. Create new version
          const newNote = await tx.internalNote.create({
            data: {
              businessKey: data.businessKey,
              version: data.previousVersion.version + 1,
              caseId: data.previousVersion.caseId,
              content: data.content,
              createdBy: data.createdBy,
              createdAt: data.previousVersion.createdAt, // Preserve original creation time
              isCurrent: true,
              validFrom: now,
            },
            include: {
              creator: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          });

          return {
            id: newNote.id,
            businessKey: newNote.businessKey,
            version: newNote.version,
            caseId: newNote.caseId,
            content: newNote.content,
            createdBy: newNote.createdBy,
            createdAt: newNote.createdAt,
            updatedAt: newNote.updatedAt,
            validFrom: newNote.validFrom,
            validTo: newNote.validTo,
            isCurrent: newNote.isCurrent,
            creator: {
              name: newNote.creator.name,
              email: newNote.creator.email,
            },
          };
        });
      },
      catch: (error) => new Error(`Failed to update note: ${error}`),
    }).pipe(Effect.orDie),

  softDelete: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        await prisma.$transaction(async (tx: any) => {
          // Find current version
          const currentNote = await tx.internalNote.findFirst({
            where: {
              businessKey,
              isCurrent: true,
            },
          });

          if (!currentNote) {
            throw { _tag: 'NoteNotFoundError', businessKey } as NoteNotFoundError;
          }

          // Soft delete: mark as not current and set validTo
          await tx.internalNote.update({
            where: { id: currentNote.id },
            data: {
              isCurrent: false,
              validTo: new Date(),
            },
          });
        });
      },
      catch: (error) => {
        if (typeof error === 'object' && error !== null && '_tag' in error && error._tag === 'NoteNotFoundError') {
          return error as NoteNotFoundError;
        }
        throw new Error(`Failed to delete note: ${error}`);
      },
    }).pipe(
      Effect.flatMap((result: any) =>
        typeof result === 'object' && result !== null && '_tag' in result && result._tag === 'NoteNotFoundError'
          ? Effect.fail(result as NoteNotFoundError)
          : Effect.succeed(undefined)
      )
    ),
};
