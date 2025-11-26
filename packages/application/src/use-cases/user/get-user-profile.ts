import { Effect } from "effect";
import { UserPort } from '../../ports/user-port';

// Extended user profile with additional API-specific fields
interface ExtendedUserProfile {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly phone: string | null;
  readonly role: string;
  readonly emailVerified: Date | null;
  readonly preferences: {
    readonly emailNotifications: {
      readonly caseUpdates: boolean;
      readonly paymentReminders: boolean;
      readonly documentUploads: boolean;
      readonly taskAssignments: boolean;
    };
    readonly smsNotifications: {
      readonly urgentUpdates: boolean;
      readonly appointmentReminders: boolean;
    };
  };
  readonly caseMemberships: Array<{
    readonly caseId: string;
    readonly caseName: string;
    readonly caseNumber: string;
    readonly role: string;
    readonly invitedAt: Date;
    readonly acceptedAt: Date | null;
  }>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

interface GetUserProfileInput {
  userId: string;
}

const DEFAULT_PREFERENCES = {
  emailNotifications: {
    caseUpdates: true,
    paymentReminders: true,
    documentUploads: true,
    taskAssignments: true,
  },
  smsNotifications: {
    urgentUpdates: false,
    appointmentReminders: false,
  },
};

/**
 * Get user profile with preferences and case memberships
 */
export const getUserProfile = ({ userId }: GetUserProfileInput) =>
  Effect.gen(function* (_) {
    const userPort = yield* _(UserPort);
    
    const userProfile = yield* _(userPort.getProfile(userId));

    // Parse preferences with defaults
    let preferences = DEFAULT_PREFERENCES;
    if (userProfile.preferences && typeof userProfile.preferences === "object") {
      preferences = {
        emailNotifications: {
          ...DEFAULT_PREFERENCES.emailNotifications,
          ...userProfile.preferences.emailNotifications,
        },
        smsNotifications: {
          ...DEFAULT_PREFERENCES.smsNotifications,
          ...userProfile.preferences.smsNotifications,
        },
      };
    }

    const profile: ExtendedUserProfile = {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      phone: userProfile.phone,
      role: userProfile.role,
      emailVerified: null, // Not in port interface, defaulting to null
      preferences,
      caseMemberships: userProfile.caseMemberships.map((membership) => ({
        caseId: membership.caseId,
        caseName: membership.decedentName,
        caseNumber: membership.caseId, // Using caseId as caseNumber for now
        role: membership.role,
        invitedAt: new Date(), // Placeholder - should come from port
        acceptedAt: new Date(), // Placeholder - should come from port
      })),
      createdAt: new Date(), // Placeholder - should come from port
      updatedAt: new Date(), // Placeholder - should come from port
    };

    return profile;
  });
