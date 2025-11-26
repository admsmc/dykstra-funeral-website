import { NextRequest, NextResponse } from 'next/server';
import { Effect } from 'effect';
import { uploadPhoto } from '@dykstra/application';
import { InfrastructureLayer } from '@dykstra/infrastructure';

/**
 * Helper to run Effect with error handling
 */
const runEffect = async <A, E>(effect: Effect.Effect<A, E, any>): Promise<A> => {
  const result = await Effect.runPromise(Effect.provide(effect, InfrastructureLayer).pipe(Effect.either)) as
    | { _tag: 'Left'; left: E }
    | { _tag: 'Right'; right: A };

  if (result._tag === 'Left') {
    const error = result.left;
    throw error;
  }

  return result.right;
};

/**
 * POST /api/photos/upload
 * Upload a photo with multipart form data
 * 
 * Body (multipart/form-data):
 * - file: File (required)
 * - memorialId: string (required)
 * - caseId: string (required)
 * - caption: string (optional)
 * - userId: string (required) - In production, get from session
 */
export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const memorialId = formData.get('memorialId') as string;
    const caseId = formData.get('caseId') as string;
    const caption = formData.get('caption') as string | null;
    const userId = formData.get('userId') as string; // TODO: Get from session in production
    
    // Validate required fields
    if (!file || !memorialId || !caseId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, memorialId, caseId, userId' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Extract image dimensions if available (requires image processing library in production)
    // For now, we'll set them as null and add dimension extraction later
    let width: number | undefined;
    let height: number | undefined;
    
    // TODO: Extract dimensions using sharp or similar library
    // const image = sharp(buffer);
    // const metadata = await image.metadata();
    // width = metadata.width;
    // height = metadata.height;
    
    // Generate photo ID
    const photoId = crypto.randomUUID(); // Use cuid2 in production
    
    // Upload photo
    const photo = await runEffect(
      uploadPhoto({
        id: photoId as any, // PhotoId brand
        memorialId: memorialId as any, // MemorialId brand
        caseId,
        file: {
          data: buffer,
          name: file.name,
          mimeType: file.type,
          size: file.size,
        },
        caption: caption ?? undefined,
        uploadedBy: userId,
        width,
        height,
      })
    ) as any; // Type assertion for photo entity from domain layer
    
    // Return photo details
    return NextResponse.json({
      id: photo.id,
      businessKey: photo.businessKey,
      version: photo.version,
      memorialId: photo.memorialId,
      caseId: photo.caseId,
      url: photo.url,
      storageKey: photo.storageKey,
      thumbnailUrl: photo.thumbnailUrl,
      caption: photo.caption,
      uploadedBy: photo.uploadedBy,
      uploadedAt: photo.uploadedAt,
      metadata: {
        width: photo.metadata.width,
        height: photo.metadata.height,
        mimeType: photo.metadata.mimeType,
        size: photo.metadata.size,
        formattedSize: photo.getFormattedFileSize(),
      },
      createdAt: photo.createdAt,
    });
  } catch (error: any) {
    console.error('Photo upload error:', error);
    
    // Map domain errors to HTTP responses
    if (error._tag === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    if (error._tag === 'StorageError') {
      return NextResponse.json(
        { error: 'Failed to upload photo to storage' },
        { status: 500 }
      );
    }
    
    if (error._tag === 'NotFoundError') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    // Generic error
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/photos/upload
 * CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
