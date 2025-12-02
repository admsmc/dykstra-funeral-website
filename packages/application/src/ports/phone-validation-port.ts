import { type Effect, Context } from 'effect';

/**
 * Phone number type
 */
export type PhoneNumberType = 
  | 'mobile'
  | 'landline'
  | 'voip'
  | 'toll_free'
  | 'unknown';

/**
 * Phone carrier information
 */
export interface PhoneCarrier {
  readonly name: string | null;
  readonly type: PhoneNumberType;
  readonly mobileCountryCode: string | null;
  readonly mobileNetworkCode: string | null;
}

/**
 * Validated phone number result
 */
export interface ValidatedPhone {
  readonly phoneNumber: string;           // E.164 format (e.g., +15551234567)
  readonly nationalFormat: string;        // National format (e.g., (555) 123-4567)
  readonly internationalFormat: string;   // International format (e.g., +1 555-123-4567)
  readonly countryCode: string;           // ISO 3166-1 alpha-2 (e.g., US)
  readonly isValid: boolean;
  readonly isPossible: boolean;
  readonly carrier: PhoneCarrier | null;
  readonly canReceiveSMS: boolean;        // True if mobile/capable of SMS
}

/**
 * Phone validation error
 */
export class PhoneValidationError extends Error {
  readonly _tag = 'PhoneValidationError';
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
  }
}

/**
 * Port for phone number validation and lookup
 * Implementation: Twilio Lookup API
 */
export interface PhoneValidationService {
  /**
   * Validate and format a phone number
   * @param phoneNumber - Phone number in any format
   * @param countryCode - Optional country code (default: US)
   * @returns Validated phone number with carrier info
   */
  readonly validate: (
    phoneNumber: string,
    countryCode?: string
  ) => Effect.Effect<ValidatedPhone, PhoneValidationError>;

  /**
   * Format phone number to E.164 standard
   * @param phoneNumber - Phone number in any format
   * @param countryCode - Optional country code (default: US)
   * @returns E.164 formatted phone number
   */
  readonly formatE164: (
    phoneNumber: string,
    countryCode?: string
  ) => Effect.Effect<string, PhoneValidationError>;

  /**
   * Format phone number to national format
   * @param phoneNumber - Phone number in any format
   * @param countryCode - Optional country code (default: US)
   * @returns National formatted phone number (e.g., (555) 123-4567)
   */
  readonly formatNational: (
    phoneNumber: string,
    countryCode?: string
  ) => Effect.Effect<string, PhoneValidationError>;

  /**
   * Check if phone number can receive SMS
   * @param phoneNumber - Phone number to check
   * @returns True if number is mobile and can receive SMS
   */
  readonly canReceiveSMS: (
    phoneNumber: string
  ) => Effect.Effect<boolean, PhoneValidationError>;
}

/**
 * Context tag for dependency injection
 */
export const PhoneValidation = Context.GenericTag<PhoneValidationService>(
  '@dykstra/PhoneValidation'
);
