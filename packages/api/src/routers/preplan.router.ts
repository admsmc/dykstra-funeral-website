import { z } from 'zod';
import { router, publicProcedure, directorProcedure, staffProcedure } from '../trpc';
import {
  scheduleAppointment,
  getDirectorAvailability,
  listAppointments,
  cancelAppointment,
  completeAppointment,
  sendAppointmentReminders,
} from '@dykstra/application';
import { runEffect } from '../utils/effect-runner';

/**
 * Pre-Planning Appointment Router
 * 
 * Manages pre-need consultation appointments with funeral directors
 */
export const prePlanRouter = router({
  /**
   * Get available appointment slots for a director
   * Public endpoint - families checking availability
   */
  getAvailability: publicProcedure
    .input(
      z.object({
        directorId: z.string(),
        fromDate: z.date(),
        toDate: z.date(),
        durationMinutes: z.number().int().min(60).max(180).optional(),
      })
    )
    .query(async ({ input }) => {
      const result = await runEffect(
        getDirectorAvailability({
          directorId: input.directorId,
          fromDate: input.fromDate,
          toDate: input.toDate,
          durationMinutes: input.durationMinutes,
        })
      );

      return {
        directorId: result.directorId,
        availableSlots: result.availableSlots,
        totalSlots: result.totalSlots,
        busySlots: result.busySlots,
      };
    }),

  /**
   * Schedule a new pre-planning appointment
   * Public endpoint - families booking appointments
   */
  schedule: publicProcedure
    .input(
      z.object({
        directorId: z.string(),
        directorName: z.string(),
        familyName: z.string(),
        familyEmail: z.string().email(),
        familyPhone: z.string(),
        appointmentDate: z.date(),
        startTime: z.date(),
        endTime: z.date(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await runEffect(
        scheduleAppointment({
          directorId: input.directorId,
          directorName: input.directorName,
          familyName: input.familyName,
          familyEmail: input.familyEmail,
          familyPhone: input.familyPhone,
          appointmentDate: input.appointmentDate,
          startTime: input.startTime,
          endTime: input.endTime,
          notes: input.notes,
          createdBy: 'public-user', // TODO: Get from session
        }) as any
      );

      return {
        appointmentId: (result as any).appointmentId,
        businessKey: (result as any).businessKey,
        confirmationEmailSent: (result as any).confirmationEmailSent,
        directorNotificationSent: (result as any).directorNotificationSent,
      };
    }),

  /**
   * List appointments with optional filters
   * Director/Staff endpoint
   */
  list: directorProcedure
    .input(
      z.object({
        directorId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
        familyEmail: z.string().email().optional(),
      })
    )
    .query(async ({ input, ctx }: any) => {
      const directorId = input.directorId ?? ctx.user.id;

      const result = await runEffect(
        listAppointments({
          directorId,
          startDate: input.startDate,
          endDate: input.endDate,
          status: input.status,
          familyEmail: input.familyEmail,
        }) as any
      );

      return {
        appointments: (result as any).appointments,
        total: (result as any).total,
      };
    }),

  /**
   * Cancel an appointment (with 24-hour notice requirement)
   * Director endpoint - can cancel own appointments
   */
  cancel: directorProcedure
    .input(
      z.object({
        appointmentId: z.string(),
        reason: z.string(),
        directorEmail: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      const result = await runEffect(
        cancelAppointment({
          appointmentId: input.appointmentId,
          reason: input.reason,
          cancelledBy: ctx.user.id,
          directorEmail: input.directorEmail,
        }) as any
      );

      return {
        appointmentId: (result as any).appointmentId,
        status: (result as any).status,
        cancelledAt: (result as any).cancelledAt,
        cancellationEmailSent: (result as any).cancellationEmailSent,
      };
    }),

  /**
   * Mark appointment as completed
   * Director endpoint - after appointment concludes
   */
  complete: directorProcedure
    .input(
      z.object({
        appointmentId: z.string(),
        actualEndTime: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      const result = await runEffect(
        completeAppointment({
          appointmentId: input.appointmentId,
          actualEndTime: input.actualEndTime,
          notes: input.notes,
          completedBy: ctx.user.id,
        }) as any
      );

      return {
        appointmentId: (result as any).appointmentId,
        status: (result as any).status,
        completedAt: (result as any).completedAt,
        duration: (result as any).duration,
      };
    }),

  /**
   * Send appointment reminders (background job)
   * Staff endpoint - triggers reminder sending
   */
  sendReminders: staffProcedure
    .input(
      z.object({
        dryRun: z.boolean().optional(),
        onlyEmail: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await runEffect(
        sendAppointmentReminders({
          dryRun: input.dryRun,
          onlyEmail: input.onlyEmail,
        }) as any
      );

      return {
        total: (result as any).total,
        succeeded: (result as any).succeeded,
        failed: (result as any).failed,
        results: (result as any).results,
      };
    }),
});
