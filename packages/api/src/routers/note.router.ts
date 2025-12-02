import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { runEffect } from '../utils/effect-runner';
import {
  listNotes,
  getNoteHistory,
  createNote,
  updateNote,
  deleteNote,
} from '@dykstra/application';

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
    .query(async ({ ctx, input }) => {
      const result = await runEffect(
        listNotes({ caseId: input.caseId, funeralHomeId: ctx.user.funeralHomeId! })
      );
      return result.notes;
    }),

  /**
   * Get note history (all versions)
   */
  getHistory: staffProcedure
    .input(z.object({ businessKey: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await runEffect(
        getNoteHistory({ businessKey: input.businessKey, funeralHomeId: ctx.user.funeralHomeId! })
      );
      return result.history;
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
      return await runEffect(
        createNote({
          caseId: input.caseId,
          funeralHomeId: ctx.user.funeralHomeId!,
          content: input.content,
          createdBy: ctx.user.id,
        })
      );
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
      return await runEffect(
        updateNote({
          businessKey: input.businessKey,
          funeralHomeId: ctx.user.funeralHomeId!,
          content: input.content,
          updatedBy: ctx.user.id,
        })
      );
    }),

  /**
   * Delete note (SCD2: soft delete by marking isCurrent=false)
   * Note: This is append-only, never physically deletes
   */
  delete: staffProcedure
    .input(z.object({ businessKey: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await runEffect(
        deleteNote({ businessKey: input.businessKey, funeralHomeId: ctx.user.funeralHomeId! })
      );
    }),
});
