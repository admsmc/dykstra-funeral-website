import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

/**
 * Internal Notes Router
 * Staff-only case notes with SCD2 temporal tracking
 * 
 * SCD2 Pattern:
 * - Create: Insert new note with version=1, isCurrent=true
 * - Update: Set current version isCurrent=false, validTo=now, insert new version
 * - Delete: Soft delete by setting isCurrent=false (append-only, no physical delete)
 * - List: Query where isCurrent=true
 * - History: Query all versions ordered by version desc
 */

export const noteRouter = router({
  /**
   * List current notes for a case
   */
  listByCaseId: staffProcedure
    .input(z.object({ caseId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const notes = await prisma.internalNote.findMany({
        where: {
          caseId: input.caseId,
          isCurrent: true, // Only current versions
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
        content: note.content,
        createdBy: {
          name: note.creator.name,
          email: note.creator.email,
        },
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      }));
    }),

  /**
   * Get note history (all versions)
   */
  getHistory: staffProcedure
    .input(z.object({ businessKey: z.string() }))
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const history = await prisma.internalNote.findMany({
        where: {
          businessKey: input.businessKey,
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
    }),

  /**
   * Create a new note (SCD2: initial version)
   */
  create: staffProcedure
    .input(
      z.object({
        caseId: z.string(),
        content: z.string().min(1).max(10000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      // Generate unique businessKey
      const businessKey = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const note = await prisma.internalNote.create({
        data: {
          businessKey,
          version: 1,
          caseId: input.caseId,
          content: input.content,
          createdBy: ctx.user.id,
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
        content: note.content,
        createdBy: {
          name: note.creator.name,
          email: note.creator.email,
        },
        createdAt: note.createdAt,
      };
    }),

  /**
   * Update note (SCD2: close current version, create new version)
   */
  update: staffProcedure
    .input(
      z.object({
        businessKey: z.string(),
        content: z.string().min(1).max(10000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      return await prisma.$transaction(async (tx: typeof prisma) => {
        // 1. Find current version
        const currentNote = await tx.internalNote.findFirst({
          where: {
            businessKey: input.businessKey,
            isCurrent: true,
          },
        });

        if (!currentNote) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Note not found or already deleted',
          });
        }

        // 2. Close current version (SCD2 temporal closure)
        const now = new Date();
        await tx.internalNote.update({
          where: { id: currentNote.id },
          data: {
            isCurrent: false,
            validTo: now,
          },
        });

        // 3. Create new version
        const newNote = await tx.internalNote.create({
          data: {
            businessKey: input.businessKey,
            version: currentNote.version + 1,
            caseId: currentNote.caseId,
            content: input.content,
            createdBy: ctx.user.id,
            createdAt: currentNote.createdAt, // Preserve original creation time
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
          content: newNote.content,
          createdBy: {
            name: newNote.creator.name,
            email: newNote.creator.email,
          },
          updatedAt: newNote.updatedAt,
        };
      });
    }),

  /**
   * Delete note (SCD2: soft delete by marking isCurrent=false)
   * Note: This is append-only, never physically deletes
   */
  delete: staffProcedure
    .input(z.object({ businessKey: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      return await prisma.$transaction(async (tx: typeof prisma) => {
        // Find current version
        const currentNote = await tx.internalNote.findFirst({
          where: {
            businessKey: input.businessKey,
            isCurrent: true,
          },
        });

        if (!currentNote) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Note not found or already deleted',
          });
        }

        // Soft delete: mark as not current and set validTo
        await tx.internalNote.update({
          where: { id: currentNote.id },
          data: {
            isCurrent: false,
            validTo: new Date(),
          },
        });

        return { success: true };
      });
    }),
});
