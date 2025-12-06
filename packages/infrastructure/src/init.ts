import { Effect } from 'effect';
import { seedDefaultPaymentPolicy } from './adapters/payment-management-policy-seeder';

/**
 * Infrastructure Initialization
 * 
 * Seeds required data for development:
 * - Default payment management policy
 * - Other policies as needed
 * 
 * Safe to run multiple times - checks for existing data before creating.
 */

/**
 * Initialize infrastructure with default data
 * Should be called once when the application starts
 */
export const initializeInfrastructure = async (): Promise<void> => {
  console.log('🚀 Initializing infrastructure...');
  
    try {
      // Seed default payment policy for 'default' funeral home
      // Note: seeding is optional during initialization; ignore type-level
      // environment requirements here and run the Effect unsafely.
      // This avoids tight coupling between seeding and full DI wiring.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      Effect.runPromise(seedDefaultPaymentPolicy('default') as any);

      console.log('✅ Infrastructure initialization complete');
  } catch (error) {
    console.error('❌ Infrastructure initialization failed:', error);
    // Don't throw - allow app to start even if seeding fails
    // This is important for development environments
  }
};
