import { z } from 'zod';
import { Effect } from 'effect';
import { router, familyProcedure, staffProcedure, publicProcedure } from '../trpc';
import { deletePhoto, getPhotos, getPhotoById, PhotoRepository } from '@dykstra/application';
import { runEffect } from '../utils/effect-runner';

/**
 * Photo router
 * Note: File upload (multipart) handled by separate Next.js API route
 */
export const photoRouter = router({
  /**
   * Get photos by memorial (public if memorial is public)
   */
  getByMemorial: publicProcedure
    .input(
      z.object({
        memorialId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const results = await runEffect(
        getPhotos({
          memorialId: input.memorialId as any, // MemorialId brand
        })
      );

      return results.map((result) => ({
        id: result.photo.id,
        businessKey: result.photo.businessKey,
        version: result.photo.version,
        memorialId: result.photo.memorialId,
        caseId: result.photo.caseId,
        url: result.photo.url,
        caption: result.photo.caption,
        uploadedBy: result.photo.uploadedBy,
        uploadedAt: result.photo.uploadedAt,
        width: result.photo.metadata.width,
        height: result.photo.metadata.height,
        mimeType: result.photo.metadata.mimeType,
        fileSize: result.photo.metadata.size,
        formattedFileSize: result.formattedFileSize,
        hasCaption: result.hasCaption,
        createdAt: result.photo.createdAt,
      }));
    }),

  /**
   * Get photos by case (family/staff only)
   */
  getByCase: familyProcedure
    .input(
      z.object({
        caseId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const results = await runEffect(
        getPhotos({
          caseId: input.caseId,
        })
      );

      return results.map((result) => ({
        id: result.photo.id,
        businessKey: result.photo.businessKey,
        version: result.photo.version,
        memorialId: result.photo.memorialId,
        caseId: result.photo.caseId,
        url: result.photo.url,
        caption: result.photo.caption,
        uploadedBy: result.photo.uploadedBy,
        uploadedAt: result.photo.uploadedAt,
        width: result.photo.metadata.width,
        height: result.photo.metadata.height,
        mimeType: result.photo.metadata.mimeType,
        fileSize: result.photo.metadata.size,
        formattedFileSize: result.formattedFileSize,
        hasCaption: result.hasCaption,
        createdAt: result.photo.createdAt,
      }));
    }),

  /**
   * Get single photo by ID
   */
  getById: publicProcedure
    .input(
      z.object({
        photoId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const result = await runEffect(
        getPhotoById(input.photoId as any) // PhotoId brand
      );

      return {
        id: result.photo.id,
        businessKey: result.photo.businessKey,
        version: result.photo.version,
        memorialId: result.photo.memorialId,
        caseId: result.photo.caseId,
        url: result.photo.url,
        storageKey: result.photo.storageKey,
        caption: result.photo.caption,
        uploadedBy: result.photo.uploadedBy,
        uploadedAt: result.photo.uploadedAt,
        width: result.photo.metadata.width,
        height: result.photo.metadata.height,
        mimeType: result.photo.metadata.mimeType,
        fileSize: result.photo.metadata.size,
        formattedFileSize: result.formattedFileSize,
        hasCaption: result.hasCaption,
        createdAt: result.photo.createdAt,
        updatedAt: result.photo.updatedAt,
      };
    }),

  /**
   * Get photo history (staff only) - SCD Type 2 temporal query
   */
  getHistory: staffProcedure
    .input(
      z.object({
        businessKey: z.string(),
      })
    )
    .query(async ({ input }) => {
      const results = await runEffect(
        getPhotos({
          photoId: input.businessKey as any, // Will be resolved by findHistory
          includeHistory: true,
        })
      );

      return results.map((result) => ({
        id: result.photo.id,
        businessKey: result.photo.businessKey,
        version: result.photo.version,
        caption: result.photo.caption,
        uploadedAt: result.photo.uploadedAt,
        createdAt: result.photo.createdAt,
        updatedAt: result.photo.updatedAt,
        versions: result.versions?.map((v) => ({
          version: v.version,
          caption: v.caption,
          updatedAt: v.updatedAt,
        })),
      }));
    }),

  /**
   * Update photo caption
   * Creates new version via domain entity's updateCaption method
   */
  updateCaption: familyProcedure
    .input(
      z.object({
        photoId: z.string(),
        caption: z.string().max(500),
      })
    )
    .mutation(async ({ input }) => {
      // Use PhotoRepository from Effect context
      const result: any = await runEffect(
        Effect.gen(function* () {
          const repo: any = yield* PhotoRepository;
          const currentPhoto: any = yield* repo.findById(input.photoId as any);
          const updatedPhoto: any = yield* currentPhoto.updateCaption(input.caption);
          const saved: any = yield* repo.save(updatedPhoto);
          return saved;
        }) as any
      );

      return {
        id: result.id,
        businessKey: result.businessKey,
        version: result.version,
        caption: result.caption,
        updatedAt: result.updatedAt,
      };
    }),

  /**
   * Delete photo (soft delete with storage cleanup)
   */
  delete: familyProcedure
    .input(
      z.object({
        photoId: z.string(),
        verifyOwnership: z.boolean().optional().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await runEffect(
        deletePhoto({
          photoId: input.photoId as any, // PhotoId brand
          deletedBy: ctx.user.id,
          verifyOwnership: input.verifyOwnership,
        })
      );

      return { success: true };
    }),
});
