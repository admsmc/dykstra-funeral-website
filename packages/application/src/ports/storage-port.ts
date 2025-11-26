import { Effect, Context } from 'effect';

/**
 * Storage error
 */
export class StorageError extends Error {
  readonly _tag = 'StorageError';
  constructor(override readonly message: string, override readonly cause?: unknown) {
    super(message, { cause });
  }
}

/**
 * File upload data
 */
export interface FileUpload {
  readonly data: Buffer;
  readonly name: string;
  readonly folder: string;
  readonly mimeType: string;
}

/**
 * Upload result
 */
export interface UploadResult {
  readonly url: string;
  readonly key: string;
}

/**
 * Storage Port
 * Abstraction for file storage (S3, Vercel Blob, etc.)
 */
export interface StoragePort {
  /**
   * Upload a file
   */
  readonly upload: (file: FileUpload) => Effect.Effect<UploadResult, StorageError>;
  
  /**
   * Delete a file
   */
  readonly delete: (key: string) => Effect.Effect<void, StorageError>;
  
  /**
   * Get a signed URL for temporary access
   */
  readonly getSignedUrl: (key: string, expiresIn: number) => Effect.Effect<string, StorageError>;
}

/**
 * Storage Port service tag for dependency injection
 */
export const StoragePort = Context.GenericTag<StoragePort>('@dykstra/StoragePort');
