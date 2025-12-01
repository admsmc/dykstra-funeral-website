import { Effect } from "effect";
import { ValidationError } from "../../errors";
import { UserPort } from '../../ports/user-port';

/**
 * Update User Profile
 *
 * Policy Type: Type A
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A
 * Persisted In: N/A
 * Go Backend: NO
 * Per-Funeral-Home: NO
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

interface UpdateUserProfileInput {
  userId: string;
  name?: string;
  phone?: string;
  preferences?: {
    emailNotifications?: {
      caseUpdates?: boolean;
      paymentReminders?: boolean;
      documentUploads?: boolean;
      taskAssignments?: boolean;
    };
    smsNotifications?: {
      urgentUpdates?: boolean;
      appointmentReminders?: boolean;
    };
  };
}

interface UpdateUserProfileResult {
  success: boolean;
  userId: string;
}

/**
 * Update user profile (name, phone, preferences)
 * Note: Email and role changes are handled separately for security
 */
export const updateUserProfile = ({
  userId,
  name,
  phone,
  preferences,
}: UpdateUserProfileInput) =>
  Effect.gen(function* (_) {
    // Validate name if provided
    if (name !== undefined && name.trim().length === 0) {
      return yield* _(Effect.fail(new ValidationError({ message: "Name cannot be empty" })));
    }

    if (name !== undefined && name.length > 255) {
      return yield* _(
        Effect.fail(new ValidationError({ message: "Name must be 255 characters or less" }))
      );
    }

    // Validate phone if provided
    if (phone !== undefined && phone !== null && phone.trim().length > 0) {
      // Basic phone validation (10-15 digits)
      const phoneDigits = phone.replace(/\D/g, "");
      if (phoneDigits.length < 10 || phoneDigits.length > 15) {
        return yield* _(
          Effect.fail(new ValidationError({ message: "Invalid phone number format" }))
        );
      }
    }

    // Get user port
    const userPort = yield* _(UserPort);
    
    // Check if user exists
    const existingUser = yield* _(userPort.getProfile(userId));

    // Build update params
    const mergedPreferences = preferences !== undefined ? {
      emailNotifications: {
        ...(existingUser.preferences.emailNotifications || {}),
        ...(preferences.emailNotifications || {}),
      },
      smsNotifications: {
        ...(existingUser.preferences.smsNotifications || {}),
        ...(preferences.smsNotifications || {}),
      },
    } : undefined;

    // Update user via port
    yield* _(userPort.updateProfile({
      userId,
      name: name?.trim(),
      phone: phone?.trim() || undefined,
      preferences: mergedPreferences,
    }));

    return {
      success: true,
      userId,
    } satisfies UpdateUserProfileResult;
  });
