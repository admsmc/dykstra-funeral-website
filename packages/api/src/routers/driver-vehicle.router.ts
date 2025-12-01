import { z } from 'zod';
import { router, directorProcedure, staffProcedure } from '../trpc';
import {
  assignDriver,
  assignVehicle,
  recordMileage,
  checkDriverAvailability,
  checkVehicleAvailability,
  listDriverSchedule,
  dispatchDriver,
} from '@dykstra/application';
import { runEffect } from '../utils/effect-runner';

/**
 * Driver/Vehicle Coordination Router
 *
 * Manages driver assignments to removals/transfers/processions
 * and vehicle fleet coordination including maintenance and mileage tracking
 */
export const driverVehicleRouter = router({
  /**
   * Assign a driver to an event
   * Director endpoint - creates new assignment
   */
  assignDriver: directorProcedure
    .input(
      z.object({
        driverId: z.string(),
        eventType: z.enum(['removal', 'transfer', 'procession']),
        caseId: z.string(),
        funeralHomeId: z.string(),
        pickupLocation: z.object({
          address: z.string(),
          city: z.string(),
          state: z.string(),
          zipCode: z.string(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
        }),
        dropoffLocation: z.object({
          address: z.string(),
          city: z.string(),
          state: z.string(),
          zipCode: z.string(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
        }),
        scheduledTime: z.date(),
        estimatedDuration: z.number().int().min(15).max(240), // minutes
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await runEffect(
        assignDriver({
          driverId: input.driverId,
          eventType: input.eventType as any,
          caseId: input.caseId,
          funeralHomeId: input.funeralHomeId,
          pickupLocation: input.pickupLocation,
          dropoffLocation: input.dropoffLocation,
          scheduledTime: input.scheduledTime,
          estimatedDuration: input.estimatedDuration,
          createdBy: ctx.user.id,
          notes: input.notes,
        }) as any
      );

      return {
        assignmentId: (result as any).assignmentId,
        driverId: (result as any).driverId,
        status: (result as any).status,
        notificationSent: (result as any).notificationSent,
      };
    }),

  /**
   * Assign a vehicle to an event
   * Director endpoint - validates vehicle readiness
   */
  assignVehicle: directorProcedure
    .input(
      z.object({
        vehicleId: z.string(),
        driverId: z.string(),
        caseId: z.string(),
        funeralHomeId: z.string(),
        scheduledTime: z.date(),
        estimatedDuration: z.number().int().min(15), // minutes
        requiredCapacity: z.number().int().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await runEffect(
        assignVehicle({
          vehicleId: input.vehicleId,
          driverId: input.driverId,
          caseId: input.caseId,
          funeralHomeId: input.funeralHomeId,
          scheduledTime: input.scheduledTime,
          estimatedDuration: input.estimatedDuration,
          requiredCapacity: input.requiredCapacity,
          createdBy: ctx.user.id,
        }) as any
      );

      return {
        vehicleId: (result as any).vehicleId,
        vehicleType: (result as any).vehicleType,
        licensePlate: (result as any).licensePlate,
        status: (result as any).status,
        assignmentConfirmed: (result as any).assignmentConfirmed,
      };
    }),

  /**
   * Record mileage for a completed assignment
   * Staff endpoint - for payroll/reimbursement
   */
  recordMileage: staffProcedure
    .input(
      z.object({
        assignmentId: z.string(),
        vehicleId: z.string(),
        mileageStart: z.number().int().min(0),
        mileageEnd: z.number().int().min(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await runEffect(
        recordMileage({
          assignmentId: input.assignmentId,
          vehicleId: input.vehicleId,
          mileageStart: input.mileageStart,
          mileageEnd: input.mileageEnd,
          recordedBy: ctx.user.id,
        }) as any
      );

      return {
        assignmentId: (result as any).assignmentId,
        mileageDelta: (result as any).mileageDelta,
        allowanceAmount: (result as any).allowanceAmount,
        recorded: (result as any).recorded,
      };
    }),

  /**
   * Check if a driver is available during a time window
   * Director endpoint - for scheduling decisions
   */
  checkDriverAvailability: directorProcedure
    .input(
      z.object({
        driverId: z.string(),
        scheduledTime: z.date(),
        estimatedDuration: z.number().int().min(15), // minutes
        bufferTime: z.number().int().optional(), // minutes
      })
    )
    .query(async ({ input }) => {
      const result = await runEffect(
        checkDriverAvailability({
          driverId: input.driverId,
          scheduledTime: input.scheduledTime,
          estimatedDuration: input.estimatedDuration,
          bufferTime: input.bufferTime,
        }) as any
      );

      return {
        driverId: (result as any).driverId,
        isAvailable: (result as any).isAvailable,
        conflicts: (result as any).conflicts,
        nextAvailableTime: (result as any).nextAvailableTime,
        conflictMessage: (result as any).conflictMessage,
      };
    }),

  /**
   * Check if a vehicle is available and ready for assignment
   * Director endpoint - for vehicle selection
   */
  checkVehicleAvailability: directorProcedure
    .input(
      z.object({
        vehicleId: z.string(),
        scheduledTime: z.date(),
        estimatedDuration: z.number().int().min(15), // minutes
        requiredCapacity: z.number().int().optional(),
        bufferTime: z.number().int().optional(), // minutes
      })
    )
    .query(async ({ input }) => {
      const result = await runEffect(
        checkVehicleAvailability({
          vehicleId: input.vehicleId,
          scheduledTime: input.scheduledTime,
          estimatedDuration: input.estimatedDuration,
          requiredCapacity: input.requiredCapacity,
          bufferTime: input.bufferTime,
        }) as any
      );

      return {
        vehicleId: (result as any).vehicleId,
        isAvailable: (result as any).isAvailable,
        status: (result as any).status,
        hasMaintenance: (result as any).hasMaintenance,
        hasExpiredInspection: (result as any).hasExpiredInspection,
        capacityAdequate: (result as any).capacityAdequate,
        nextAvailableTime: (result as any).nextAvailableTime,
        readinessMessage: (result as any).readinessMessage,
      };
    }),

  /**
   * List driver's schedule for a date range
   * Director/Staff endpoint - view driver's assignments
   */
  listDriverSchedule: staffProcedure
    .input(
      z.object({
        driverId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        includeSummary: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const result = await runEffect(
        listDriverSchedule({
          driverId: input.driverId,
          startDate: input.startDate,
          endDate: input.endDate,
          includeSummary: input.includeSummary,
        }) as any
      );

      return {
        driverId: (result as any).driverId,
        assignments: (result as any).assignments,
        totalAssignments: (result as any).totalAssignments,
        totalScheduledMinutes: (result as any).totalScheduledMinutes,
        daySummaries: (result as any).daySummaries,
      };
    }),

  /**
   * Dispatch driver with notification
   * Director endpoint - sends dispatch notification to driver
   */
  dispatch: directorProcedure
    .input(
      z.object({
        assignmentId: z.string(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await runEffect(
        dispatchDriver({
          assignmentId: input.assignmentId,
          message: input.message,
          dispatchedBy: ctx.user.id,
        }) as any
      );

      return {
        assignmentId: (result as any).assignmentId,
        status: (result as any).status,
        notificationSent: (result as any).notificationSent,
        messageId: (result as any).messageId,
      };
    }),
});
