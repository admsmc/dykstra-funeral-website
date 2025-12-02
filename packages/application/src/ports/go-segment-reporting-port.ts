/**
 * Segment Reporting Port
 * 
 * Handles segment-based profitability reporting by department,
 * location, project, or custom dimensions.
 */

import { type Effect, Context } from 'effect';
import { NetworkError } from './go-contract-port';

// Re-export for convenience
export { NetworkError };

export interface GoSegment {
  readonly id: string;
  readonly segmentType: 'department' | 'location' | 'project' | 'custom';
  readonly code: string;
  readonly name: string;
}

export interface GoSegmentReport {
  readonly asOfDate: Date;
  readonly segmentType: string;
  readonly segments: readonly GoSegmentLineItem[];
}

export interface GoSegmentLineItem {
  readonly segmentCode: string;
  readonly segmentName: string;
  readonly revenue: number;
  readonly expenses: number;
  readonly netIncome: number;
}

export interface GoSegmentReportingPortService {
  readonly listSegments: (segmentType?: string) => 
    Effect.Effect<readonly GoSegment[], NetworkError>;
  readonly generateSegmentReport: (asOfDate: Date, segmentType: string) => 
    Effect.Effect<GoSegmentReport, NetworkError>;
}

export const GoSegmentReportingPort = Context.GenericTag<GoSegmentReportingPortService>(
  '@dykstra/GoSegmentReportingPort'
);
