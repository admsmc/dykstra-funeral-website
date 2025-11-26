import { z } from 'zod';

/**
 * Photo schema
 */
export const PhotoSchema = z.object({
  id: z.string().cuid(),
  memorialId: z.string().cuid(),
  url: z.string().url(),
  thumbnailUrl: z.string().url().nullable(),
  caption: z.string().max(500).nullable(),
  uploadedBy: z.string().cuid(),
  uploadedByName: z.string().max(255),
  uploadedAt: z.date(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  fileSize: z.number().int().positive(),
  mimeType: z.string().max(100),
});

export type Photo = z.infer<typeof PhotoSchema>;

/**
 * Video schema
 */
export const VideoSchema = z.object({
  id: z.string().cuid(),
  memorialId: z.string().cuid(),
  url: z.string().url(),
  thumbnailUrl: z.string().url().nullable(),
  title: z.string().max(255).nullable(),
  description: z.string().max(1000).nullable(),
  uploadedBy: z.string().cuid(),
  uploadedByName: z.string().max(255),
  uploadedAt: z.date(),
  duration: z.number().int().positive().nullable(), // in seconds
  fileSize: z.number().int().positive(),
  mimeType: z.string().max(100),
});

export type Video = z.infer<typeof VideoSchema>;

/**
 * Tribute/Condolence message
 */
export const TributeSchema = z.object({
  id: z.string().cuid(),
  memorialId: z.string().cuid(),
  authorName: z.string().min(1).max(255),
  authorEmail: z.string().email().nullable(),
  message: z.string().min(1).max(2000),
  isPublic: z.boolean().default(true),
  isApproved: z.boolean().default(false), // Moderation flag
  createdAt: z.date(),
});

export type Tribute = z.infer<typeof TributeSchema>;

/**
 * Guestbook entry
 */
export const GuestbookEntrySchema = z.object({
  id: z.string().cuid(),
  memorialId: z.string().cuid(),
  name: z.string().min(1).max(255),
  email: z.string().email().nullable(),
  message: z.string().min(1).max(1000),
  city: z.string().max(255).nullable(),
  state: z.string().max(2).nullable(), // US state code
  createdAt: z.date(),
});

export type GuestbookEntry = z.infer<typeof GuestbookEntrySchema>;

/**
 * Main Memorial schema
 */
export const MemorialSchema = z.object({
  id: z.string().cuid(),
  caseId: z.string().cuid(),
  slug: z.string().min(1).max(255), // URL-friendly slug
  isPublic: z.boolean().default(true),
  allowPhotoUploads: z.boolean().default(true),
  allowTributes: z.boolean().default(true),
  allowGuestbook: z.boolean().default(true),
  theme: z.string().max(50).default('default'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Memorial = z.infer<typeof MemorialSchema>;

/**
 * Upload photo request
 */
export const UploadPhotoRequestSchema = z.object({
  memorialId: z.string().cuid(),
  caption: z.string().max(500).optional(),
  // File data would be handled via multipart/form-data
});

export type UploadPhotoRequest = z.infer<typeof UploadPhotoRequestSchema>;

/**
 * Add tribute request
 */
export const AddTributeRequestSchema = z.object({
  memorialId: z.string().cuid(),
  authorName: z.string().min(1).max(255),
  authorEmail: z.string().email().optional(),
  message: z.string().min(1).max(2000),
});

export type AddTributeRequest = z.infer<typeof AddTributeRequestSchema>;
