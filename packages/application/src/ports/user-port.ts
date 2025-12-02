import { type Effect, Context } from 'effect';

/**
 * User error
 */
export class UserError extends Error {
  readonly _tag = 'UserError';
  constructor(override readonly message: string, override readonly cause?: unknown) {
    super(message, { cause });
  }
}

/**
 * User preferences
 */
export interface UserPreferences {
  readonly emailNotifications?: {
    readonly caseUpdates?: boolean;
    readonly paymentReminders?: boolean;
    readonly documentUploads?: boolean;
    readonly taskAssignments?: boolean;
  };
  readonly smsNotifications?: {
    readonly urgentUpdates?: boolean;
    readonly appointmentReminders?: boolean;
  };
}

/**
 * User profile
 */
export interface UserProfile {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly phone: string | null;
  readonly role: string;
  readonly preferences: UserPreferences;
  readonly caseMemberships: Array<{
    readonly caseId: string;
    readonly role: string;
    readonly decedentName: string;
  }>;
}

/**
 * User Port
 * Abstraction for user profile operations
 */
export interface UserPort {
  /**
   * Get user profile by ID
   */
  readonly getProfile: (
    userId: string
  ) => Effect.Effect<UserProfile, UserError>;

  /**
   * Update user profile
   */
  readonly updateProfile: (params: {
    userId: string;
    name?: string;
    phone?: string;
    preferences?: UserPreferences;
  }) => Effect.Effect<void, UserError>;

  /**
   * Get user by email
   */
  readonly findByEmail: (
    email: string
  ) => Effect.Effect<UserProfile | null, UserError>;

  /**
   * Check if user has access to case
   */
  readonly hasAccessToCase: (
    userId: string,
    caseId: string
  ) => Effect.Effect<boolean, UserError>;
}

/**
 * User Port service tag for dependency injection
 */
export const UserPort = Context.GenericTag<UserPort>('@dykstra/UserPort');
