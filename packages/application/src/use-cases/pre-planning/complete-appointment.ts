import { Effect } from 'effect';
import { AppointmentError } from '@dykstra/domain';
import type { PrePlanningAppointmentRepository } from '../../ports/pre-planning-appointment-repository';
import {
  PrePlanningAppointmentRepositoryTag,
  RepositoryError,
  AppointmentNotFoundError,
} from '../../ports/pre-planning-appointment-repository';

/**
 * Complete Appointment Use Case
 *
 * Business Rules:
 * - Only scheduled or confirmed appointments can be completed
 * - Cannot complete already completed appointments
 * - Cannot complete cancelled or no-show appointments
 * - Records actual end time (if different from scheduled)
 * - Allows notes about the appointment
 */

/**
 * Complete Appointment
 *
 * Policy Type: Type B
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A
 * Persisted In: N/A
 * Go Backend: YES
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

export class CompleteAppointmentError extends Error {
  readonly _tag = 'CompleteAppointmentError' as const;
  constructor(
    message: string,
    override readonly cause?: unknown
  ) {
    super(message);
  }
}

export interface CompleteAppointmentCommand {
  readonly appointmentId: string;
  readonly actualEndTime?: Date;  // If appointment ended early/late
  readonly notes?: string;  // Notes about the appointment
  readonly completedBy: string;
}

export interface CompleteAppointmentResult {
  readonly appointmentId: string;
  readonly status: string;
  readonly completedAt: Date;
  readonly duration: number;  // Actual duration in minutes
}

/**
 * Mark a pre-planning appointment as completed
 *
 * Validates:
 * 1. Appointment exists
 * 2. Appointment is not already completed
 * 3. Appointment is not cancelled or no-show
 * 4. Records actual end time if provided
 * 5. Optionally records notes
 */
export const completeAppointment = (
  command: CompleteAppointmentCommand
): Effect.Effect<
  CompleteAppointmentResult,
  | CompleteAppointmentError
  | AppointmentError
  | RepositoryError
  | AppointmentNotFoundError,
  PrePlanningAppointmentRepository
> =>
  Effect.gen(function* () {
    const repository = yield* PrePlanningAppointmentRepositoryTag;

    // Find the appointment
    const appointment = yield* repository.findById(command.appointmentId as any);

    // Check if appointment is already completed
    if (appointment.status === 'completed') {
      return yield* Effect.fail(
        new CompleteAppointmentError(
          'Appointment is already completed'
        )
      );
    }

    // Check if appointment is cancelled
    if (appointment.status === 'cancelled') {
      return yield* Effect.fail(
        new CompleteAppointmentError(
          'Cannot complete a cancelled appointment'
        )
      );
    }

    // Check if appointment is no-show
    if (appointment.status === 'no-show') {
      return yield* Effect.fail(
        new CompleteAppointmentError(
          'Cannot complete a no-show appointment'
        )
      );
    }

    // Complete the appointment
    const completedAppointment = appointment.complete(
      command.actualEndTime,
      command.notes
    );

    // Save the completion
    yield* repository.update(completedAppointment);

    // Calculate actual duration
    const actualDuration = command.actualEndTime
      ? (command.actualEndTime.getTime() - appointment.startTime.getTime()) / (1000 * 60)
      : appointment.duration;

    return {
      appointmentId: command.appointmentId,
      status: 'completed',
      completedAt: completedAppointment.completedAt!,
      duration: actualDuration,
    };
  });
