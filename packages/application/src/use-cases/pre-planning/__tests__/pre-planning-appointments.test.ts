import { describe, it, expect } from 'vitest';
import { Effect } from 'effect';
import { PrePlanningAppointment } from '@dykstra/domain';

/**
 * Comprehensive Test Suite: Pre-Planning Appointment Scheduling
 * 
 * Tests cover:
 * - Domain entity creation and validation
 * - Business rule enforcement
 * - State transitions
 * - Error handling
 * - Edge cases
 */

describe('PrePlanningAppointment', () => {
  /**
   * Test appointment creation
   */
  describe('creation', () => {
    it('should create appointment with valid inputs', () => {
      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: new Date('2025-12-15'),
        startTime: new Date('2025-12-15T14:00:00'),
        endTime: new Date('2025-12-15T15:00:00'),
        createdBy: 'user-456',
      });

      expect(appointment.directorId).toBe('dir-123');
      expect(appointment.status).toBe('scheduled');
      expect(appointment.reminderEmailSent).toBe(false);
      expect(appointment.duration).toBe(60);
    });

    it('should set correct duration for appointment', () => {
      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: new Date('2025-12-15'),
        startTime: new Date('2025-12-15T14:00:00'),
        endTime: new Date('2025-12-15T16:30:00'), // 2.5 hours
        createdBy: 'user-456',
      });

      expect(appointment.duration).toBe(150); // 2.5 hours = 150 minutes
    });
  });

  /**
   * Test business day validation
   */
  describe('business day validation', () => {
    it('should allow appointments on weekdays (Monday)', () => {
      const monday = new Date(2025, 11, 8); // Monday Dec 8, 2025
      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: monday,
        startTime: new Date(2025, 11, 8, 14, 0, 0),
        endTime: new Date(2025, 11, 8, 15, 0, 0),
        createdBy: 'user-456',
      });

      expect(appointment.isOnBusinessDay()).toBe(true);
    });

    it('should reject appointments on Saturday', () => {
      const saturday = new Date(2025, 11, 6); // Saturday Dec 6, 2025
      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: saturday,
        startTime: new Date(2025, 11, 6, 14, 0, 0),
        endTime: new Date(2025, 11, 6, 15, 0, 0),
        createdBy: 'user-456',
      });

      expect(appointment.isOnBusinessDay()).toBe(false);
    });

    it('should reject appointments on Sunday', () => {
      const sunday = new Date(2025, 11, 7); // Sunday Dec 7, 2025
      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: sunday,
        startTime: new Date(2025, 11, 7, 14, 0, 0),
        endTime: new Date(2025, 11, 7, 15, 0, 0),
        createdBy: 'user-456',
      });

      expect(appointment.isOnBusinessDay()).toBe(false);
    });
  });

  /**
   * Test business hours validation
   */
  describe('business hours validation', () => {
    it('should allow appointment within business hours (9am-4pm)', () => {
      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: new Date('2025-12-15'),
        startTime: new Date('2025-12-15T09:00:00'),
        endTime: new Date('2025-12-15T10:00:00'),
        createdBy: 'user-456',
      });

      expect(appointment.isWithinBusinessHours()).toBe(true);
    });

    it('should reject appointment before 8am', () => {
      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: new Date('2025-12-15'),
        startTime: new Date('2025-12-15T07:00:00'),
        endTime: new Date('2025-12-15T08:00:00'),
        createdBy: 'user-456',
      });

      expect(appointment.isWithinBusinessHours()).toBe(false);
    });

    it('should reject appointment after 5pm', () => {
      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: new Date(2025, 11, 8),
        startTime: new Date(2025, 11, 8, 16, 30, 0),
        endTime: new Date(2025, 11, 8, 17, 30, 0),
        createdBy: 'user-456',
      });

      expect(appointment.isWithinBusinessHours()).toBe(false);
    });

    it('should reject appointment less than 1 hour', () => {
      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: new Date('2025-12-15'),
        startTime: new Date('2025-12-15T14:00:00'),
        endTime: new Date('2025-12-15T14:30:00'),
        createdBy: 'user-456',
      });

      expect(appointment.isWithinBusinessHours()).toBe(false);
    });
  });

  /**
   * Test lunch break overlap detection
   */
  describe('lunch break validation (12pm-1pm)', () => {
    it('should allow appointment before lunch (11am-12pm)', () => {
      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: new Date('2025-12-15'),
        startTime: new Date('2025-12-15T11:00:00'),
        endTime: new Date('2025-12-15T12:00:00'),
        createdBy: 'user-456',
      });

      expect(appointment.overlapsWithLunch()).toBe(false);
    });

    it('should allow appointment after lunch (1pm-2pm)', () => {
      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: new Date('2025-12-15'),
        startTime: new Date('2025-12-15T13:00:00'),
        endTime: new Date('2025-12-15T14:00:00'),
        createdBy: 'user-456',
      });

      expect(appointment.overlapsWithLunch()).toBe(false);
    });

    it('should reject appointment during lunch (12pm-1pm)', () => {
      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: new Date('2025-12-15'),
        startTime: new Date('2025-12-15T12:00:00'),
        endTime: new Date('2025-12-15T13:00:00'),
        createdBy: 'user-456',
      });

      expect(appointment.overlapsWithLunch()).toBe(true);
    });

    it('should reject appointment overlapping lunch start', () => {
      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: new Date('2025-12-15'),
        startTime: new Date('2025-12-15T11:30:00'),
        endTime: new Date('2025-12-15T12:30:00'),
        createdBy: 'user-456',
      });

      expect(appointment.overlapsWithLunch()).toBe(true);
    });
  });

  /**
   * Test appointment overlap detection
   */
  describe('appointment overlap detection', () => {
    it('should detect overlapping appointments', () => {
      const apt1 = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Family A',
        familyEmail: 'familya@example.com',
        familyPhone: '(555) 111-1111',
        appointmentDate: new Date('2025-12-15'),
        startTime: new Date('2025-12-15T14:00:00'),
        endTime: new Date('2025-12-15T15:00:00'),
        createdBy: 'user-456',
      });

      const apt2 = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Family B',
        familyEmail: 'familyb@example.com',
        familyPhone: '(555) 222-2222',
        appointmentDate: new Date('2025-12-15'),
        startTime: new Date('2025-12-15T14:30:00'),
        endTime: new Date('2025-12-15T15:30:00'),
        createdBy: 'user-456',
      });

      expect(apt1.overlaps(apt2)).toBe(true);
    });

    it('should not overlap when appointments are back-to-back', () => {
      const apt1 = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Family A',
        familyEmail: 'familya@example.com',
        familyPhone: '(555) 111-1111',
        appointmentDate: new Date('2025-12-15'),
        startTime: new Date('2025-12-15T14:00:00'),
        endTime: new Date('2025-12-15T15:00:00'),
        createdBy: 'user-456',
      });

      const apt2 = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Family B',
        familyEmail: 'familyb@example.com',
        familyPhone: '(555) 222-2222',
        appointmentDate: new Date('2025-12-15'),
        startTime: new Date('2025-12-15T15:00:00'),
        endTime: new Date('2025-12-15T16:00:00'),
        createdBy: 'user-456',
      });

      expect(apt1.overlaps(apt2)).toBe(false);
    });

    it('should not overlap on different days', () => {
      const apt1 = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Family A',
        familyEmail: 'familya@example.com',
        familyPhone: '(555) 111-1111',
        appointmentDate: new Date('2025-12-15'),
        startTime: new Date('2025-12-15T14:00:00'),
        endTime: new Date('2025-12-15T15:00:00'),
        createdBy: 'user-456',
      });

      const apt2 = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Family B',
        familyEmail: 'familyb@example.com',
        familyPhone: '(555) 222-2222',
        appointmentDate: new Date('2025-12-16'),
        startTime: new Date('2025-12-16T14:00:00'),
        endTime: new Date('2025-12-16T15:00:00'),
        createdBy: 'user-456',
      });

      expect(apt1.overlaps(apt2)).toBe(false);
    });
  });

  /**
   * Test appointment state transitions
   */
  describe('state transitions', () => {
    it('should transition from scheduled to confirmed', () => {
      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: new Date('2025-12-15'),
        startTime: new Date('2025-12-15T14:00:00'),
        endTime: new Date('2025-12-15T15:00:00'),
        createdBy: 'user-456',
      });

      const confirmed = appointment.confirm();
      expect(confirmed.status).toBe('confirmed');
      expect(confirmed.version).toBe(2);
    });

    it('should transition from scheduled to cancelled', () => {
      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: new Date('2025-12-15'),
        startTime: new Date('2025-12-15T14:00:00'),
        endTime: new Date('2025-12-15T15:00:00'),
        createdBy: 'user-456',
      });

      const cancelled = appointment.cancel('Family requested cancellation', 'user-789');
      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.cancelReason).toBe('Family requested cancellation');
    });

    it('should transition from confirmed to completed', () => {
      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: new Date('2025-12-15'),
        startTime: new Date('2025-12-15T14:00:00'),
        endTime: new Date('2025-12-15T15:00:00'),
        createdBy: 'user-456',
      });

      const confirmed = appointment.confirm();
      const completed = confirmed.complete();
      expect(completed.status).toBe('completed');
      expect(completed.completedAt).not.toBeNull();
    });
  });

  /**
   * Test 24-hour cancellation rule
   */
  describe('24-hour cancellation rule', () => {
    it('should allow cancellation when 24+ hours away', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2); // 2 days away

      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: futureDate,
        startTime: new Date(futureDate.getTime()),
        endTime: new Date(futureDate.getTime() + 60 * 60 * 1000),
        createdBy: 'user-456',
      });

      expect(appointment.canBeCancelled()).toBe(true);
    });

    it('should reject cancellation when less than 24 hours away', () => {
      const nearDate = new Date();
      nearDate.setHours(nearDate.getHours() + 12); // 12 hours away

      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: nearDate,
        startTime: new Date(nearDate.getTime()),
        endTime: new Date(nearDate.getTime() + 60 * 60 * 1000),
        createdBy: 'user-456',
      });

      expect(appointment.canBeCancelled()).toBe(false);
    });
  });

  /**
   * Test reminder notification tracking
   */
  describe('reminder notifications', () => {
    it('should need email reminder when 24-36 hours away', () => {
      const reminderDate = new Date();
      reminderDate.setHours(reminderDate.getHours() + 25); // 25 hours away

      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: reminderDate,
        startTime: new Date(reminderDate.getTime()),
        endTime: new Date(reminderDate.getTime() + 60 * 60 * 1000),
        createdBy: 'user-456',
      });

      expect(appointment.needsEmailReminder()).toBe(true);
    });

    it('should record email reminder sent', () => {
      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: new Date('2025-12-15'),
        startTime: new Date('2025-12-15T14:00:00'),
        endTime: new Date('2025-12-15T15:00:00'),
        createdBy: 'user-456',
      });

      const updated = appointment.recordEmailReminderSent();
      expect(updated.reminderEmailSent).toBe(true);
    });
  });

  /**
   * Test past appointment detection
   */
  describe('past appointment detection', () => {
    it('should detect when appointment is in the past', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: pastDate,
        startTime: new Date(pastDate.getTime()),
        endTime: new Date(pastDate.getTime() + 60 * 60 * 1000),
        createdBy: 'user-456',
      });

      expect(appointment.isInThePast()).toBe(true);
    });
  });

  /**
   * Test error scenarios
   */
  describe('error scenarios', () => {
    it('should not allow completing already completed appointment', () => {
      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: new Date('2025-12-15'),
        startTime: new Date('2025-12-15T14:00:00'),
        endTime: new Date('2025-12-15T15:00:00'),
        createdBy: 'user-456',
      });

      const completed = appointment.complete();
      expect(() => completed.complete()).toThrow();
    });

    it('should not allow cancelling already cancelled appointment', () => {
      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: new Date('2025-12-15'),
        startTime: new Date('2025-12-15T14:00:00'),
        endTime: new Date('2025-12-15T15:00:00'),
        createdBy: 'user-456',
      });

      const cancelled = appointment.cancel('Initial cancellation', 'user-789');
      expect(() => cancelled.cancel('Second cancellation', 'user-789')).toThrow();
    });

    it('should not allow cancelling completed appointment', () => {
      const appointment = PrePlanningAppointment.create({
        directorId: 'dir-123',
        directorName: 'John Smith',
        familyName: 'Johnson Family',
        familyEmail: 'family@example.com',
        familyPhone: '(555) 123-4567',
        appointmentDate: new Date('2025-12-15'),
        startTime: new Date('2025-12-15T14:00:00'),
        endTime: new Date('2025-12-15T15:00:00'),
        createdBy: 'user-456',
      });

      const completed = appointment.complete();
      expect(() => completed.cancel('Cancellation attempt', 'user-789')).toThrow();
    });
  });
});
