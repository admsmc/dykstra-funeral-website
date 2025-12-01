import { Data } from 'effect';

/**
 * Lead Scoring Policy
 * 
 * SCD Type 2: Tracks historical policy changes with version control
 * 
 * Defines how leads are scored and prioritized per funeral home.
 * Each funeral home can have different lead scoring preferences and thresholds.
 * 
 * Example variations:
 * - Aggressive: Score at-need leads higher (80+), pre-need lower (30)
 * - Conservative: All leads start at 50, gradual scoring
 * - Balanced: Current default behavior
 */
export class LeadScoringPolicy extends Data.Class<{
  readonly id: string;
  readonly businessKey: string;  // Policy identifier, typically funeralHomeId
  readonly version: number;       // SCD2: Version number
  readonly validFrom: Date;       // SCD2: When this version became active
  readonly validTo: Date | null;  // SCD2: When this version ended (null = current)
  readonly isCurrent: boolean;    // SCD2: Is this the current version?
  readonly funeralHomeId: string; // Which funeral home uses this policy
  
  // Lead Type Scoring (at-need gets higher priority)
  readonly atNeedInitialScore: number;    // Initial score for at-need leads (0-100)
  readonly preNeedInitialScore: number;   // Initial score for pre-need leads (0-100)
  readonly generalInquiryScore: number;   // Initial score for general inquiries (0-100)
  
  // Score Thresholds for lead categorization
  readonly hotLeadThreshold: number;      // Score >= this = hot lead (usually 70+)
  readonly warmLeadThreshold: number;     // Score >= this = warm lead (usually 50+)
  readonly coldLeadThreshold: number;     // Score < this = cold lead (usually < 50)
  
  // Inactive Lead Handling
  readonly inactiveThresholdDays: number; // Days without contact before marked inactive
  readonly enableAutoArchive: boolean;    // Auto-archive leads after inactiveThresholdDays?
  readonly archiveAfterDays: number;      // Days before auto-archiving
  
  // Score Adjustment Factors
  readonly contactMethodBonus: number;    // Bonus when both email + phone provided (0-20)
  readonly referralSourceBonus: number;   // Bonus for referral leads (0-15)
  readonly emailEngagementBonus: number;  // Bonus per email open (0-5)
  readonly phoneEngagementBonus: number;  // Bonus per phone contact (0-5)
  
  // Required Fields for Lead Creation
  readonly requirePhoneOrEmail: boolean;  // Must have at least one contact method
  readonly requireFirstName: boolean;     // First name mandatory
  readonly requireLastName: boolean;      // Last name mandatory
  
  // Lead Source Preferences (affects initial score weighting)
  readonly preferredSources: string[];    // Lead sources that get bonus (e.g., ['referral', 'event'])
  readonly disallowedSources: string[];   // Lead sources that are blocked
  
  // Audit Trail
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
  readonly updatedBy: string | null;
  readonly reason: string | null;        // Reason for policy change
}> {}

/**
 * Default Lead Scoring Policy
 * 
 * Standard, balanced scoring for a typical funeral home.
 * Customize per funeral home by creating variations.
 */
export const DEFAULT_LEAD_SCORING_POLICY: Omit<LeadScoringPolicy, 'id' | 'businessKey' | 'funeralHomeId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
  version: 1,
  validFrom: new Date(),
  validTo: null,
  isCurrent: true,
  
  // At-need leads get 80, pre-need get 30 (matched to Lead.create() logic)
  atNeedInitialScore: 80,
  preNeedInitialScore: 30,
  generalInquiryScore: 40,
  
  // Hot (70+), warm (50+), cold (< 50)
  hotLeadThreshold: 70,
  warmLeadThreshold: 50,
  coldLeadThreshold: 50,
  
  // 14 days without contact = inactive, auto-archive after 90 days
  inactiveThresholdDays: 14,
  enableAutoArchive: false,  // Start conservative, let users enable
  archiveAfterDays: 90,
  
  // Bonus factors
  contactMethodBonus: 10,    // +10 for having both email + phone
  referralSourceBonus: 15,   // +15 for referrals (high quality)
  emailEngagementBonus: 2,   // +2 per email open
  phoneEngagementBonus: 5,   // +5 per phone contact
  
  // Validation requirements
  requirePhoneOrEmail: true,
  requireFirstName: true,
  requireLastName: true,
  
  // Preferred sources (these get subtle weighting)
  preferredSources: ['referral', 'event'],
  disallowedSources: [], // Allow all by default
  
  reason: null,
};

/**
 * Aggressive scoring policy
 * Higher initial scores for faster prioritization
 */
export const AGGRESSIVE_LEAD_SCORING_POLICY: Omit<LeadScoringPolicy, 'id' | 'businessKey' | 'funeralHomeId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
  ...DEFAULT_LEAD_SCORING_POLICY,
  atNeedInitialScore: 85,        // Even higher for at-need
  preNeedInitialScore: 35,       // Slightly higher
  hotLeadThreshold: 65,          // Lower threshold = more hot leads
  warmLeadThreshold: 45,
  contactMethodBonus: 15,        // More aggressive bonuses
  referralSourceBonus: 20,
  enableAutoArchive: true,       // Aggressive cleanup
  archiveAfterDays: 60,          // Archive sooner
};

/**
 * Conservative scoring policy
 * All leads start equal, score builds with engagement
 */
export const CONSERVATIVE_LEAD_SCORING_POLICY: Omit<LeadScoringPolicy, 'id' | 'businessKey' | 'funeralHomeId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
  ...DEFAULT_LEAD_SCORING_POLICY,
  atNeedInitialScore: 50,        // Equal start regardless of type
  preNeedInitialScore: 50,
  generalInquiryScore: 50,
  hotLeadThreshold: 75,          // Higher threshold = stricter
  warmLeadThreshold: 60,
  coldLeadThreshold: 60,
  contactMethodBonus: 5,         // Smaller bonuses
  referralSourceBonus: 8,
  inactiveThresholdDays: 7,      // Track inactivity closely
  enableAutoArchive: false,      // Don't auto-archive
};
