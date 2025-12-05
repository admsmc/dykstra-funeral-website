import { z } from 'zod';
import { router, staffProcedure } from '../trpc';

/**
 * Appointment router
 * Pre-planning consultation scheduling and management
 */
export const appointmentRouter = router({
  /**
   * List all appointments with optional filters
   */
  list: staffProcedure
    .input(
      z.object({
        date: z.string().optional(),
        directorId: z.string().optional(),
        status: z.enum(['all', 'scheduled', 'completed', 'cancelled', 'no-show']).default('all'),
        funeralHomeId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      // Mock appointment data - will be replaced with Go backend integration
      const allAppointments = [
        {
          id: 'APT-001',
          familyName: 'Johnson Family',
          contactName: 'Mary Johnson',
          phone: '(555) 123-4567',
          email: 'mary.j@email.com',
          director: 'Sarah M.',
          directorId: 'emp-001',
          date: '2024-12-05',
          time: '10:00 AM',
          duration: 60,
          status: 'scheduled' as const,
          notes: 'Interested in pre-need planning for 2 people',
        },
        {
          id: 'APT-002',
          familyName: 'Smith Family',
          contactName: 'John Smith',
          phone: '(555) 234-5678',
          email: 'jsmith@email.com',
          director: 'Michael R.',
          directorId: 'emp-003',
          date: '2024-12-05',
          time: '2:00 PM',
          duration: 90,
          status: 'scheduled' as const,
          notes: 'Follow-up from website inquiry',
        },
        {
          id: 'APT-003',
          familyName: 'Williams Family',
          contactName: 'Sarah Williams',
          phone: '(555) 345-6789',
          email: 'swilliams@email.com',
          director: 'Sarah M.',
          directorId: 'emp-001',
          date: '2024-12-06',
          time: '11:00 AM',
          duration: 60,
          status: 'scheduled' as const,
        },
        {
          id: 'APT-004',
          familyName: 'Brown Family',
          contactName: 'Michael Brown',
          phone: '(555) 456-7890',
          email: 'mbrown@email.com',
          director: 'John D.',
          directorId: 'emp-002',
          date: '2024-12-04',
          time: '3:00 PM',
          duration: 60,
          status: 'completed' as const,
        },
        {
          id: 'APT-005',
          familyName: 'Davis Family',
          contactName: 'Jennifer Davis',
          phone: '(555) 567-8901',
          email: 'jdavis@email.com',
          director: 'Sarah M.',
          directorId: 'emp-001',
          date: '2024-12-03',
          time: '1:00 PM',
          duration: 60,
          status: 'cancelled' as const,
        },
      ];

      let filtered = allAppointments;

      // Filter by date
      if (input.date) {
        filtered = filtered.filter((a) => a.date === input.date);
      }

      // Filter by director
      if (input.directorId) {
        filtered = filtered.filter((a) => a.directorId === input.directorId);
      }

      // Filter by status
      if (input.status !== 'all') {
        filtered = filtered.filter((a) => a.status === input.status);
      }

      return filtered;
    }),

  /**
   * Create a new appointment
   */
  create: staffProcedure
    .input(
      z.object({
        familyName: z.string(),
        contactName: z.string(),
        phone: z.string(),
        email: z.string().email(),
        directorId: z.string(),
        date: z.string(),
        time: z.string(),
        duration: z.number(),
        notes: z.string().optional(),
        funeralHomeId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        id: `APT-${Date.now()}`,
        ...input,
        director: 'Staff Member',
        status: 'scheduled' as const,
        createdAt: new Date(),
      };
    }),

  /**
   * Update appointment status
   */
  updateStatus: staffProcedure
    .input(
      z.object({
        appointmentId: z.string(),
        status: z.enum(['scheduled', 'completed', 'cancelled', 'no-show']),
      })
    )
    .mutation(async ({ input }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        appointmentId: input.appointmentId,
        status: input.status,
        updatedAt: new Date(),
      };
    }),

  /**
   * Get director availability for a given date
   */
  getDirectorAvailability: staffProcedure
    .input(
      z.object({
        directorId: z.string(),
        date: z.string(),
      })
    )
    .query(async ({ input }) => {
      // Mock implementation - will be replaced with Go backend integration
      const mockSlots = [
        { time: '9:00 AM', available: true },
        { time: '10:00 AM', available: false },
        { time: '11:00 AM', available: true },
        { time: '1:00 PM', available: true },
        { time: '2:00 PM', available: false },
        { time: '3:00 PM', available: true },
        { time: '4:00 PM', available: true },
      ];
      return {
        directorId: input.directorId,
        date: input.date,
        slots: mockSlots,
      };
    }),

  /**
   * Get appointment by ID
   */
  getById: staffProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // Mock implementation
      return {
        id: input.id,
        familyName: 'Sample Family',
        contactName: 'John Doe',
        phone: '(555) 123-4567',
        email: 'john@example.com',
        director: 'Staff Member',
        directorId: 'emp-001',
        date: '2024-12-10',
        time: '10:00 AM',
        duration: 60,
        status: 'scheduled' as const,
        notes: 'Pre-planning consultation',
        createdAt: new Date(),
      };
    }),
});
