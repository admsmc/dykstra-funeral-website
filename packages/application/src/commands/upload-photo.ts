import { Effect } from 'effect';
import { Photo, PhotoUploaded, type ValidationError, type PhotoId, type MemorialId } from '@dykstra/domain';
import { PhotoRepository, type PersistenceError } from '../ports/photo-repository';
import { StoragePort, type StorageError } from '../ports/storage-port';
import { EventPublisher, type EventPublishError } from '../ports/event-publisher';

/**
 * Upload Photo command
 */
export interface UploadPhotoCommand {
  readonly id: PhotoId;
  readonly memorialId: MemorialId;
  readonly caseId: string;
  readonly file: {
    readonly data: Buffer;
    readonly name: string;
    readonly mimeType: string;
    readonly size: number;
  };
  readonly caption?: string;
  readonly uploadedBy: string;
  readonly width?: number;
  readonly height?: number;
}

/**
 * Upload Photo command handler
 * Uploads a photo to storage and creates a Photo entity with SCD Type 2 support
 */
export const uploadPhoto = (
  command: UploadPhotoCommand
): Effect.Effect<
  Photo,
  ValidationError | StorageError | PersistenceError | EventPublishError,
  PhotoRepository | StoragePort | EventPublisher
> =>
  Effect.gen(function* (_) {
    // Get dependencies
    const photoRepo = yield* _(PhotoRepository);
    const storagePort = yield* _(StoragePort);
    const eventPublisher = yield* _(EventPublisher);
    
    // For SCD2, businessKey is the same as the initial ID
    const businessKey = command.id;
    
    // Upload file to storage
    const uploadResult = yield* _(
      storagePort.upload({
        data: command.file.data,
        name: command.file.name,
        folder: `photos/${command.memorialId}`,
        mimeType: command.file.mimeType,
      })
    );
    
    // Create photo entity
    // Default dimensions if not provided (will be extracted from image in production)
    const width = command.width ?? 1920;
    const height = command.height ?? 1080;
    
    const photo = yield* _(
      Photo.create({
        id: command.id,
        businessKey,
        memorialId: command.memorialId,
        caseId: command.caseId,
        url: uploadResult.url,
        storageKey: uploadResult.key,
        caption: command.caption,
        uploadedBy: command.uploadedBy,
        metadata: {
          width,
          height,
          mimeType: command.file.mimeType,
          size: command.file.size,
        },
      })
    );
    
    // Persist photo
    yield* _(photoRepo.save(photo));
    
    // Publish domain event
    yield* _(
      eventPublisher.publish(
        new PhotoUploaded({
          occurredAt: new Date(),
          aggregateId: photo.id,
          memorialId: photo.memorialId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type conversion for branded CaseId
          caseId: photo.caseId as any,
          uploadedBy: photo.uploadedBy,
          uploadedByName: photo.uploadedBy, // Using uploadedBy as name for now
        })
      )
    );
    
    return photo;
  });
