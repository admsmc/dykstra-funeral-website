import * as React from 'react';
import { cn } from '../lib/utils';

export interface FileWithPreview extends File {
  preview?: string;
  progress?: number;
}

export interface FileUploadProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onFilesSelected?: (files: FileWithPreview[]) => void;
  onRemove?: (index: number) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  showPreviews?: boolean;
  files?: FileWithPreview[];
}

export const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      className,
      onFilesSelected,
      onRemove,
      maxFiles = 10,
      maxSize = 10 * 1024 * 1024, // 10MB default
      showPreviews = true,
      accept = 'image/*',
      multiple = true,
      files = [],
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [error, setError] = React.useState<string>();

    React.useImperativeHandle(ref, () => inputRef.current!);

    const validateFiles = (fileList: FileList | File[]): FileWithPreview[] => {
      const filesArray = Array.from(fileList);
      const validFiles: FileWithPreview[] = [];
      
      for (const file of filesArray) {
        // Check file size
        if (file.size > maxSize) {
          setError(`File "${file.name}" exceeds ${maxSize / 1024 / 1024}MB limit`);
          continue;
        }

        // Check max files
        if (files.length + validFiles.length >= maxFiles) {
          setError(`Maximum ${maxFiles} files allowed`);
          break;
        }

        // Create preview for images
        const fileWithPreview = file as FileWithPreview;
        if (file.type.startsWith('image/')) {
          fileWithPreview.preview = URL.createObjectURL(file);
        }

        validFiles.push(fileWithPreview);
      }

      return validFiles;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(undefined);
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) return;

      const validFiles = validateFiles(fileList);
      if (validFiles.length > 0) {
        onFilesSelected?.([...files, ...validFiles]);
      }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      setError(undefined);

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length === 0) return;

      const validFiles = validateFiles(droppedFiles);
      if (validFiles.length > 0) {
        onFilesSelected?.([...files, ...validFiles]);
      }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = () => {
      setIsDragging(false);
    };

    const handleRemove = (index: number) => {
      // Revoke preview URL to avoid memory leaks
      const file = files[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      onRemove?.(index);
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    // Cleanup preview URLs on unmount
    React.useEffect(() => {
      return () => {
        files.forEach((file) => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
        });
      };
    }, [files]);

    return (
      <div className={cn('space-y-4', className)}>
        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
            isDragging
              ? 'border-navy bg-cream'
              : 'border-gray-300 hover:border-navy hover:bg-gray-50'
          )}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={accept}
            multiple={multiple}
            onChange={handleFileSelect}
            {...props}
          />

          <div className="flex flex-col items-center gap-3">
            {/* Upload icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>

            <div>
              <p className="text-base font-medium text-charcoal mb-1">
                {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-sm text-gray-500">
                {accept === 'image/*' ? 'Images only' : 'Any file type'} • Max{' '}
                {formatFileSize(maxSize)} • Up to {maxFiles} files
              </p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="text-sm text-red-600 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        {/* File previews */}
        {showPreviews && files.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-charcoal">
              Selected Files ({files.length})
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white"
                >
                  {/* Preview thumbnail */}
                  {file.preview ? (
                    <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded flex items-center justify-center bg-gray-100 flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-400"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                  )}

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>

                    {/* Progress bar */}
                    {file.progress !== undefined && (
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-navy h-1.5 rounded-full transition-all"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors"
                    aria-label="Remove file"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';
