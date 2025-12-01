import { Data } from 'effect';

/**
 * Lead To Case Conversion Policy
 * 
 * SCD Type 2: Tracks historical policy changes with version control
 * 
 * Defines how leads are converted to cases per funeral home.
 * Minimal policy - primarily captures the default case status behavior.
 * 
 * Example variations:
 * - Standard: Case starts in 'inquiry' status (most common)
 * - Fast-Track: Case starts in 'active' status (for urgent needs)
 */
export class LeadToCaseConversionPolicy extends Data.Class<{
  readonly id: string;
  readonly businessKey: string;  // Policy identifier, typically funeralHomeId
  readonly version: number;       // SCD2: Version number
  readonly validFrom: Date;       // SCD2: When this version became active
  readonly validTo: Date | null;  // SCD2: When this version ended (null = current)
  readonly isCurrent: boolean;    // SCD2: Is this the current version?
  readonly funeralHomeId: string; // Which funeral home uses this policy
  
  // Lead To Case Conversion Rules
  readonly defaultCaseStatus: 'inquiry' | 'active';  // Initial case status when converting
  readonly requireDecedentName: boolean;             // Must have decedent name
  readonly autoAssignToLeadStaff: boolean;           // Auto-assign case to lead's assignee
  readonly preserveLeadNotes: boolean;               // Copy lead notes to case
  readonly createInteractionRecord: boolean;         // Log conversion as interaction
  
  // Audit Trail
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
  readonly updatedBy: string | null;
  readonly reason: string | null;        // Reason for policy change
}> {}

/**
 * Default Lead To Case Conversion Policy
 * 
 * Standard behavior: Start cases in 'inquiry' status
 */
export const DEFAULT_LEAD_TO_CASE_CONVERSION_POLICY: Omit<LeadToCaseConversionPolicy, 'id' | 'businessKey' | 'funeralHomeId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
  version: 1,
  validFrom: new Date(),
  validTo: null,
  isCurrent: true,
  
  // Standard: Inquiry status for new cases
  defaultCaseStatus: 'inquiry',
  requireDecedentName: true,
  autoAssignToLeadStaff: true,   // Inherit staff from lead
  preserveLeadNotes: true,        // Keep lead notes for context
  createInteractionRecord: true,  // Document the conversion
  
  reason: null,
};

/**
 * Fast-Track Lead To Case Conversion Policy
 * Cases start in 'active' status for immediate action
 */
export const FAST_TRACK_LEAD_TO_CASE_CONVERSION_POLICY: Omit<LeadToCaseConversionPolicy, 'id' | 'businessKey' | 'funeralHomeId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
  ...DEFAULT_LEAD_TO_CASE_CONVERSION_POLICY,
  defaultCaseStatus: 'active',   // Skip inquiry, go straight to active
  autoAssignToLeadStaff: true,
  preserveLeadNotes: true,
};

/**
 * Minimal Lead To Case Conversion Policy
 * Cases start in 'inquiry', minimal data transfer
 */
export const MINIMAL_LEAD_TO_CASE_CONVERSION_POLICY: Omit<LeadToCaseConversionPolicy, 'id' | 'businessKey' | 'funeralHomeId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
  ...DEFAULT_LEAD_TO_CASE_CONVERSION_POLICY,
  autoAssignToLeadStaff: false,   // Require manual assignment
  preserveLeadNotes: false,       // Don't copy notes
  createInteractionRecord: false, // Don't log interaction
};
