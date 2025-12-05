'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentUploaderProps {
  caseId: string;
  onUploadComplete: () => void;
  className?: string;
}

interface FileUpload {
  id: string;
  file: File;
  category: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const DOCUMENT_CATEGORIES = [
  'Death Certificate',
  'Contract',
  'Invoice',
  'Photo',
  'Permit',
  'Other',
] as const;

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function DocumentUploader({ caseId, onUploadComplete, className = '' }: DocumentUploaderProps) {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'File type not allowed. Please upload PDF, DOCX, JPG, or PNG files.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 10MB limit.';
    }
    return null;
  };

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: FileUpload[] = [];
    
    Array.from(fileList).forEach((file) => {
      const error = validateFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        return;
      }

      newFiles.push({
        id: crypto.randomUUID(),
        file,
        category: 'Other',
        progress: 0,
        status: 'pending',
      });
    });

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleCategoryChange = (fileId: string, category: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, category } : f))
    );
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const uploadFile = async (fileUpload: FileUpload) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileUpload.id ? { ...f, status: 'uploading' as const } : f))
    );

    try {
      // Simulate upload progress (replace with real API call)
      const xhr = new XMLHttpRequest();
      
      return new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setFiles((prev) =>
              prev.map((f) => (f.id === fileUpload.id ? { ...f, progress } : f))
            );
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileUpload.id ? { ...f, status: 'success' as const, progress: 100 } : f
              )
            );
            resolve();
          } else {
            throw new Error('Upload failed');
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error'));
        });

        xhr.open('POST', `/api/cases/${caseId}/documents`);
        
        const formData = new FormData();
        formData.append('file', fileUpload.file);
        formData.append('category', fileUpload.category);
        formData.append('caseId', caseId);
        
        xhr.send(formData);
      });
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileUpload.id
            ? { ...f, status: 'error' as const, error: 'Upload failed' }
            : f
        )
      );
      throw error;
    }
  };

  const handleUploadAll = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    
    if (pendingFiles.length === 0) {
      toast.error('No files to upload');
      return;
    }

    try {
      await Promise.all(pendingFiles.map(uploadFile));
      toast.success(`${pendingFiles.length} file(s) uploaded successfully`);
      onUploadComplete();
      setTimeout(() => setFiles([]), 1500); // Clear after delay to show success
    } catch (error) {
      toast.error('Some uploads failed. Please try again.');
    }
  };

  const pendingCount = files.filter((f) => f.status === 'pending').length;

  return (
    <div className={className}>
      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging
            ? 'border-[--sage] bg-[--sage] bg-opacity-10'
            : 'border-gray-300 hover:border-[--sage]'
        }`}
      >
        <Upload className="w-12 h-12 text-[--charcoal] opacity-40 mx-auto mb-3" />
        <p className="text-sm text-[--navy] mb-2 font-medium">
          Drag & drop files here, or click to browse
        </p>
        <p className="text-xs text-[--charcoal] opacity-60 mb-4">
          PDF, DOCX, JPG, PNG (max 10MB each)
        </p>
        <label className="inline-block px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 cursor-pointer transition-all">
          Select Files
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            {files.map((fileUpload) => (
              <motion.div
                key={fileUpload.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="border border-gray-200 rounded-lg p-3"
              >
                <div className="flex items-start gap-3">
                  {/* File Icon / Status */}
                  <div className="flex-shrink-0">
                    {fileUpload.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : fileUpload.status === 'error' ? (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <File className="w-5 h-5 text-[--charcoal] opacity-60" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[--navy] truncate">
                          {fileUpload.file.name}
                        </p>
                        <p className="text-xs text-[--charcoal] opacity-60">
                          {(fileUpload.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      {fileUpload.status === 'pending' && (
                        <button
                          onClick={() => removeFile(fileUpload.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-[--charcoal] opacity-60" />
                        </button>
                      )}
                    </div>

                    {/* Category Selector */}
                    {fileUpload.status === 'pending' && (
                      <select
                        value={fileUpload.category}
                        onChange={(e) => handleCategoryChange(fileUpload.id, e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--sage]"
                      >
                        {DOCUMENT_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Progress Bar */}
                    {fileUpload.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${fileUpload.progress}%` }}
                            className="h-full bg-[--sage]"
                          />
                        </div>
                        <p className="text-xs text-[--charcoal] opacity-60 mt-1">
                          {fileUpload.progress}%
                        </p>
                      </div>
                    )}

                    {/* Error Message */}
                    {fileUpload.status === 'error' && fileUpload.error && (
                      <p className="text-xs text-red-600 mt-1">{fileUpload.error}</p>
                    )}

                    {/* Success Message */}
                    {fileUpload.status === 'success' && (
                      <p className="text-xs text-green-600 mt-1">Upload complete!</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Upload All Button */}
            {pendingCount > 0 && (
              <button
                onClick={handleUploadAll}
                className="w-full px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-all font-medium"
              >
                Upload {pendingCount} File{pendingCount !== 1 ? 's' : ''}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
