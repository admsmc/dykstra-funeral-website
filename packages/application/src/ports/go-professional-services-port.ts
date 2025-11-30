/**
 * Professional Services Port
 * 
 * Handles case-based engagement tracking and timesheet submission/approval
 * for professional services hours worked on funeral cases.
 */

import { Effect, Context } from 'effect';
import { NetworkError } from './go-contract-port';

// Re-export for convenience
export { NetworkError };

export interface GoPSEngagement {
  readonly id: string;
  readonly caseId: string;
  readonly employeeId: string;
  readonly role: string;
  readonly startDate: Date;
  readonly endDate?: Date;
  readonly status: 'active' | 'completed';
  readonly billable: boolean;
  readonly hourlyRate?: number;
}

export interface GoPSTimesheet {
  readonly id: string;
  readonly employeeId: string;
  readonly weekEnding: Date;
  readonly entries: readonly GoPSTimesheetEntry[];
  readonly totalHours: number;
  readonly status: 'draft' | 'submitted' | 'approved' | 'rejected';
}

export interface GoPSTimesheetEntry {
  readonly caseId: string;
  readonly date: Date;
  readonly hours: number;
  readonly description: string;
}

export interface GoProfessionalServicesPortService {
  readonly createEngagement: (caseId: string, employeeId: string, role: string) => 
    Effect.Effect<GoPSEngagement, NetworkError>;
  readonly submitTimesheet: (employeeId: string, entries: readonly GoPSTimesheetEntry[]) => 
    Effect.Effect<GoPSTimesheet, NetworkError>;
  readonly approveTimesheet: (timesheetId: string) => 
    Effect.Effect<void, NetworkError>;
  readonly getCaseEngagements: (caseId: string) => 
    Effect.Effect<readonly GoPSEngagement[], NetworkError>;
}

export const GoProfessionalServicesPort = Context.GenericTag<GoProfessionalServicesPortService>(
  '@dykstra/GoProfessionalServicesPort'
);
