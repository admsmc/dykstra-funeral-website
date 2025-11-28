import { Effect, Layer } from 'effect';
import {
  PhoneValidation,
  type PhoneValidationService,
  type ValidatedPhone,
  type PhoneNumberType,
  PhoneValidationError,
} from '@dykstra/application';

/**
 * Twilio Lookup API adapter for phone validation
 * Implementation: Object-based (not class-based) following Clean Architecture
 * 
 * Note: This is a simple implementation using libphonenumber-js for formatting.
 * For production, integrate with Twilio Lookup API for carrier info.
 */

// Simple phone validation using libphonenumber-js library
// In production, add: npm install libphonenumber-js
// For now, we'll use basic regex-based validation

/**
 * Parse and validate phone number
 */
function parsePhoneNumber(phoneNumber: string, countryCode: string = 'US'): {
  isValid: boolean;
  e164: string;
  national: string;
  international: string;
} {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // US phone number validation (10 digits)
  if (countryCode === 'US') {
    if (digits.length === 10) {
      // Format as E.164
      const e164 = `+1${digits}`;
      // Format as national
      const national = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      // Format as international
      const international = `+1 ${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
      
      return {
        isValid: true,
        e164,
        national,
        international,
      };
    } else if (digits.length === 11 && digits[0] === '1') {
      // Strip leading 1 and reformat
      const stripped = digits.slice(1);
      const e164 = `+1${stripped}`;
      const national = `(${stripped.slice(0, 3)}) ${stripped.slice(3, 6)}-${stripped.slice(6)}`;
      const international = `+1 ${stripped.slice(0, 3)}-${stripped.slice(3, 6)}-${stripped.slice(6)}`;
      
      return {
        isValid: true,
        e164,
        national,
        international,
      };
    }
  }
  
  return {
    isValid: false,
    e164: phoneNumber,
    national: phoneNumber,
    international: phoneNumber,
  };
}

/**
 * Determine phone type based on area code (heuristic)
 * For production, use Twilio Lookup API
 */
function guessPhoneType(phoneNumber: string): PhoneNumberType {
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Toll-free area codes
  const tollFreeAreaCodes = ['800', '888', '877', '866', '855', '844', '833'];
  if (digits.length >= 3 && tollFreeAreaCodes.includes(digits.slice(0, 3))) {
    return 'toll_free';
  }
  
  // VoIP area codes (common ones)
  const voipAreaCodes = ['650', '415']; // Examples, not comprehensive
  if (digits.length >= 3 && voipAreaCodes.includes(digits.slice(0, 3))) {
    return 'voip';
  }
  
  // Default to mobile (most common for SMS)
  return 'mobile';
}

export const TwilioPhoneAdapter: PhoneValidationService = {
  validate: (phoneNumber: string, countryCode: string = 'US') =>
    Effect.tryPromise({
      try: async () => {
        const parsed = parsePhoneNumber(phoneNumber, countryCode);
        
        if (!parsed.isValid) {
          throw new Error(`Invalid phone number: ${phoneNumber}`);
        }
        
        const phoneType = guessPhoneType(phoneNumber);
        
        // For production: Call Twilio Lookup API
        // const twilioResponse = await fetch(
        //   `https://lookups.twilio.com/v2/PhoneNumbers/${parsed.e164}?Fields=carrier`,
        //   { headers: { Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}` }}
        // );
        
        const validated: ValidatedPhone = {
          phoneNumber: parsed.e164,
          nationalFormat: parsed.national,
          internationalFormat: parsed.international,
          countryCode,
          isValid: parsed.isValid,
          isPossible: parsed.isValid,
          carrier: {
            name: null, // Would come from Twilio
            type: phoneType,
            mobileCountryCode: countryCode === 'US' ? '310' : null,
            mobileNetworkCode: null,
          },
          canReceiveSMS: phoneType === 'mobile' || phoneType === 'voip',
        };
        
        return validated;
      },
      catch: (error) => new PhoneValidationError('Failed to validate phone number', error),
    }),

  formatE164: (phoneNumber: string, countryCode: string = 'US') =>
    Effect.tryPromise({
      try: async () => {
        const parsed = parsePhoneNumber(phoneNumber, countryCode);
        
        if (!parsed.isValid) {
          throw new Error(`Invalid phone number: ${phoneNumber}`);
        }
        
        return parsed.e164;
      },
      catch: (error) => new PhoneValidationError('Failed to format phone number', error),
    }),

  formatNational: (phoneNumber: string, countryCode: string = 'US') =>
    Effect.tryPromise({
      try: async () => {
        const parsed = parsePhoneNumber(phoneNumber, countryCode);
        
        if (!parsed.isValid) {
          throw new Error(`Invalid phone number: ${phoneNumber}`);
        }
        
        return parsed.national;
      },
      catch: (error) => new PhoneValidationError('Failed to format phone number', error),
    }),

  canReceiveSMS: (phoneNumber: string) =>
    Effect.tryPromise({
      try: async () => {
        const parsed = parsePhoneNumber(phoneNumber, 'US');
        
        if (!parsed.isValid) {
          return false;
        }
        
        const phoneType = guessPhoneType(phoneNumber);
        return phoneType === 'mobile' || phoneType === 'voip';
      },
      catch: (error) => new PhoneValidationError('Failed to check SMS capability', error),
    }),
};

/**
 * Layer for dependency injection
 */
export const TwilioPhoneAdapterLive = Layer.succeed(
  PhoneValidation,
  TwilioPhoneAdapter
);
