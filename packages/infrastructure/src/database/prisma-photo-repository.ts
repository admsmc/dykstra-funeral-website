import { Effect, Layer } from 'effect';
import { Photo, type PhotoId, type MemorialId, NotFoundError } from '@dykstra/domain';
import type { PhotoRepository } from '@dykstra/application';
import { PersistenceError } from '@dykstra/application';
import { prisma } from './prisma-client';

/**
 * Map Prisma photo to domain Photo entity
 * SCD Type 2: Maps temporal fields to domain model
 */
const toDomain = (prismaPhoto: any): Photo => {
  return new Photo({
    id: prismaPhoto.id as PhotoId,
    businessKey: prismaPhoto.businessKey,
    version: prismaPhoto.version,
    memorialId: prismaPhoto.memorialId as MemorialId,
    caseId: prismaPhoto.caseId,
    url: prismaPhoto.url,
    storageKey: prismaPhoto.storageKey,
    caption: prismaPhoto.caption ?? null,
    uploadedBy: prismaPhoto.uploadedBy,
    uploadedAt: prismaPhoto.uploadedAt,
    metadata: {
      width: prismaPhoto.width,
      height: prismaPhoto.height,
      mimeType: prismaPhoto.mimeType,
      size: prismaPhoto.fileSize,
    },
    createdAt: prismaPhoto.createdAt,
    updatedAt: prismaPhoto.updatedAt,
  });
};

/**
 * Map domain Photo to Prisma format
 * SCD Type 2: Includes temporal fields for versioning
 */
const toPrisma = (photo: Photo, validFrom: Date = new Date()) => {
  return {
    id: photo.id,
    businessKey: photo.businessKey,
    version: photo.version,
    validFrom,
    validTo: null,                                  // New version is always current
    isCurrent: true,
    memorialId: photo.memorialId,
    caseId: photo.caseId,
    url: photo.url,
    storageKey: photo.storageKey,
    caption: photo.caption,
    uploadedBy: photo.uploadedBy,
    uploadedAt: photo.uploadedAt,
    width: photo.metadata.width,
    height: photo.metadata.height,
    fileSize: photo.metadata.size,
    mimeType: photo.metadata.mimeType,
    createdAt: photo.createdAt,
    updatedAt: photo.updatedAt,
  };
};

/**
 * Prisma implementation of PhotoRepository with SCD Type 2 temporal support
 */
