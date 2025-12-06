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

// Lead Management Schemas (CRM)
export * from './lead-schemas';

// Employee Management Schemas (HR)
export * from './employee-schemas';

// Communication Schemas (Email/SMS)
export * from './communication-schemas';

// Insurance Schemas
export * from './insurance-schemas';

// Supplier/Vendor Schemas
export * from './supplier-schemas';

// Inventory Management Schemas
export * from './inventory-schemas';

// Timesheet Management Schemas
export * from './timesheet-schemas';
