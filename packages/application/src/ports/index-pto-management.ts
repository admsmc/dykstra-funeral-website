/**
 * PTO Management Repository Ports
 * Exports all persistence abstraction interfaces for PTO, training, and backfill management
 */

// PTO Management Port
export type {
  PtoManagementPortService,
  PtoRequestFilters,
  PtoRequestQueryResult,
  PtoBalance,
  PtoSummary,
} from './pto-management-port';
export { PtoManagementPort } from './pto-management-port';

// Training Management Port
export type {
  TrainingManagementPortService,
  TrainingRecordFilters,
  TrainingRecordQueryResult,
  EmployeeCertification,
  EmployeeTrainingSummary,
  ExpiringCertification,
} from './training-management-port';
export { TrainingManagementPort } from './training-management-port';

// Backfill Management Port
export type {
  BackfillManagementPortService,
  BackfillAssignmentFilters,
  BackfillAssignmentQueryResult,
  BackfillCandidate,
  BackfillCoverageSummary,
  BackfillEmployeeWorkload,
} from './backfill-management-port';
export { BackfillManagementPort } from './backfill-management-port';
