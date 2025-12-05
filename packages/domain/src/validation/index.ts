/**
 * Domain Validation Schemas
 * 
 * Centralized validation rules for all forms and data inputs.
 * All schemas use Zod for type-safe runtime validation.
 * 
 * Usage:
 * ```typescript
 * import { contactFormSchema } from '@dykstra/domain/validation';
 * import { useForm } from 'react-hook-form';
 * import { zodResolver } from '@hookform/resolvers/zod';
 * 
 * const form = useForm({
 *   resolver: zodResolver(contactFormSchema),
 * });
 * ```
 */

// Shared/Common Schemas
export * from './shared-schemas';

// Payment-Related Schemas
export * from './payment-schemas';

// Case Management Schemas
export * from './case-schemas';

// Contact & Profile Schemas
export * from './contact-schemas';

// Family & Invitation Schemas
export * from './family-schemas';

// Memorial & Tribute Schemas
export * from './memorial-schemas';

// Contract Template Schemas
export * from './contract-schemas';

// Task Management Schemas
export * from './task-schemas';
