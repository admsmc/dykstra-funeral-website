import { Effect } from 'effect';
import { Photo, type PhotoId, type MemorialId, NotFoundError } from '@dykstra/domain';
import { PhotoRepository, PersistenceError } from '../ports/photo-repository';

/**
 * Get Photos query
 */
export interface GetPhotosQuery {
  readonly memorialId?: MemorialId;
  readonly caseId?: string;
  readonly uploaderId?: string;
  readonly photoId?: PhotoId;
  readonly includeHistory?: boolean; // If true and photoId provided, return all versions
}

/**
 * Photo result with computed metadata
 */
export interface PhotoResult {
  readonly photo: Photo;
  readonly formattedFileSize: string;
  readonly hasCaption: boolean;
  readonly versions?: Photo[]; // Only populated if includeHistory=true
}

/**
 * Get Photos query handler
 * Retrieves photos by various criteria
 */
export const getPhotos = (
  query: GetPhotosQuery
): Effect.Effect<
  PhotoResult[],
  NotFoundError | PersistenceError,
  PhotoRepository
> =>
  Effect.gen(function* (_) {
    const photoRepo = yield* _(PhotoRepository);
    
    // Fetch photos based on query criteria
    let photos: readonly Photo[];
    
    if (query.photoId) {
      // Single photo lookup
      const photo = yield* _(photoRepo.findById(query.photoId));
      photos = [photo];
      
      // If includeHistory, fetch all versions
      if (query.includeHistory) {
        const history = yield* _(photoRepo.findHistory(photo.businessKey));
        return [...history].map(p => ({
          photo: p,
          formattedFileSize: p.getFormattedFileSize(),
          hasCaption: p.hasCaption(),
          versions: [...history],
        }));
      }
    } else if (query.memorialId) {
      // Photos by memorial
      photos = yield* _(photoRepo.findByMemorial(query.memorialId));
    } else if (query.caseId) {
      // Photos by case
      photos = yield* _(photoRepo.findByCase(query.caseId));
    } else if (query.uploaderId) {
      // Photos by uploader
      photos = yield* _(photoRepo.findByUploader(query.uploaderId));
    } else {
      // No valid criteria provided
      return [];
    }
    
    // Map to results with computed metadata
    return photos.map(photo => ({
      photo,
      formattedFileSize: photo.getFormattedFileSize(),
      hasCaption: photo.hasCaption(),
    }));
  });

/**
 * Get single photo by ID
 * Convenience function for single photo lookups
 */
export const getPhotoById = (
  photoId: PhotoId
): Effect.Effect<
  PhotoResult,
  NotFoundError | PersistenceError,
  PhotoRepository
> =>
  Effect.gen(function* (_) {
    const results = yield* _(getPhotos({ photoId }));
    if (results.length === 0 || !results[0]) {
      return yield* _(
        Effect.fail(
          new NotFoundError({
            message: `Photo with ID ${photoId} not found`,
            entityType: 'Photo',
            entityId: photoId,
          })
        )
      );
    }
    return results[0];
  });
