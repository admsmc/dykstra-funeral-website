import { z } from 'zod';
import { router, staffProcedure } from '../trpc';

/**
 * Appointments Router
 * Manages appointments for pre-planning, arrangement conferences, etc.
 */
export const appointmentsRouter = router({
  /**
   * List appointments
   */
  listAppointments: staffProcedure
    .input(
      z.object({
        funeralHomeId: z.string(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show']).optional(),
        type: z.enum(['pre-planning', 'arrangement', 'service-review', 'monument-selection', 'other']).optional(),
        staffId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      // Mock appointments - will be replaced with real query
      return [
        {
          id: 'appt-001',
          funeralHomeId: input.funeralHomeId,
          type: 'pre-planning' as const,
          status: 'scheduled' as const,
          scheduledAt: new Date('2024-12-10T14:00:00'),
          duration: 60,
          contactId: 'contact-001',
          contactName: 'Robert & Mary Johnson',
          contactPhone: '(555) 234-5678',
          assignedStaffId: 'staff-001',
          assignedStaffName: 'John Director',
          locationId: 'loc-001',
          locationName: 'Main Chapel - Conference Room',
          notes: 'First pre-planning consultation',
          reminders: {
            email: true,
            sms: true,
            sentAt: new Date('2024-12-09T10:00:00'),
          },
        },
        {
          id: 'appt-002',
          funeralHomeId: input.funeralHomeId,
          type: 'arrangement' as const,
          status: 'confirmed' as const,
          scheduledAt: new Date('2024-12-08T10:00:00'),
          duration: 90,
          contactId: 'contact-002',
          contactName: 'Jennifer Williams',
          contactPhone: '(555) 345-6789',
          assignedStaffId: 'staff-002',
          assignedStaffName: 'Sarah Coordinator',
          locationId: 'loc-001',
          locationName: 'Main Chapel - Arrangement Office',
          notes: 'Immediate need arrangement conference',
          caseId: 'case-002',
          reminders: {
            email: true,
            sms: true,
            sentAt: new Date('2024-12-07T16:00:00'),
          },
        },
        {
          id: 'appt-003',
          funeralHomeId: input.funeralHomeId,
          type: 'service-review' as const,
          status: 'completed' as const,
          scheduledAt: new Date('2024-12-05T13:00:00'),
          duration: 45,
          contactId: 'contact-003',
          contactName: 'Michael Thompson',
          contactPhone: '(555) 456-7890',
          assignedStaffId: 'staff-001',
          assignedStaffName: 'John Director',
          locationId: 'loc-001',
          locationName: 'Main Chapel - Conference Room',
          notes: 'Review service details and timeline',
          caseId: 'case-003',
          completedAt: new Date('2024-12-05T13:52:00'),
          reminders: {
            email: true,
            sms: false,
            sentAt: new Date('2024-12-04T10:00:00'),
          },
        },
      ];
    }),

  /**
   * Get appointment by ID
   */
  getAppointment: staffProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // Mock single appointment
      return {
        id: input.id,
        funeralHomeId: 'fh-001',
        type: 'pre-planning' as const,
        status: 'scheduled' as const,
        scheduledAt: new Date('2024-12-10T14:00:00'),
        duration: 60,
        contactId: 'contact-001',
        contactName: 'Robert & Mary Johnson',
        contactEmail: 'rjohnson@example.com',
        contactPhone: '(555) 234-5678',
        assignedStaffId: 'staff-001',
        assignedStaffName: 'John Director',
        locationId: 'loc-001',
        locationName: 'Main Chapel - Conference Room',
        notes: 'First pre-planning consultation',
        reminders: {
          email: true,
          sms: true,
          sentAt: new Date('2024-12-09T10:00:00'),
        },
        createdBy: 'staff-001',
        createdAt: new Date('2024-12-01T09:30:00'),
        updatedAt: new Date('2024-12-01T09:30:00'),
      };
    }),

  /**
   * Create appointment
   */
  createAppointment: staffProcedure
    .input(
      z.object({
        funeralHomeId: z.string(),
        type: z.enum(['pre-planning', 'arrangement', 'service-review', 'monument-selection', 'other']),
        scheduledAt: z.date(),
        duration: z.number().min(15).max(480), // 15 minutes to 8 hours
        contactId: z.string(),
        assignedStaffId: z.string(),
        locationId: z.string(),
        notes: z.string().optional(),
        caseId: z.string().optional(),
        reminders: z.object({
          email: z.boolean(),
          sms: z.boolean(),
        }).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Mock create - will be replaced with real creation
      const id = `appt-${Date.now()}`;
      return {
        id,
        ...input,
        status: 'scheduled' as const,
        reminders: input.reminders || { email: false, sms: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),

  /**
   * Update appointment
   */
  updateAppointment: staffProcedure
    .input(
      z.object({
        id: z.string(),
        scheduledAt: z.date().optional(),
        duration: z.number().min(15).max(480).optional(),
        assignedStaffId: z.string().optional(),
        locationId: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Mock update - will be replaced with real update
      return {
        id: input.id,
        updatedAt: new Date(),
      };
    }),

  /**
   * Update appointment status
   */
  updateAppointmentStatus: staffProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show']),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Mock status update
      return {
        id: input.id,
        status: input.status,
        updatedAt: new Date(),
        ...(input.status === 'completed' && { completedAt: new Date() }),
        ...(input.status === 'cancelled' && { cancelledAt: new Date() }),
      };
    }),

  /**
   * Cancel appointment
   */
  cancelAppointment: staffProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Mock cancel
      return {
        id: input.id,
        status: 'cancelled' as const,
        cancelledAt: new Date(),
        cancelReason: input.reason,
      };
    }),

  /**
   * Get available time slots
   */
  getAvailableSlots: staffProcedure
    .input(
      z.object({
        funeralHomeId: z.string(),
        date: z.date(),
        staffId: z.string().optional(),
        locationId: z.string().optional(),
        duration: z.number().min(15).max(480),
      })
    )
    .query(async ({ input }) => {
      // Mock available slots - will be replaced with real availability check
      const slots = [];
      const startHour = 9; // 9 AM
      const endHour = 17; // 5 PM
      
      for (let hour = startHour; hour < endHour; hour++) {
        for (const minute of [0, 30]) {
          const slotTime = new Date(input.date);
          slotTime.setHours(hour, minute, 0, 0);
          
          // Mock availability - every other slot
          const isAvailable = (hour + minute / 30) % 2 === 0;
          
          if (isAvailable) {
            slots.push({
              startTime: slotTime,
              endTime: new Date(slotTime.getTime() + input.duration * 60000),
              available: true,
            });
          }
        }
      }
      
      return slots;
    }),
});
