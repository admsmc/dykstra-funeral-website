import { Effect, Context } from 'effect';

/**
 * Invitation status enum
 */
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

/**
 * Case member role enum
 */
export type CaseMemberRole = 'PRIMARY_CONTACT' | 'FAMILY_MEMBER';

/**
 * Invitation entity
 */
export interface Invitation {
  id: string;
  businessKey: string;
  version: number;
  caseId: string;
  email: string;
  name: string;
  phone?: string | null;
  relationship?: string | null;
  role: CaseMemberRole;
  permissions: Record<string, boolean>;
  status: InvitationStatus;
  token: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  sentBy: string;
  createdAt: Date;
  updatedAt?: Date;
  validFrom: Date;
  validTo?: Date | null;
  isCurrent: boolean;
}

/**
 * Invitation with related data
 */
export interface InvitationWithRelations extends Invitation {
  sender: {
    id: string;
    name: string;
    email: string;
  };
  case?: {
    id: string;
    decedentName: string;
    funeralHome: {
      id: string;
      name: string;
    };
  };
}

/**
 * Invitation repository errors
 */
export class InvitationNotFoundError extends Error {
  readonly _tag = 'InvitationNotFoundError';
  constructor(readonly businessKey: string) {
    super(`Invitation not found: ${businessKey}`);
  }
}

export class InvitationConflictError extends Error {
  readonly _tag = 'InvitationConflictError';
  constructor(override readonly message: string) {
    super(message);
  }
}

export class InvitationValidationError extends Error {
  readonly _tag = 'InvitationValidationError';
  constructor(override readonly message: string) {
    super(message);
  }
}

export type InvitationError = InvitationNotFoundError | InvitationConflictError | InvitationValidationError;

/**
 * Invitation Repository Port
 * 
 * Handles persistence of family invitations with SCD2 (Slowly Changing Dimension Type 2) pattern
 */
export interface InvitationRepository {
  /**
   * Find current invitation by business key
   */
  findByBusinessKey(businessKey: string): Effect.Effect<InvitationWithRelations, InvitationNotFoundError>;

  /**
   * Find all current invitations for a case
   */
  findByCase(caseId: string, status?: InvitationStatus): Effect.Effect<InvitationWithRelations[]>;

  /**
   * Find all versions of an invitation (history)
   */
  findHistory(businessKey: string): Effect.Effect<InvitationWithRelations[], InvitationNotFoundError>;

  /**
   * Check if an active invitation exists for an email in a case
   */
  hasActiveInvitation(caseId: string, email: string): Effect.Effect<boolean>;

  /**
   * Create a new invitation (version 1)
   */
  create(invitation: Omit<Invitation, 'id' | 'version' | 'createdAt' | 'updatedAt' | 'validFrom' | 'validTo' | 'isCurrent'>): Effect.Effect<InvitationWithRelations, InvitationConflictError>;

  /**
   * Create a new version of an invitation (SCD2)
   * Closes the current version and creates a new one
   */
  createNewVersion(
    businessKey: string,
    updates: Partial<Pick<Invitation, 'status' | 'token' | 'expiresAt' | 'revokedAt' | 'sentBy'>>
  ): Effect.Effect<InvitationWithRelations, InvitationNotFoundError>;
}

/**
 * Invitation Repository Tag (for dependency injection)
 */
export const InvitationRepository = Context.GenericTag<InvitationRepository>('@services/InvitationRepository');