export const PrismaPhotoRepository: PhotoRepository = {
  /**
   * Find current version of photo by business key
   * For backward compatibility, also accepts technical ID
   */
  findById: (id: PhotoId) =>
    Effect.tryPromise({
      try: async () => {
        // Try to find by technical ID first (for backward compatibility)
        let prismaPhoto = await prisma.photo.findUnique({
          where: { id },
        });
        
        // If not found by technical ID, try business key with isCurrent=true
        if (!prismaPhoto) {
          prismaPhoto = await prisma.photo.findFirst({
            where: {
              businessKey: id,
              isCurrent: true,
            },
          });
        }

        if (!prismaPhoto) {
          throw new NotFoundError({
            message: `Photo with ID ${id} not found`,
            entityType: 'Photo',
            entityId: id,
          });
        }

        return toDomain(prismaPhoto);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) {
          return error;
        }
        return new PersistenceError('Failed to find photo', error);
      },
    }),
  
  /**
   * Find photo as it existed at a specific point in time
   */
  findByIdAtTime: (businessKey: string, asOf: Date) =>
    Effect.tryPromise({
      try: async () => {
        const prismaPhoto = await prisma.photo.findFirst({
          where: {
            businessKey,
            validFrom: { lte: asOf },
            OR: [
              { validTo: { gt: asOf } },
              { validTo: null },
            ],
          },
        });

        if (!prismaPhoto) {
          throw new NotFoundError({
            message: `Photo ${businessKey} not found at ${asOf.toISOString()}`,
            entityType: 'Photo',
            entityId: businessKey,
          });
        }

        return toDomain(prismaPhoto);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) {
          return error;
        }
        return new PersistenceError('Failed to find photo at time', error);
      },
    }),
  
  /**
   * Find complete version history of a photo
   */
  findHistory: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const prismaPhotos = await prisma.photo.findMany({
          where: { businessKey },
          orderBy: { version: 'asc' },
        });

        if (prismaPhotos.length === 0) {
          throw new NotFoundError({
            message: `Photo ${businessKey} not found`,
            entityType: 'Photo',
            entityId: businessKey,
          });
        }

        return prismaPhotos.map(toDomain);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) {
          return error;
        }
        return new PersistenceError('Failed to find photo history', error);
      },
    }),
  
  /**
   * Find current versions of photos by memorial
   */
  findByMemorial: (memorialId: MemorialId) =>
    Effect.tryPromise({
      try: async () => {
        const prismaPhotos = await prisma.photo.findMany({
          where: {
            memorialId,
            isCurrent: true,                        // Only current versions
          },
          orderBy: { uploadedAt: 'desc' },
        });

        return prismaPhotos.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find photos by memorial', error),
    }),

  /**
   * Find current versions of photos by case
   */
  findByCase: (caseId: string) =>
    Effect.tryPromise({
      try: async () => {
        const prismaPhotos = await prisma.photo.findMany({
          where: {
            caseId,
            isCurrent: true,                        // Only current versions
          },
          orderBy: { uploadedAt: 'desc' },
        });

        return prismaPhotos.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find photos by case', error),
    }),
  
  /**
   * Find current versions of photos by uploader
   */
  findByUploader: (userId: string) =>
    Effect.tryPromise({
      try: async () => {
        const prismaPhotos = await prisma.photo.findMany({
          where: {
            uploadedBy: userId,
            isCurrent: true,                        // Only current versions
          },
          orderBy: { uploadedAt: 'desc' },
        });

        return prismaPhotos.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find photos by uploader', error),
    }),

  /**
   * Save photo - SCD Type 2 implementation
   * Creates new version instead of updating existing (for caption edits)
   */
  save: (photo: Photo) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();
        
        // Check if this is a new photo (version 1) or an update
        if (photo.version === 1) {
          // New photo - simple insert
          const data = toPrisma(photo, now);
          await prisma.photo.create({ data });
        } else {
          // Update (caption edit) - SCD Type 2 transaction
          await prisma.$transaction(async (tx: any) => {
            // Step 1: Close current version
            await tx.photo.updateMany({
              where: {
                businessKey: photo.businessKey,
                isCurrent: true,
              },
              data: {
                validTo: now,
                isCurrent: false,
              },
            });
            
            // Step 2: Insert new version
            const data = toPrisma(photo, now);
            await tx.photo.create({ data });
          });
        }
      },
      catch: (error) => new PersistenceError('Failed to save photo', error),
    }),

  /**
   * Delete photo - SCD Type 2 soft delete
   * Closes current version instead of physical deletion
   * Note: Storage cleanup handled separately by calling code
   */
  delete: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();
        
        // Close current version (soft delete)
        const result = await prisma.photo.updateMany({
          where: {
            businessKey,
            isCurrent: true,
          },
          data: {
            validTo: now,
            isCurrent: false,
          },
        });
        
        // Check if any record was updated
        if (result.count === 0) {
          throw new NotFoundError({
            message: `Photo ${businessKey} not found`,
            entityType: 'Photo',
            entityId: businessKey,
          });
        }
      },
      catch: (error) => {
        if (error instanceof NotFoundError) {
          return error;
        }
        return new PersistenceError('Failed to delete photo', error);
      },
    }),
};

/**
 * Effect Layer to provide PhotoRepository
 */
export const PrismaPhotoRepositoryLive = Layer.succeed(
  (await import('@dykstra/application')).PhotoRepository,
  PrismaPhotoRepository
);
