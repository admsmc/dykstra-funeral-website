import { describe, it, expect, beforeEach } from 'vitest';
import { Effect } from 'effect';
import {
  DriverAssignment,
  Vehicle,
  AssignmentId,
  DriverId,
  VehicleId,
  Location,
} from '@dykstra/domain';

/**
 * Comprehensive Test Suite: Driver/Vehicle Coordination (Scenario 7)
 *
 * Tests cover:
 * - Domain entity creation and validation
 * - Driver assignment scheduling with rest period enforcement
 * - Vehicle availability and readiness checks
 * - Mileage tracking and reimbursement calculation
 * - Business rule enforcement
 * - Error handling
 * - Edge cases
 */

describe('DriverAssignment', () => {
  let funeralHomeId: string;
  let driverId: DriverId;
  let caseId: string;
  let pickupLocation: Location;
  let dropoffLocation: Location;

  beforeEach(() => {
    funeralHomeId = 'fh-123';
    driverId = 'driver-456' as any;
    caseId = 'case-789';
    pickupLocation = {
      address: '123 Oak St',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      latitude: 39.7817,
      longitude: -89.6501,
    };
    dropoffLocation = {
      address: '456 Pine Ave',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62702',
      latitude: 39.7825,
      longitude: -89.6495,
    };
  });

  describe('creation', () => {
    it('should create assignment with valid inputs', () => {
      const now = new Date();
      const scheduledTime = new Date(now.getTime() + 3600000); // 1 hour from now

      const assignment = new DriverAssignment({
        id: 'assign-001' as AssignmentId,
        businessKey: `${funeralHomeId}:removal_${caseId}:${driverId}`,
        version: 1,
        funeralHomeId: funeralHomeId as any,
        driverId,
        eventType: 'removal',
        caseId: caseId as any,
        pickupLocation,
        dropoffLocation,
        scheduledTime,
        estimatedDuration: 60,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-001',
      });

      expect(assignment.driverId).toBe(driverId);
      expect(assignment.status).toBe('pending');
      expect(assignment.estimatedDuration).toBe(60);
      expect(assignment.isActive()).toBe(true);
    });

    it('should calculate mileage when start and end recorded', () => {
      const now = new Date();
      const assignment = new DriverAssignment({
        id: 'assign-001' as AssignmentId,
        businessKey: `${funeralHomeId}:removal_${caseId}:${driverId}`,
        version: 1,
        funeralHomeId: funeralHomeId as any,
        driverId,
        eventType: 'removal',
        caseId: caseId as any,
        pickupLocation,
        dropoffLocation,
        scheduledTime: new Date(now.getTime() + 3600000),
        estimatedDuration: 60,
        status: 'completed',
        mileageStart: 12500,
        mileageEnd: 12545,
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-001',
      });

      expect(assignment.calculateMileage()).toBe(45);
    });

    it('should calculate mileage allowance at $0.655/mile', () => {
      const now = new Date();
      const assignment = new DriverAssignment({
        id: 'assign-001' as AssignmentId,
        businessKey: `${funeralHomeId}:removal_${caseId}:${driverId}`,
        version: 1,
        funeralHomeId: funeralHomeId as any,
        driverId,
        eventType: 'removal',
        caseId: caseId as any,
        pickupLocation,
        dropoffLocation,
        scheduledTime: new Date(now.getTime() + 3600000),
        estimatedDuration: 60,
        status: 'completed',
        mileageStart: 12500,
        mileageEnd: 12550, // 50 miles
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-001',
      });

      const allowance = assignment.calculateMileageAllowance();
      expect(allowance).toBe(50 * 0.655); // ~32.75
    });

    it('should return undefined mileage if not recorded', () => {
      const now = new Date();
      const assignment = new DriverAssignment({
        id: 'assign-001' as AssignmentId,
        businessKey: `${funeralHomeId}:removal_${caseId}:${driverId}`,
        version: 1,
        funeralHomeId: funeralHomeId as any,
        driverId,
        eventType: 'removal',
        caseId: caseId as any,
        pickupLocation,
        dropoffLocation,
        scheduledTime: new Date(now.getTime() + 3600000),
        estimatedDuration: 60,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-001',
      });

      expect(assignment.calculateMileage()).toBeUndefined();
      expect(assignment.calculateMileageAllowance()).toBeUndefined();
    });
  });

  describe('overlap detection (1-hour rest period)', () => {
    it('should correctly calculate scheduled end time for overlap checking', () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 3600000);
      const assignment = new DriverAssignment({
        id: 'assign-001' as AssignmentId,
        businessKey: `${funeralHomeId}:removal_${caseId}:${driverId}`,
        version: 1,
        funeralHomeId: funeralHomeId as any,
        driverId,
        eventType: 'removal',
        caseId: caseId as any,
        pickupLocation,
        dropoffLocation,
        scheduledTime: startTime,
        estimatedDuration: 90,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-001',
      });

      const endTime = assignment.getScheduledEndTime();
      expect(endTime.getTime()).toBe(startTime.getTime() + 90 * 60000);
    });

    it('should properly detect overlapping assignments', () => {
      const now = new Date();
      const assignment1 = new DriverAssignment({
        id: 'assign-001' as AssignmentId,
        businessKey: `${funeralHomeId}:removal_${caseId}:${driverId}`,
        version: 1,
        funeralHomeId: funeralHomeId as any,
        driverId,
        eventType: 'removal',
        caseId: caseId as any,
        pickupLocation,
        dropoffLocation,
        scheduledTime: new Date(now.getTime() + 3600000), // 1 hour from now
        estimatedDuration: 60,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-001',
      });

      // Test: 30 minutes after current assignment ends should overlap with 1-hour buffer
      const otherStart = new Date(now.getTime() + 7200000); // 2 hours
      const otherDuration = 60;

      const overlaps = assignment1.overlapsWithTimeWindow(otherStart, otherDuration, 60);
      expect(overlaps).toBe(true); // Should overlap with 1-hour buffer
    });
  });

  describe('status tracking', () => {
    it('should identify active assignments', () => {
      const now = new Date();
      const pending = new DriverAssignment({
        id: 'assign-001' as AssignmentId,
        businessKey: `${funeralHomeId}:removal_${caseId}:${driverId}`,
        version: 1,
        funeralHomeId: funeralHomeId as any,
        driverId,
        eventType: 'removal',
        caseId: caseId as any,
        pickupLocation,
        dropoffLocation,
        scheduledTime: new Date(now.getTime() + 3600000),
        estimatedDuration: 60,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-001',
      });

      expect(pending.isActive()).toBe(true);
    });

    it('should identify completed assignments as inactive', () => {
      const now = new Date();
      const completed = new DriverAssignment({
        id: 'assign-001' as AssignmentId,
        businessKey: `${funeralHomeId}:removal_${caseId}:${driverId}`,
        version: 1,
        funeralHomeId: funeralHomeId as any,
        driverId,
        eventType: 'removal',
        caseId: caseId as any,
        pickupLocation,
        dropoffLocation,
        scheduledTime: new Date(now.getTime() - 7200000),
        estimatedDuration: 60,
        status: 'completed',
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-001',
      });

      expect(completed.isActive()).toBe(false);
    });

    it('should identify cancelled assignments as inactive', () => {
      const now = new Date();
      const cancelled = new DriverAssignment({
        id: 'assign-001' as AssignmentId,
        businessKey: `${funeralHomeId}:removal_${caseId}:${driverId}`,
        version: 1,
        funeralHomeId: funeralHomeId as any,
        driverId,
        eventType: 'removal',
        caseId: caseId as any,
        pickupLocation,
        dropoffLocation,
        scheduledTime: new Date(now.getTime() + 3600000),
        estimatedDuration: 60,
        status: 'cancelled',
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-001',
      });

      expect(cancelled.isActive()).toBe(false);
    });
  });

  describe('duration validation', () => {
    it('should calculate end time correctly', () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 3600000);
      const assignment = new DriverAssignment({
        id: 'assign-001' as AssignmentId,
        businessKey: `${funeralHomeId}:removal_${caseId}:${driverId}`,
        version: 1,
        funeralHomeId: funeralHomeId as any,
        driverId,
        eventType: 'removal',
        caseId: caseId as any,
        pickupLocation,
        dropoffLocation,
        scheduledTime: startTime,
        estimatedDuration: 90, // 1.5 hours
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-001',
      });

      const endTime = assignment.getScheduledEndTime();
      expect(endTime.getTime()).toBe(startTime.getTime() + 90 * 60000);
    });
  });
});

