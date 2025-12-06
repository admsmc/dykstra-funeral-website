import { Effect, Layer } from 'effect';
import { StoragePort, type StoragePortService, type FileUpload, type UploadResult, StorageError } from '@dykstra/application';
import { randomBytes } from 'crypto';

/**
 * Storage adapter implementation
 * 
 * This is structured for easy swap between:
 * - Local filesystem (development)
 * - AWS S3 (production)
 * - Vercel Blob (production)
 * 
 * To use AWS S3:
 * 1. npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 * 2. Uncomment S3Client imports
 * 3. Replace mock implementation with real S3 calls
 */

/**
 * Generate a unique key for a file
 */
const generateKey = (folder: string, filename: string): string => {
  const timestamp = Date.now();
  const random = randomBytes(8).toString('hex');
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${folder}/${timestamp}-${random}-${sanitized}`;
};

/**
 * Local filesystem storage (development only)
 */
const LocalStorageAdapter: StoragePortService = {
  upload: (file: FileUpload) =>
    Effect.tryPromise({
      try: async () => {
        const key = generateKey(file.folder, file.name);
        
        // In development, we would use fs.promises.writeFile
        // For now, simulate success
        console.log(`[LocalStorage] Uploading ${key} (${file.data.length} bytes)`);
        
        return {
          url: `/uploads/${key}`,
          key,
        } as UploadResult;
      },
      catch: (error) => new StorageError('Failed to upload file locally', error),
    }),
  
  delete: (key: string) =>
    Effect.tryPromise({
      try: async () => {
        // In development: fs.promises.unlink
        console.log(`[LocalStorage] Deleting ${key}`);
      },
      catch: (error) => new StorageError('Failed to delete file', error),
    }),
  
  getSignedUrl: (key: string, _expiresIn: number) =>
    Effect.tryPromise({
      try: async () => {
        // Local files don't need signed URLs
        return `/uploads/${key}`;
      },
      catch: (error) => new StorageError('Failed to generate signed URL', error),
    }),
};

/**
 * AWS S3 storage adapter (production)
 * 
 * To implement:
 * import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
 * import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
 */
const S3StorageAdapter: StoragePortService = {
  upload: (file: FileUpload) =>
    Effect.tryPromise({
      try: async () => {
        const key = generateKey(file.folder, file.name);
        
        // Production implementation:
        // const s3 = new S3Client({ region: process.env.AWS_REGION });
        // await s3.send(new PutObjectCommand({
        //   Bucket: process.env['S3_BUCKET']!,
        //   Key: key,
        //   Body: file.data,
        //   ContentType: file.mimeType,
        // }));
        
        console.log(`[S3] Would upload ${key} to ${process.env['S3_BUCKET']}`);
        
        return {
          url: `https://${process.env['S3_BUCKET'] || 'bucket'}.s3.amazonaws.com/${key}`,
          key,
        } as UploadResult;
      },
      catch: (error) => new StorageError('Failed to upload file to S3', error),
    }),
  
  delete: (key: string) =>
    Effect.tryPromise({
      try: async () => {
        // const s3 = new S3Client({ region: process.env.AWS_REGION });
        // await s3.send(new DeleteObjectCommand({
        //   Bucket: process.env['S3_BUCKET']!,
        //   Key: key,
        // }));
        
        console.log(`[S3] Would delete ${key}`);
      },
      catch: (error) => new StorageError('Failed to delete file from S3', error),
    }),
  
  getSignedUrl: (key: string, _expiresIn: number) =>
    Effect.tryPromise({
      try: async () => {
        // const s3 = new S3Client({ region: process.env.AWS_REGION });
        // const command = new GetObjectCommand({
        //   Bucket: process.env['S3_BUCKET']!,
        //   Key: key,
        // });
        // return await getSignedUrl(s3, command, { expiresIn: _expiresIn });
        
        return `https://${process.env['S3_BUCKET'] || 'bucket'}.s3.amazonaws.com/${key}?signed=true`;
      },
      catch: (error) => new StorageError('Failed to generate signed URL', error),
    }),
};

/**
 * Get the appropriate storage adapter based on environment
 */
const getStorageAdapter = (): StoragePortService => {
  const env = process.env['NODE_ENV'] || 'development';
  
  if (env === 'production' && process.env['S3_BUCKET']) {
    return S3StorageAdapter;
  }
  
  return LocalStorageAdapter;
};

/**
 * Effect Layer to provide StoragePort
 */
export const StorageAdapterLive = Layer.sync(
  StoragePort,
  () => getStorageAdapter()
);
