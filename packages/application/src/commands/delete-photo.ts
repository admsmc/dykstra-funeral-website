import { Effect } from 'effect';
import { PhotoDeleted, NotFoundError, AuthorizationError, type PhotoId } from '@dykstra/domain';
import { PhotoRepository, PersistenceError } from '../ports/photo-repository';
import { StoragePort, StorageError } from '../ports/storage-port';
import { EventPublisher, EventPublishError } from '../ports/event-publisher';

/**
 * Delete Photo command
 */
export interface DeletePhotoCommand {
  readonly photoId: PhotoId;
  readonly deletedBy: string;
  readonly verifyOwnership?: boolean; // If true, check that deletedBy is the uploader
}

/**
 * Delete Photo command handler
 * Soft deletes a photo (SCD Type 2) and removes it from storage
 */
export const deletePhoto = (
  command: DeletePhotoCommand
): Effect.Effect<
  void,
  NotFoundError | AuthorizationError | StorageError | PersistenceError | EventPublishError,
  PhotoRepository | StoragePort | EventPublisher
> =>
  Effect.gen(function* (_) {
    // Get dependencies
    const photoRepo = yield* _(PhotoRepository);
    const storagePort = yield* _(StoragePort);
    const eventPublisher = yield* _(EventPublisher);
    
    // Load current photo to get businessKey and storageKey
    const photo = yield* _(photoRepo.findById(command.photoId));
    
    // Verify ownership if requested
    if (command.verifyOwnership && photo.uploadedBy !== command.deletedBy) {
      yield* _(
        Effect.fail(
          new AuthorizationError({
            message: 'Only the photo uploader can delete this photo',
            userId: command.deletedBy,
            resource: 'Photo',
            resourceId: command.photoId,
          })
        )
      );
    }
    
    // Soft delete photo (SCD Type 2 - closes current version)
    yield* _(photoRepo.delete(photo.businessKey));
    
    // Delete from storage
    yield* _(storagePort.delete(photo.storageKey));
    
    // Publish domain event
    yield* _(
      eventPublisher.publish(
        new PhotoDeleted({
          occurredAt: new Date(),
          aggregateId: photo.id,
          memorialId: photo.memorialId,
          caseId: photo.caseId as any, // Type conversion for CaseId
          deletedBy: command.deletedBy,
        })
      )
    );
  });
