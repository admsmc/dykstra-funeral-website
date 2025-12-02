import { type Effect, Context } from 'effect';

/**
 * Address suggestion from autocomplete
 */
export interface AddressSuggestion {
  readonly placeId: string;
  readonly description: string;
  readonly mainText: string;
  readonly secondaryText: string;
}

/**
 * Geocoded coordinates
 */
export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}

/**
 * Validated and structured address
 */
export interface ValidatedAddress {
  readonly streetNumber: string | null;
  readonly streetName: string | null;
  readonly fullStreetAddress: string;
  readonly city: string;
  readonly state: string;
  readonly zipCode: string;
  readonly country: string;
  readonly coordinates: Coordinates;
  readonly isDeliverable: boolean;
  readonly formattedAddress: string;
}

/**
 * Address validation error
 */
export class AddressValidationError extends Error {
  readonly _tag = 'AddressValidationError';
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
  }
}

/**
 * Port for address validation and geocoding services
 * Implementation: Google Places API
 */
export interface AddressValidationService {
  /**
   * Get address suggestions from partial input
   * @param input - Partial address string
   * @returns List of address suggestions
   */
  readonly autocomplete: (
    input: string
  ) => Effect.Effect<readonly AddressSuggestion[], AddressValidationError>;

  /**
   * Validate and structure a full address
   * @param address - Address string to validate
   * @returns Validated and structured address with coordinates
   */
  readonly validate: (
    address: string
  ) => Effect.Effect<ValidatedAddress, AddressValidationError>;

  /**
   * Get coordinates for an address
   * @param address - Address string to geocode
   * @returns Latitude and longitude coordinates
   */
  readonly geocode: (
    address: string
  ) => Effect.Effect<Coordinates, AddressValidationError>;

  /**
   * Get full address details from Place ID
   * @param placeId - Google Places Place ID
   * @returns Validated address with full details
   */
  readonly getPlaceDetails: (
    placeId: string
  ) => Effect.Effect<ValidatedAddress, AddressValidationError>;
}

/**
 * Context tag for dependency injection
 */
export const AddressValidation = Context.GenericTag<AddressValidationService>(
  '@dykstra/AddressValidation'
);
