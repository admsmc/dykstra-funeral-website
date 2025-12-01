/**
 * PTO Management Entities
 * Exports all domain entities for PTO and training management
 */

// PTO Request exports
export * from './pto-request';

// Training Record exports
export * from './training-record';

// Backfill Assignment exports
export * from './backfill-assignment';

// PTO Policy exports (with renamed conflicts)
export {
  createPtoPolicyId,
  createDefaultPtoPolicy,
  updatePtoPolicy,
  getAdvanceNoticeRequirement,
  getRolePolicy,
  requiresDirectorApproval as ptoRequiresDirectorApproval,
  requiresBackfill,
  getMaxConcurrentForRole,
  isBlackoutDate,
  overlapsBlackoutDates,
  getOverlappingBlackoutDates,
  addBlackoutDate,
  removeBlackoutDate,
  validatePtoPolicy,
  clonePolicyForFuneralHome as clonePtoPolicyForFuneralHome,
} from './pto-policy';
export type {
  PtoPolicy,
  PtoPolicyId,
  BlackoutDateRange,
  RoleSpecificPolicy,
  PtoPolicySettings,
} from './pto-policy';

// Training Policy exports (with renamed conflicts)
export {
  createTrainingPolicyId,
  createDefaultTrainingPolicy,
  updateTrainingPolicy,
  getRoleTrainingRequirement,
  getRequiredCertificationsForRole,
  requiresDirectorApproval as trainingRequiresDirectorApproval,
  costRequiresApproval,
  getAnnualBudgetForRole,
  canTakeTraining,
  getNextRenewalDate,
  calculateRenewalNoticeDate,
  shouldSendRenewalNotice,
  validateTrainingPolicy,
  clonePolicyForFuneralHome as cloneTrainingPolicyForFuneralHome,
} from './training-policy';
export type {
  TrainingPolicy,
  TrainingPolicyId,
  RequiredCertification,
  RoleTrainingRequirement,
  TrainingPolicySettings,
  CertificationRenewalPeriod,
} from './training-policy';
