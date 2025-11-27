import { Effect } from "effect";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  type StoragePort,
  StorageError,
  FileUpload,
  UploadResult,
} from "@dykstra/application";

/**
 * S3 Storage Adapter
 * Implements StoragePort using AWS S3
 */
export class S3StorageAdapter implements StoragePort {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor() {
    // Validate required environment variables
    const accessKeyId = process.env['AWS_ACCESS_KEY_ID'];
    const secretAccessKey = process.env['AWS_SECRET_ACCESS_KEY'];
    const region = process.env['AWS_REGION'] || "us-east-1";
    const bucket = process.env['AWS_S3_BUCKET'];

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        "AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."
      );
    }

    if (!bucket) {
      throw new Error("AWS_S3_BUCKET environment variable is required.");
    }

    this.region = region;
    this.bucket = bucket;

    // Initialize S3 client
    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * Upload a file to S3
   */
  upload = (file: FileUpload): Effect.Effect<UploadResult, StorageError> => {
    const self = this;
    return Effect.gen(function* (_) {
      try {
        // Generate unique key with folder structure
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const key = `${file.folder}/${timestamp}-${randomSuffix}-${sanitizedName}`;

        // Upload to S3
        const command = new PutObjectCommand({
          Bucket: self.bucket,
          Key: key,
          Body: file.data,
          ContentType: file.mimeType,
          // Set cache control for optimal delivery
          CacheControl: "public, max-age=31536000, immutable",
        });

        yield* _(Effect.tryPromise({
          try: () => self.client.send(command),
          catch: (error) => new StorageError(
            `Failed to upload file to S3: ${error instanceof Error ? error.message : "Unknown error"}`,
            error
          ),
        }));

        // Construct public URL
        const url = `https://${self.bucket}.s3.${self.region}.amazonaws.com/${key}`;

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
    });
  };

  /**
   * Delete a file from S3
   */
  delete = (key: string): Effect.Effect<void, StorageError> => {
    const self = this;
    return Effect.gen(function* (_) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: self.bucket,
          Key: key,
        });

        yield* _(Effect.tryPromise({
          try: () => self.client.send(command),
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
    });
  };

  /**
   * Get a signed URL for temporary access to a private file
   */
  getSignedUrl = (
    key: string,
    expiresIn: number
  ): Effect.Effect<string, StorageError> => {
    const self = this;
    return Effect.gen(function* (_) {
      try {
        const command = new GetObjectCommand({
          Bucket: self.bucket,
          Key: key,
        });

        // Generate presigned URL
        const signedUrl = yield* _(Effect.tryPromise({
          try: () => getSignedUrl(self.client, command, { expiresIn }),
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
    });
  };
}

/**
 * Create S3 storage adapter instance
 * Singleton pattern to reuse S3 client
 */
let s3AdapterInstance: S3StorageAdapter | null = null;

export function createS3StorageAdapter(): S3StorageAdapter {
  if (!s3AdapterInstance) {
    s3AdapterInstance = new S3StorageAdapter();
  }
  return s3AdapterInstance;
}
