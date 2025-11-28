import { Effect, Layer } from 'effect';
import {
  AddressValidation,
  type AddressValidationService,
  type AddressSuggestion,
  type ValidatedAddress,
  AddressValidationError,
} from '@dykstra/application';

/**
 * Google Places API adapter for address validation
 * Implementation: Object-based (not class-based) following Clean Architecture
 */
export const GooglePlacesAdapter: AddressValidationService = {
  autocomplete: (input: string) =>
    Effect.tryPromise({
      try: async () => {
        // Google Places Autocomplete API endpoint
        const apiKey = process.env['GOOGLE_PLACES_API_KEY'];
        if (!apiKey) {
          throw new Error('GOOGLE_PLACES_API_KEY environment variable not set');
        }

        const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
        url.searchParams.set('input', input);
        url.searchParams.set('key', apiKey);
        url.searchParams.set('types', 'address');
        url.searchParams.set('components', 'country:us'); // US addresses only

        const response = await fetch(url.toString());
        
        if (!response.ok) {
          throw new Error(`Google Places API error: ${response.statusText}`);
        }

        const data = await response.json() as any;

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          throw new Error(`Google Places API error: ${data.status} - ${data.error_message || ''}`);
        }

        const suggestions: AddressSuggestion[] = (data.predictions || []).map((prediction: any) => ({
          placeId: prediction.place_id,
          description: prediction.description,
          mainText: prediction.structured_formatting?.main_text || '',
          secondaryText: prediction.structured_formatting?.secondary_text || '',
        }));

        return suggestions;
      },
      catch: (error) => new AddressValidationError('Failed to autocomplete address', error),
    }),

  validate: (address: string) =>
    Effect.tryPromise({
      try: async () => {
        // Google Geocoding API for validation
        const apiKey = process.env['GOOGLE_PLACES_API_KEY'];
        if (!apiKey) {
          throw new Error('GOOGLE_PLACES_API_KEY environment variable not set');
        }

        const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
        url.searchParams.set('address', address);
        url.searchParams.set('key', apiKey);

        const response = await fetch(url.toString());
        
        if (!response.ok) {
          throw new Error(`Google Geocoding API error: ${response.statusText}`);
        }

        const data = await response.json() as any;

        if (data.status !== 'OK') {
          throw new Error(`Google Geocoding API error: ${data.status}`);
        }

        const result = data.results[0];
        if (!result) {
          throw new Error('No results found for address');
        }

        // Parse address components
        const components = result.address_components;
        const getComponent = (type: string) => {
          const comp = components.find((c: any) => c.types.includes(type));
          return comp?.long_name || null;
        };

        const streetNumber = getComponent('street_number');
        const streetName = getComponent('route');
        const city = getComponent('locality') || getComponent('sublocality');
        const state = getComponent('administrative_area_level_1');
        const zipCode = getComponent('postal_code');
        const country = getComponent('country');

        const validated: ValidatedAddress = {
          streetNumber,
          streetName,
          fullStreetAddress: streetNumber && streetName ? `${streetNumber} ${streetName}` : streetName || '',
          city: city || '',
          state: state || '',
          zipCode: zipCode || '',
          country: country || 'US',
          coordinates: {
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
          },
          isDeliverable: result.geometry.location_type !== 'APPROXIMATE',
          formattedAddress: result.formatted_address,
        };

        return validated;
      },
      catch: (error) => new AddressValidationError('Failed to validate address', error),
    }),

  geocode: (address: string) =>
    Effect.gen(function* () {
      const validated = yield* GooglePlacesAdapter.validate(address);
      return validated.coordinates;
    }),

  getPlaceDetails: (placeId: string) =>
    Effect.tryPromise({
      try: async () => {
        // Google Places Details API
        const apiKey = process.env['GOOGLE_PLACES_API_KEY'];
        if (!apiKey) {
          throw new Error('GOOGLE_PLACES_API_KEY environment variable not set');
        }

        const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
        url.searchParams.set('place_id', placeId);
        url.searchParams.set('fields', 'address_components,formatted_address,geometry');
        url.searchParams.set('key', apiKey);

        const response = await fetch(url.toString());
        
        if (!response.ok) {
          throw new Error(`Google Places API error: ${response.statusText}`);
        }

        const data = await response.json() as any;

        if (data.status !== 'OK') {
          throw new Error(`Google Places API error: ${data.status}`);
        }

        const result = data.result;
        if (!result) {
          throw new Error('Place not found');
        }

        // Parse address components
        const components = result.address_components;
        const getComponent = (type: string) => {
          const comp = components.find((c: any) => c.types.includes(type));
          return comp?.long_name || null;
        };

        const streetNumber = getComponent('street_number');
        const streetName = getComponent('route');
        const city = getComponent('locality') || getComponent('sublocality');
        const state = getComponent('administrative_area_level_1');
        const zipCode = getComponent('postal_code');
        const country = getComponent('country');

        const validated: ValidatedAddress = {
          streetNumber,
          streetName,
          fullStreetAddress: streetNumber && streetName ? `${streetNumber} ${streetName}` : streetName || '',
          city: city || '',
          state: state || '',
          zipCode: zipCode || '',
          country: country || 'US',
          coordinates: {
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
          },
          isDeliverable: result.geometry.location_type !== 'APPROXIMATE',
          formattedAddress: result.formatted_address,
        };

        return validated;
      },
      catch: (error) => new AddressValidationError('Failed to get place details', error),
    }),
};

/**
 * Layer for dependency injection
 */
export const GooglePlacesAdapterLive = Layer.succeed(
  AddressValidation,
  GooglePlacesAdapter
);
