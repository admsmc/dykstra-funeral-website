/**
 * Application Stores
 * 
 * Zustand stores for global state management.
 * 
 * @example
 * ```typescript
 * import {
 *   usePreferencesStore,
 *   useTemplateEditorStore,
 *   useCaseWorkflowStore,
 *   useFinancialTransactionStore,
 *   useSchedulingStore
 * } from '@/stores';
 * ```
 */

// Preferences Store
export {
  usePreferencesStore,
  usePreferencesSelectors,
  type Theme,
  type SidebarState,
  type TablePreferences,
  type NotificationSettings,
} from './preferences-store';

// Template Editor Store
export {
  useTemplateEditorStore,
  useTemplateEditorSelectors,
  useTemplateAutosave,
  type Template,
} from './template-editor-store';

// Case Workflow Store
export {
  useCaseWorkflowStore,
  useCaseWorkflowSelectors,
  useCaseWorkflowAutosave,
  type WorkflowStep,
  type StepValidation,
  type DraftCase,
} from './case-workflow-store';

// Financial Transaction Store
export {
  useFinancialTransactionStore,
  useFinancialTransactionSelectors,
  type PaymentMethod,
  type TransactionStatus,
  type TransactionType,
  type OptimisticTransaction,
  type RefundRequest,
} from './financial-transaction-store';

// Scheduling Store
export {
  useSchedulingStore,
  useSchedulingSelectors,
  type ShiftType,
  type CalendarView,
  type Shift,
  type ScheduleConflict,
  type ScheduleFilters,
} from './scheduling-store';
