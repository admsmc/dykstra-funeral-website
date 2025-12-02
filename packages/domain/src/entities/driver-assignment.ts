import { type CaseId } from './case';

export type AssignmentId = string & { readonly __brand: 'AssignmentId' };
export const AssignmentId = (value: string): AssignmentId => value as AssignmentId;

export type DriverId = string & { readonly __brand: 'DriverId' };
export const DriverId = (value: string): DriverId => value as DriverId;

export type FuneralHomeId = string & { readonly __brand: 'FuneralHomeId' };
export const FuneralHomeId = (value: string): FuneralHomeId => value as FuneralHomeId;

export interface Location {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

export type EventType = 'removal' | 'transfer' | 'procession';
export type AssignmentStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Driver Assignment entity for Scenario 7
 *
 * Represents assignment of a driver to a funeral event.
 * Uses SCD2 temporal pattern for audit history.
 *
 * Business Rules:
 * - Driver must have valid license
 * - Minimum 1-hour rest between assignments
 * - Mileage recorded within ±30 minutes of estimated duration
 */
export class DriverAssignment {
  readonly id: AssignmentId;
  readonly businessKey: string;
  readonly version: number;
  readonly funeralHomeId: FuneralHomeId;
  readonly driverId: DriverId;
  readonly vehicleId?: string;
  readonly eventType: EventType;
  readonly caseId: CaseId;
  readonly pickupLocation: Location;
  readonly dropoffLocation: Location;
  readonly scheduledTime: Date;
  readonly estimatedDuration: number;
  readonly status: AssignmentStatus;
  readonly mileageStart?: number;
  readonly mileageEnd?: number;
  readonly actualDuration?: number;
  readonly mileageAllowance?: number;
  readonly notes?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;

  constructor(props: {
    id: AssignmentId;
    businessKey: string;
    version: number;
    funeralHomeId: FuneralHomeId;
    driverId: DriverId;
    vehicleId?: string;
    eventType: EventType;
    caseId: CaseId;
    pickupLocation: Location;
    dropoffLocation: Location;
    scheduledTime: Date;
    estimatedDuration: number;
    status: AssignmentStatus;
    mileageStart?: number;
    mileageEnd?: number;
    actualDuration?: number;
    mileageAllowance?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
  }) {
    this.id = props.id;
    this.businessKey = props.businessKey;
    this.version = props.version;
    this.funeralHomeId = props.funeralHomeId;
    this.driverId = props.driverId;
    this.vehicleId = props.vehicleId;
    this.eventType = props.eventType;
    this.caseId = props.caseId;
    this.pickupLocation = props.pickupLocation;
    this.dropoffLocation = props.dropoffLocation;
    this.scheduledTime = props.scheduledTime;
    this.estimatedDuration = props.estimatedDuration;
    this.status = props.status;
    this.mileageStart = props.mileageStart;
    this.mileageEnd = props.mileageEnd;
    this.actualDuration = props.actualDuration;
    this.mileageAllowance = props.mileageAllowance;
    this.notes = props.notes;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.createdBy = props.createdBy;
  }

  isActive(): boolean {
    return this.status !== 'completed' && this.status !== 'cancelled';
  }

  calculateMileage(): number | undefined {
    if (this.mileageStart === undefined || this.mileageEnd === undefined) {
      return undefined;
    }
    return this.mileageEnd - this.mileageStart;
  }

  calculateMileageAllowance(): number | undefined {
    const mileage = this.calculateMileage();
    if (mileage === undefined) return undefined;
    return mileage * 0.655;
  }

  getScheduledEndTime(): Date {
    const endTime = new Date(this.scheduledTime);
    endTime.setMinutes(endTime.getMinutes() + this.estimatedDuration);
    return endTime;
  }

  overlapsWithTimeWindow(
    otherStart: Date,
    otherDuration: number,
    bufferMinutes: number = 60
  ): boolean {
    const thisStart = new Date(this.scheduledTime);
    thisStart.setMinutes(thisStart.getMinutes() - bufferMinutes);
    const thisEnd = this.getScheduledEndTime();
    thisEnd.setMinutes(thisEnd.getMinutes() + bufferMinutes);
    const otherEnd = new Date(otherStart);
    otherEnd.setMinutes(otherEnd.getMinutes() + otherDuration + bufferMinutes);
    const otherStartWithBuffer = new Date(otherStart);
    otherStartWithBuffer.setMinutes(otherStartWithBuffer.getMinutes() - bufferMinutes);
    return thisStart < otherEnd && otherStartWithBuffer < thisEnd;
  }
}