describe('Vehicle', () => {
  let funeralHomeId: string;
  let now: Date;

  beforeEach(() => {
    funeralHomeId = 'fh-123';
    now = new Date();
  });

  describe('creation', () => {
    it('should create vehicle with valid inputs', () => {
      const vehicle = new Vehicle({
        id: 'veh-001' as VehicleId,
        businessKey: `${funeralHomeId}:ABC-1234`,
        version: 1,
        funeralHomeId,
        name: 'Hearse #1',
        licensePlate: 'ABC-1234',
        vin: 'WBADT43492G906186',
        year: 2023,
        make: 'Cadillac',
        model: 'Professional',
        capacity: 'standard',
        status: 'available',
        lastMaintenanceDate: new Date(now.getTime() - 86400000 * 60),
        inspectionDueDate: new Date(now.getTime() + 86400000 * 180),
        totalMileage: 12500,
        notes: 'Primary hearse',
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-001',
      });

      expect(vehicle.licensePlate).toBe('ABC-1234');
      expect(vehicle.status).toBe('available');
      expect(vehicle.year).toBe(2023);
      expect(vehicle.make).toBe('Cadillac');
    });
  });

  describe('inspection validation', () => {
    it('should confirm current inspection when inspectionDueDate is in future', () => {
      const vehicle = new Vehicle({
        id: 'veh-001' as VehicleId,
        businessKey: `${funeralHomeId}:ABC-1234`,
        version: 1,
        funeralHomeId,
        name: 'Hearse #1',
        licensePlate: 'ABC-1234',
        vin: 'WBADT43492G906186',
        year: 2023,
        make: 'Cadillac',
        model: 'Professional',
        capacity: 'standard',
        status: 'available',
        lastMaintenanceDate: new Date(now.getTime() - 86400000 * 60),
        inspectionDueDate: new Date(now.getTime() + 86400000 * 180), // 6 months
        totalMileage: 12500,
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-001',
      });

      expect(vehicle.hasCurrentInspection()).toBe(true);
    });

    it('should flag expired inspection when inspectionDueDate is in past', () => {
      const vehicle = new Vehicle({
        id: 'veh-001' as VehicleId,
        businessKey: `${funeralHomeId}:ABC-1234`,
        version: 1,
        funeralHomeId,
        name: 'Hearse #1',
        licensePlate: 'ABC-1234',
        vin: 'WBADT43492G906186',
        year: 2023,
        make: 'Cadillac',
        model: 'Professional',
        capacity: 'standard',
        status: 'available',
        lastMaintenanceDate: new Date(now.getTime() - 86400000 * 60),
        inspectionDueDate: new Date(now.getTime() - 86400000), // Yesterday
        totalMileage: 12500,
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-001',
      });

      expect(vehicle.hasCurrentInspection()).toBe(false);
    });
  });

  describe('maintenance validation', () => {
    it('should confirm maintenance not due when lastMaintenanceDate is recent', () => {
      const vehicle = new Vehicle({
        id: 'veh-001' as VehicleId,
        businessKey: `${funeralHomeId}:ABC-1234`,
        version: 1,
        funeralHomeId,
        name: 'Hearse #1',
        licensePlate: 'ABC-1234',
        vin: 'WBADT43492G906186',
        year: 2023,
        make: 'Cadillac',
        model: 'Professional',
        capacity: 'standard',
        status: 'available',
        lastMaintenanceDate: new Date(now.getTime() - 86400000 * 30), // 30 days ago
        inspectionDueDate: new Date(now.getTime() + 86400000 * 180),
        totalMileage: 12500,
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-001',
      });

      expect(vehicle.isDueForMaintenance()).toBe(false);
    });

    it('should flag maintenance due when lastMaintenanceDate is 6+ months old', () => {
      const vehicle = new Vehicle({
        id: 'veh-001' as VehicleId,
        businessKey: `${funeralHomeId}:ABC-1234`,
        version: 1,
        funeralHomeId,
        name: 'Hearse #1',
        licensePlate: 'ABC-1234',
        vin: 'WBADT43492G906186',
        year: 2023,
        make: 'Cadillac',
        model: 'Professional',
        capacity: 'standard',
        status: 'available',
        lastMaintenanceDate: new Date(now.getTime() - 86400000 * 200), // 200 days ago (>6 months)
        inspectionDueDate: new Date(now.getTime() + 86400000 * 180),
        totalMileage: 12500,
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-001',
      });

      expect(vehicle.isDueForMaintenance()).toBe(true);
    });
  });

  describe('availability assessment', () => {
    it('should confirm vehicle ready for assignment when all criteria met', () => {
      const vehicle = new Vehicle({
        id: 'veh-001' as VehicleId,
        businessKey: `${funeralHomeId}:ABC-1234`,
        version: 1,
        funeralHomeId,
        name: 'Hearse #1',
        licensePlate: 'ABC-1234',
        vin: 'WBADT43492G906186',
        year: 2023,
        make: 'Cadillac',
        model: 'Professional',
        capacity: 'standard',
        status: 'available',
        lastMaintenanceDate: new Date(now.getTime() - 86400000 * 30),
        inspectionDueDate: new Date(now.getTime() + 86400000 * 180),
        totalMileage: 12500,
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-001',
      });

      expect(vehicle.isReadyForAssignment()).toBe(true);
    });

    it('should reject vehicle with expired inspection', () => {
      const vehicle = new Vehicle({
        id: 'veh-001' as VehicleId,
        businessKey: `${funeralHomeId}:ABC-1234`,
        version: 1,
        funeralHomeId,
        name: 'Hearse #1',
        licensePlate: 'ABC-1234',
        vin: 'WBADT43492G906186',
        year: 2023,
        make: 'Cadillac',
        model: 'Professional',
        capacity: 'standard',
        status: 'available',
        lastMaintenanceDate: new Date(now.getTime() - 86400000 * 30),
        inspectionDueDate: new Date(now.getTime() - 86400000),
        totalMileage: 12500,
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-001',
      });

      expect(vehicle.isReadyForAssignment()).toBe(false);
    });

    it('should reject vehicle with non-available status', () => {
      const vehicle = new Vehicle({
        id: 'veh-001' as VehicleId,
        businessKey: `${funeralHomeId}:ABC-1234`,
        version: 1,
        funeralHomeId,
        name: 'Hearse #1',
        licensePlate: 'ABC-1234',
        vin: 'WBADT43492G906186',
        year: 2023,
        make: 'Cadillac',
        model: 'Professional',
        capacity: 'standard',
        status: 'maintenance',
        lastMaintenanceDate: new Date(now.getTime() - 86400000 * 30),
        inspectionDueDate: new Date(now.getTime() + 86400000 * 180),
        totalMileage: 12500,
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-001',
      });

      expect(vehicle.isReadyForAssignment()).toBe(false);
    });
  };

  describe('mileage and age calculations', () => {
    it('should calculate vehicle age correctly', () => {
      const vehicle = new Vehicle({
        id: 'veh-001' as VehicleId,
        businessKey: `${funeralHomeId}:ABC-1234`,
        version: 1,
        funeralHomeId: funeralHomeId as any,
        vehicleType: 'hearse',
        licensePlate: 'ABC-1234',
        vin: 'WBADT43492G906186',
        year: 2020,
        make: 'Cadillac',
        model: 'Professional',
        color: 'Black',
        capacity: 4,
        status: 'available',
        mileageCurrentTotal: 12500,
        nextMaintenanceDate: new Date(now.getTime() + 86400000 * 30),
        nextInspectionDate: new Date(now.getTime() + 86400000 * 180),
        acquisitionDate: new Date(2023, 0, 15),
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-001',
      });

      const age = vehicle.getAge();
      expect(age).toBeGreaterThanOrEqual(4);
      expect(age).toBeLessThanOrEqual(5);
    });
  });
});
