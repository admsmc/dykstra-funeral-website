import { Effect, Data } from 'effect';
import { ValidationError } from '../errors/domain-errors';
import type { CaseId } from './case';

/**
 * Document ID branded type
 */
export type DocumentId = string & { readonly _brand: 'DocumentId' };

/**
 * Document type enum
 */
export type DocumentType = 'contract' | 'death_certificate' | 'service_program' | 'insurance_document' | 'receipt' | 'other';

/**
 * Document status enum
 */
export type DocumentStatus = 'active' | 'archived' | 'deleted';

/**
 * Document entity
 * Represents a document attached to a case (contracts, certificates, programs, receipts, etc.)
 */
export class Document extends Data.Class<{
  readonly id: DocumentId;
  readonly caseId: CaseId;
  readonly type: DocumentType;
  readonly name: string;
  readonly url: string;
  readonly storageKey: string;
  readonly fileSize: number;
  readonly mimeType: string;
  readonly status: DocumentStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}> {
  /**
   * Maximum file size (50MB)
   */
  static readonly MAX_FILE_SIZE = 50 * 1024 * 1024;

  /**
   * Maximum name length
   */
  static readonly MAX_NAME_LENGTH = 255;

  /**
   * Allowed MIME types for documents
   */
  static readonly ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/tiff',
  ]);

  /**
   * Create a new Document
   */
  static create(params: {
    id: string;
    caseId: string;
    type: DocumentType;
    name: string;
    url: string;
    storageKey: string;
    fileSize: number;
    mimeType: string;
  }): Effect.Effect<Document, ValidationError> {
    return Effect.gen(function* (_) {
      // Validate name
      const trimmedName = params.name.trim();
      if (!trimmedName) {
        return yield* _(Effect.fail(
          new ValidationError({ message: 'Document name is required', field: 'name' })
        ));
      }

      if (trimmedName.length > Document.MAX_NAME_LENGTH) {
        return yield* _(Effect.fail(
          new ValidationError({
            message: `Document name too long (max ${Document.MAX_NAME_LENGTH} characters)`,
            field: 'name',
          })
        ));
      }

      // Validate file size
      if (params.fileSize <= 0) {
        return yield* _(Effect.fail(
          new ValidationError({ message: 'File size must be greater than 0', field: 'fileSize' })
        ));
      }

      if (params.fileSize > Document.MAX_FILE_SIZE) {
        return yield* _(Effect.fail(
          new ValidationError({
            message: `File size exceeds ${Document.MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
            field: 'fileSize',
          })
        ));
      }

      // Validate MIME type
      if (!Document.ALLOWED_MIME_TYPES.has(params.mimeType)) {
        return yield* _(Effect.fail(
          new ValidationError({
            message: 'File type not allowed. Please upload PDF, Word, Excel, or image files.',
            field: 'mimeType',
          })
        ));
      }

      // Validate URL
      if (!params.url || !params.url.trim()) {
        return yield* _(Effect.fail(
          new ValidationError({ message: 'Document URL is required', field: 'url' })
        ));
      }

      // Validate storage key
      if (!params.storageKey || !params.storageKey.trim()) {
        return yield* _(Effect.fail(
          new ValidationError({ message: 'Storage key is required', field: 'storageKey' })
        ));
      }

      const now = new Date();

      return new Document({
        id: params.id as DocumentId,
        caseId: params.caseId as CaseId,
        type: params.type,
        name: trimmedName,
        url: params.url,
        storageKey: params.storageKey,
        fileSize: params.fileSize,
        mimeType: params.mimeType,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      });
    });
  }

  /**
   * Archive the document
   */
  archive(): Document {
    return new Document({
      ...this,
      status: 'archived',
      updatedAt: new Date(),
    });
  }

  /**
   * Mark as deleted (soft delete)
   */
  markDeleted(): Document {
    return new Document({
      ...this,
      status: 'deleted',
      updatedAt: new Date(),
    });
  }

  /**
   * Get formatted file size
   */
  getFormattedFileSize(): string {
    const bytes = this.fileSize;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Get file extension from name
   */
  get fileExtension(): string {
    const parts = this.name.split('.');
    return parts.length > 1 ? parts[parts.length - 1]!.toUpperCase() : '';
  }

  /**
   * Check if document is active
   */
  get isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Check if document is a PDF
   */
  get isPDF(): boolean {
    return this.mimeType === 'application/pdf';
  }

  /**
   * Check if document is an image
   */
  get isImage(): boolean {
    return this.mimeType.startsWith('image/');
  }
}
