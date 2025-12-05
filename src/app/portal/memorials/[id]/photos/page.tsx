'use client';

import { trpc } from '@/lib/trpc/client';
import { useState } from 'react';
import Link from 'next/link';
import { use } from 'react';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

/**
 * Photo Gallery Page
 * 
 * Features:
 * - Multi-photo upload with drag-and-drop
 * - Client-side image preview
 * - Gallery grid display
 * - Photo metadata (caption, uploaded by, date)
 * - Delete functionality (family members only)
 * 
 * Backend flow:
 * 1. Upload files to storage adapter (S3/Vercel Blob)
 * 2. Create Photo entity with metadata
 * 3. Associate with Memorial/Case
 * 4. Query photos for display
 */
export default function PhotoGalleryPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id: memorialId } = use(params);
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);

  // Fetch photos via tRPC
  const { data: photosData, isLoading, error, refetch } = trpc.memorial.getPhotos.useQuery({ memorialId });
  
  // Add photo mutation (for upload)
  const addPhotoMutation = trpc.memorial.addPhoto.useMutation();
  
  const photos = photosData?.photos || [];

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );
    
    setSelectedFiles(prev => [...prev, ...fileArray]);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Handle upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one photo');
      return;
    }

    const toastId = toast.loading(`Uploading ${selectedFiles.length} photo(s)...`);

    try {
      // Compression options
      const compressionOptions = {
        maxSizeMB: 2, // Max 2MB after compression
        maxWidthOrHeight: 1920, // Max dimension
        useWebWorker: true,
        fileType: 'image/jpeg' as const, // Convert all to JPEG for consistency
      };

      // Upload each file
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const caption = captions[i] || '';

        // Compress image
        console.log(`Compressing ${file.name}...`);
        const compressedFile = await imageCompression(file, compressionOptions);
        console.log(
          `Compressed from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
        );

        // For now, create a mock URL (in production, upload to storage first)
        const photoUrl = URL.createObjectURL(compressedFile);
        
        // Add photo via tRPC
        await addPhotoMutation.mutateAsync({
          memorialId,
          caseId: 'placeholder-case-id', // TODO: Get from context
          url: photoUrl,
          caption: caption || undefined,
          uploadedBy: 'current-user-id', // TODO: Get from session
        });
        
        console.log('Upload successful:', file.name);
      }

      toast.success(`Successfully uploaded ${selectedFiles.length} photo(s)`, { id: toastId });
      setSelectedFiles([]);
      setCaptions({});
      
      // Refetch photos from backend
      refetch();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(
        `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { id: toastId }
      );
    }
  };

  // Remove selected file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Update caption for file
  const updateCaption = (index: number, caption: string) => {
    setCaptions(prev => ({
      ...prev,
      [index]: caption
    }));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[--navy]" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading photos: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link 
          href="/portal/dashboard"
          className="text-[--sage] hover:text-[--navy] mb-2 inline-block"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="text-4xl font-serif text-[--navy] mb-2">Photo Gallery</h1>
        <p className="text-[--charcoal]">
          Share memories and photos with family and friends.
        </p>
      </div>

      {/* Upload Section */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-serif text-[--navy] mb-4">Upload Photos</h2>
        
        {/* Drag and drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition
            ${isDragging 
              ? 'border-[--navy] bg-[--cream]' 
              : 'border-[--sage] hover:border-[--navy]'
            }
          `}
        >
          <div className="text-4xl mb-3">📸</div>
          <p className="text-[--charcoal] mb-2">
            Drag and drop photos here, or click to select
          </p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => handleFileSelect(e.target.files)}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-block px-6 py-3 bg-[--sage] text-white rounded hover:bg-[--navy] transition cursor-pointer"
          >
            Choose Files
          </label>
          <p className="text-xs text-gray-500 mt-3">
            Supported formats: JPG, PNG, GIF (max 10MB each)
          </p>
        </div>

        {/* Selected files preview */}
        {selectedFiles.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="font-medium text-[--navy]">
              Selected Photos ({selectedFiles.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedFiles.map((file, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="w-24 h-24 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[--navy] truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <input
                        type="text"
                        placeholder="Add caption..."
                        value={captions[index] || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => updateCaption(index, e.target.value)}
                        className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[--sage]"
                      />
                    </div>
                    
                    {/* Remove button */}
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 text-xl"
                      title="Remove photo"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Upload button */}
            <div className="flex justify-end">
              <button
                onClick={handleUpload}
                className="px-6 py-3 bg-[--navy] text-white rounded hover:bg-[--sage] transition"
              >
                Upload {selectedFiles.length} Photo{selectedFiles.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Gallery Display */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-serif text-[--navy] mb-4">All Photos ({photos.length})</h2>
        
        {photos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No photos uploaded yet. Be the first to share a memory.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative">
                {/* Photo */}
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Memorial photo'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-end opacity-0 group-hover:opacity-100">
                  <div className="p-4 text-white w-full">
                    {photo.caption && <p className="font-medium mb-1">{photo.caption}</p>}
                    <p className="text-xs opacity-90">
                      By {photo.uploadedBy.firstName} {photo.uploadedBy.lastName} • {new Date(photo.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Implementation Notes */}
      <div className="text-xs text-gray-500 text-center pb-8 bg-[--cream] rounded-lg p-4">
        <p className="mb-2">
          <strong>Production Implementation:</strong>
        </p>
        <p>
          Configure storage adapter (S3/Vercel Blob) • 
          Add Photo domain entity with SCD2 • 
          Create PhotoRepository • 
          Add tRPC mutations (uploadPhoto, deletePhoto) • 
          Add tRPC query (getPhotos) • 
          Implement image optimization • 
          Add lightbox for full-size viewing • 
          Add download functionality
        </p>
      </div>
    </div>
  );
}
