import { router, staffProcedure } from '../trpc';
import { z } from 'zod';

/**
 * Memorial Router
 * 
 * Endpoints for memorial pages, tributes, guestbook, and photo galleries.
 * These are accessible by both staff and family members.
 */

export const memorialRouter = router({
  // Get memorial details including obituary and service info
  get: staffProcedure
    .input(z.object({
      memorialId: z.string(),
    }))
    .query(async ({ input: _input }) => {
      // Mock data - will integrate with Go backend
      return {
        id: 'memorial-1',
        caseId: 'case-1',
        decedentName: 'John David Smith',
        dateOfBirth: '1945-03-15',
        dateOfDeath: '2024-11-20',
        obituary: 'John David Smith, 79, of Grand Rapids, passed away peacefully on November 20, 2024. He was a beloved husband, father, grandfather, and friend who will be deeply missed by all who knew him.',
        serviceDetails: {
          date: '2024-11-30',
          time: '2:00 PM',
          location: 'Dykstra Funeral Home Chapel',
        },
      };
    }),

  // Get photos for memorial gallery
  getPhotos: staffProcedure
    .input(z.object({
      memorialId: z.string(),
    }))
    .query(async ({ input: _input }) => {
      // Mock data - will integrate with storage backend
      return {
        photos: [
          { 
            id: '1', 
            url: 'https://via.placeholder.com/400x300/1e3a5f/ffffff?text=Photo+1',
            caption: 'Family gathering, 2020',
            uploadedBy: { id: '1', firstName: 'John', lastName: 'Doe' },
            uploadedAt: new Date('2025-01-15').toISOString(),
          },
          { 
            id: '2', 
            url: 'https://via.placeholder.com/400x300/8b9d83/ffffff?text=Photo+2',
            caption: 'Summer vacation',
            uploadedBy: { id: '2', firstName: 'Jane', lastName: 'Doe' },
            uploadedAt: new Date('2025-01-16').toISOString(),
          },
          { 
            id: '3', 
            url: 'https://via.placeholder.com/400x300/b8956a/ffffff?text=Photo+3',
            caption: 'Birthday celebration',
            uploadedBy: { id: '1', firstName: 'John', lastName: 'Doe' },
            uploadedAt: new Date('2025-01-17').toISOString(),
          },
        ],
        totalCount: 3,
      };
    }),

  // Add photo to memorial
  addPhoto: staffProcedure
    .input(z.object({
      memorialId: z.string(),
      caseId: z.string(),
      url: z.string().url(),
      caption: z.string().optional(),
      uploadedBy: z.string(),
    }))
    .mutation(async ({ input: _input }) => {
      // Mock mutation - will integrate with storage backend
      return {
        id: crypto.randomUUID(),
        memorialId: _input.memorialId,
        url: _input.url,
        caption: _input.caption || null,
        uploadedBy: { id: _input.uploadedBy, firstName: 'Current', lastName: 'User' },
        uploadedAt: new Date().toISOString(),
      };
    }),

  // Get tributes (condolence messages)
  getTributes: staffProcedure
    .input(z.object({
      memorialId: z.string(),
    }))
    .query(async ({ input: _input }) => {
      // Mock data
      return {
        tributes: [
          {
            id: '1',
            authorName: 'Sarah Johnson',
            message: 'John was a wonderful neighbor and friend. His kindness and generosity will never be forgotten.',
            createdAt: '2024-11-22T10:30:00Z',
          },
          {
            id: '2',
            authorName: 'Michael Brown',
            message: 'We will miss his stories and laughter. Rest in peace, old friend.',
            createdAt: '2024-11-23T14:15:00Z',
          },
        ],
        totalCount: 2,
      };
    }),

  // Add tribute (condolence message)
  addTribute: staffProcedure
    .input(z.object({
      memorialId: z.string(),
      name: z.string().min(1),
      email: z.string().email(),
      message: z.string().min(1).max(2000),
    }))
    .mutation(async ({ input: _input }) => {
      // Mock mutation - will integrate with Go backend
      return {
        id: crypto.randomUUID(),
        authorName: _input.name,
        message: _input.message,
        createdAt: new Date().toISOString(),
        status: 'pending_review', // Tributes require review before publishing
      };
    }),

  // Get guestbook entries
  getGuestbook: staffProcedure
    .input(z.object({
      memorialId: z.string(),
    }))
    .query(async ({ input: _input }) => {
      // Mock data
      return {
        entries: [
          {
            id: '1',
            name: 'Emily Davis',
            location: 'Grand Rapids, MI',
            message: 'Our thoughts and prayers are with your family during this difficult time.',
            createdAt: '2024-11-22T09:00:00Z',
          },
          {
            id: '2',
            name: 'Thomas Wilson',
            location: 'Lansing, MI',
            message: 'John was a great man who touched many lives. Deepest condolences.',
            createdAt: '2024-11-23T16:45:00Z',
          },
        ],
        totalCount: 2,
      };
    }),

  // Sign guestbook
  signGuestbook: staffProcedure
    .input(z.object({
      memorialId: z.string(),
      name: z.string().min(1),
      email: z.string().email(),
      message: z.string().min(1).max(2000),
      city: z.string().optional(),
      state: z.string().optional(),
    }))
    .mutation(async ({ input: _input }) => {
      // Mock mutation
      const location = _input.city && _input.state 
        ? `${_input.city}, ${_input.state}` 
        : null;

      return {
        id: crypto.randomUUID(),
        name: _input.name,
        location,
        message: _input.message,
        createdAt: new Date().toISOString(),
      };
    }),
});
