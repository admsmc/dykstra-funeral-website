import { Effect, Data, Option } from 'effect';
import { ValidationError } from '../errors/domain-errors';

/**
 * Photo ID branded type
 */
export type PhotoId = string & { readonly _brand: 'PhotoId' };

/**
 * Memorial ID branded type
 */
export type MemorialId = string & { readonly _brand: 'MemorialId' };

/**
 * Photo metadata
 */
export interface PhotoMetadata {
  readonly width: number;
  readonly height: number;
  readonly mimeType: string;
  readonly size: number; // in bytes
}

/**
 * Photo entity
 * Represents a photo in a memorial gallery
 * SCD Type 2: Each modification creates a new version for audit trail
 */
export class Photo extends Data.Class<{
  readonly id: PhotoId;
  readonly businessKey: string;              // Immutable business identifier
  readonly version: number;                   // SCD2 version number
  readonly memorialId: MemorialId;
  readonly caseId: string;
  readonly url: string;                       // CDN/storage URL
  readonly storageKey: string;                // S3/Vercel Blob key for deletion
  readonly caption: Option.Option<string>;
  readonly uploadedBy: string;                // User ID
  readonly uploadedAt: Date;
  readonly metadata: PhotoMetadata;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}> {
  /**
   * Maximum file size (10MB)
   */
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024;
  
  /**
   * Allowed MIME types
   */
  private static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  
  /**
   * Maximum caption length
   */
  private static readonly MAX_CAPTION_LENGTH = 500;
  
  /**
   * Create a new Photo
   */
  static create(params: {
    id: string;
    businessKey: string;
    memorialId: string;
    caseId: string;
    url: string;
    storageKey: string;
    caption?: string;
    uploadedBy: string;
    metadata: PhotoMetadata;
  }): Effect.Effect<Photo, ValidationError> {
    return Effect.gen(function* (_) {
      // Validate URL
      if (!params.url || params.url.trim().length === 0) {
        return yield* _(Effect.fail(
          new ValidationError({ message: 'Photo URL is required', field: 'url' })
        ));
      }
      
      // Validate storage key
      if (!params.storageKey || params.storageKey.trim().length === 0) {
        return yield* _(Effect.fail(
          new ValidationError({ message: 'Storage key is required', field: 'storageKey' })
        ));
      }
      
      // Validate file size
      if (params.metadata.size > Photo.MAX_FILE_SIZE) {
        return yield* _(Effect.fail(
          new ValidationError({
            message: `File size exceeds maximum allowed (${Photo.MAX_FILE_SIZE / 1024 / 1024}MB)`,
            field: 'file',
          })
        ));
      }
      
      // Validate MIME type
      if (!Photo.ALLOWED_MIME_TYPES.includes(params.metadata.mimeType)) {
        return yield* _(Effect.fail(
          new ValidationError({
            message: `Invalid file type. Allowed types: ${Photo.ALLOWED_MIME_TYPES.join(', ')}`,
            field: 'file',
          })
        ));
      }
      
      // Validate dimensions
      if (params.metadata.width <= 0 || params.metadata.height <= 0) {
        return yield* _(Effect.fail(
          new ValidationError({
            message: 'Invalid image dimensions',
            field: 'file',
          })
        ));
      }
      
      // Validate caption if provided
      const caption = params.caption?.trim();
      if (caption && caption.length > Photo.MAX_CAPTION_LENGTH) {
        return yield* _(Effect.fail(
          new ValidationError({
            message: `Caption too long (max ${Photo.MAX_CAPTION_LENGTH} characters)`,
            field: 'caption',
          })
        ));
      }
      
      const now = new Date();
      
      return new Photo({
        id: params.id as PhotoId,
        businessKey: params.businessKey,
        version: 1,                             // Initial version
        memorialId: params.memorialId as MemorialId,
        caseId: params.caseId,
        url: params.url.trim(),
        storageKey: params.storageKey.trim(),
        caption: caption ? Option.some(caption) : Option.none(),
        uploadedBy: params.uploadedBy,
        uploadedAt: now,
        metadata: params.metadata,
        createdAt: now,
        updatedAt: now,
      });
    });
  }
  
  /**
   * Update photo caption
   * Returns a new Photo instance with incremented version (SCD2)
   */
  updateCaption(newCaption: string | null): Effect.Effect<Photo, ValidationError> {
    const self = this;
    return Effect.gen(function* (_) {
      // Validate caption
      const trimmedCaption = newCaption?.trim();
      
      if (trimmedCaption && trimmedCaption.length > Photo.MAX_CAPTION_LENGTH) {
        return yield* _(Effect.fail(
          new ValidationError({
            message: `Caption too long (max ${Photo.MAX_CAPTION_LENGTH} characters)`,
            field: 'caption',
          })
        ));
      }
      
      return new Photo({
        ...self,
        version: self.version + 1,              // Increment version (SCD2)
        caption: trimmedCaption ? Option.some(trimmedCaption) : Option.none(),
        updatedAt: new Date(),
      });
    });
  }
  
  /**
   * Check if photo has a caption
   */
  hasCaption(): boolean {
    return Option.isSome(this.caption);
  }
  
  /**
   * Get caption as string or null
   */
  getCaptionOrNull(): string | null {
    return Option.getOrNull(this.caption);
  }
  
  /**
   * Get human-readable file size
   */
  getFormattedFileSize(): string {
    const bytes = this.metadata.size;
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  }
  
  /**
   * Check if photo is an image (as opposed to video - for future extension)
   */
  isImage(): boolean {
    return this.metadata.mimeType.startsWith('image/');
  }
}
