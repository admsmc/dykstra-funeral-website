export type VehicleId = string & { readonly __brand: 'VehicleId' };
export const VehicleId = (value: string): VehicleId => value as VehicleId;

export type VehicleCapacity = 'standard' | 'expandable' | 'van' | 'truck';
export type VehicleStatus = 'available' | 'in_use' | 'maintenance' | 'retired';

/**
 * Vehicle entity for Scenario 7
 *
 * Represents a funeral home vehicle used for removals, transfers, and processions.
 * Tracks specifications, maintenance schedule, and operational status.
 * Uses SCD2 temporal pattern for audit history.
 *
 * Business Rules:
 * - Must have current safety inspection
 * - Cannot be assigned if in maintenance
 * - Cannot be assigned if inspection expired
 * - Capacity must match event type requirements
 */
export class Vehicle {
  readonly id: VehicleId;
  readonly businessKey: string;
  readonly version: number;
  readonly funeralHomeId: string;
  readonly name: string;
  readonly make: string;
  readonly model: string;
  readonly year: number;
  readonly licensePlate: string;
  readonly vin: string;
  readonly capacity: VehicleCapacity;
  readonly status: VehicleStatus;
  readonly lastMaintenanceDate?: Date;
  readonly inspectionDueDate?: Date;
  readonly totalMileage: number;
  readonly notes?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;

  constructor(props: {
    id: VehicleId;
    businessKey: string;
    version: number;
    funeralHomeId: string;
    name: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    vin: string;
    capacity: VehicleCapacity;
    status: VehicleStatus;
    lastMaintenanceDate?: Date;
    inspectionDueDate?: Date;
    totalMileage: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
  }) {
    this.id = props.id;
    this.businessKey = props.businessKey;
    this.version = props.version;
    this.funeralHomeId = props.funeralHomeId;
    this.name = props.name;
    this.make = props.make;
    this.model = props.model;
    this.year = props.year;
    this.licensePlate = props.licensePlate;
    this.vin = props.vin;
    this.capacity = props.capacity;
    this.status = props.status;
    this.lastMaintenanceDate = props.lastMaintenanceDate;
    this.inspectionDueDate = props.inspectionDueDate;
    this.totalMileage = props.totalMileage;
    this.notes = props.notes;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.createdBy = props.createdBy;
  }

  isAvailable(): boolean {
    return this.status === 'available';
  }

  hasCurrentInspection(): boolean {
    if (!this.inspectionDueDate) {
      return false;
    }
    return this.inspectionDueDate > new Date();
  }

  isReadyForAssignment(): boolean {
    return this.isAvailable() && this.hasCurrentInspection();
  }

  isDueForMaintenance(): boolean {
    if (!this.lastMaintenanceDate) {
      return true;
    }
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return this.lastMaintenanceDate < sixMonthsAgo;
  }

  isSuitableForEventType(eventType: 'removal' | 'transfer' | 'procession'): boolean {
    if (eventType === 'procession') {
      return this.capacity === 'standard' || this.capacity === 'expandable';
    }
    return true;
  }

  getDisplayName(): string {
    return `${this.name} (${this.year} ${this.make} ${this.model})`;
  }

  inspectionExpiringsSoon(): boolean {
    if (!this.inspectionDueDate) {
      return true;
    }
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return this.inspectionDueDate <= thirtyDaysFromNow;
  }

  getAge(): number {
    const now = new Date();
    return now.getFullYear() - this.year;
  }

  getStatusBadge(): string {
    switch (this.status) {
      case 'available':
        return '✓ Available';
      case 'in_use':
        return '◉ In Use';
      case 'maintenance':
        return '⚙ Maintenance';
      case 'retired':
        return '✕ Retired';
      default:
        return this.status;
    }
  }
}