import { Effect } from "effect";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  type StoragePortService,
  StorageError,
  type FileUpload,
  type UploadResult,
} from "@dykstra/application";

/**
 * Lazy S3 client and configuration singleton
 * Initialized on first use to avoid module-load side effects
 */
let s3ClientInstance: S3Client | null = null;
let bucketName: string | null = null;
let regionName: string | null = null;

function getS3Client(): S3Client {
  if (s3ClientInstance) return s3ClientInstance;

  const accessKeyId = process.env['AWS_ACCESS_KEY_ID'];
  const secretAccessKey = process.env['AWS_SECRET_ACCESS_KEY'];
  const region = process.env['AWS_REGION'] || "us-east-1";

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."
    );
  }

  regionName = region;
  s3ClientInstance = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return s3ClientInstance;
}

function getBucket(): string {
  if (bucketName) return bucketName;

  const bucket = process.env['AWS_S3_BUCKET'];
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET environment variable is required.");
  }

  bucketName = bucket;
  return bucketName;
}

function getRegion(): string {
  if (regionName) return regionName;
  return process.env['AWS_REGION'] || "us-east-1";
}

/**
 * S3 Storage Adapter
 * Object-based adapter (NOT class-based) implementing StoragePort using AWS S3
 */
export const S3StorageAdapter: StoragePortService = {

  /**
   * Upload a file to S3
   */
  upload: (file: FileUpload) =>
    Effect.gen(function* (_) {
      try {
        // Generate unique key with folder structure
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const key = `${file.folder}/${timestamp}-${randomSuffix}-${sanitizedName}`;

        // Upload to S3
        const command = new PutObjectCommand({
          Bucket: getBucket(),
          Key: key,
          Body: file.data,
          ContentType: file.mimeType,
          // Set cache control for optimal delivery
          CacheControl: "public, max-age=31536000, immutable",
        });

        yield* _(Effect.tryPromise({
          try: () => getS3Client().send(command),
          catch: (error) => new StorageError(
            `Failed to upload file to S3: ${error instanceof Error ? error.message : "Unknown error"}`,
            error
          ),
        }));

        // Construct public URL
        const url = `https://${getBucket()}.s3.${getRegion()}.amazonaws.com/${key}`;

        return {
          url,
          key,
        } satisfies UploadResult;
      } catch (error) {
        return yield* _(
          Effect.fail(
            new StorageError(
              `Failed to upload file to S3: ${error instanceof Error ? error.message : "Unknown error"}`,
              error
            )
          )
        );
      }
    }),

  /**
   * Delete a file from S3
   */
  delete: (key: string) =>
    Effect.gen(function* (_) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: getBucket(),
          Key: key,
        });

        yield* _(Effect.tryPromise({
          try: () => getS3Client().send(command),
          catch: (error) => new StorageError(
            `Failed to delete file from S3: ${error instanceof Error ? error.message : "Unknown error"}`,
            error
          ),
        }));
      } catch (error) {
        return yield* _(
          Effect.fail(
            new StorageError(
              `Failed to delete file from S3: ${error instanceof Error ? error.message : "Unknown error"}`,
              error
            )
          )
        );
      }
    }),

  /**
   * Get a signed URL for temporary access to a private file
   */
  getSignedUrl: (key: string, expiresIn: number) =>
    Effect.gen(function* (_) {
      try {
        const command = new GetObjectCommand({
          Bucket: getBucket(),
          Key: key,
        });

        // Generate presigned URL
        const signedUrl = yield* _(Effect.tryPromise({
          try: () => getSignedUrl(getS3Client(), command, { expiresIn }),
          catch: (error) => new StorageError(
            `Failed to generate signed URL: ${error instanceof Error ? error.message : "Unknown error"}`,
            error
          ),
        }));

        return signedUrl;
      } catch (error) {
        return yield* _(
          Effect.fail(
            new StorageError(
              `Failed to generate signed URL: ${error instanceof Error ? error.message : "Unknown error"}`,
              error
            )
          )
        );
      }
    }),
};

/**
 * Create S3 storage adapter instance
 */
export function createS3StorageAdapter(): StoragePortService {
  return S3StorageAdapter;
}
