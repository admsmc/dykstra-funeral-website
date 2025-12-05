import { createPersistedStore } from '@/lib/store';

/**
 * Case Workflow Store (UI State Only)
 * 
 * Manages UI state for multi-step case/service creation workflows.
 * Tracks workflow position, validation status, and step completion.
 * 
 * **IMPORTANT**: This store does NOT store case data. Case data is managed by tRPC queries.
 * This store only tracks which step the user is on and validation state.
 * 
 * @example
 * ```typescript
 * // Load case data from backend via tRPC
 * const { data: draftCase } = trpc.case.getDraft.useQuery({ id });
 * 
 * // Use store for workflow UI state only
 * const { currentStep, nextStep, markStepComplete } = useCaseWorkflowStore();
 * const { canProceed } = useCaseWorkflowSelectors();
 * 
 * // Navigate workflow
 * if (canProceed) {
 *   nextStep();
 * }
 * 
 * // Save case data via tRPC mutation
 * const updateMutation = trpc.case.update.useMutation();
 * await updateMutation.mutateAsync({ id, ...updates });
 * ```
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Case workflow step identifiers
 */
export type WorkflowStep =
  | 'family-info'
  | 'deceased-info'
  | 'service-selection'
  | 'merchandise'
  | 'pricing'
  | 'payment'
  | 'review';

/**
 * Validation status for a workflow step
 */
export interface StepValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Case workflow state (UI only - no case data)
 */
interface CaseWorkflowState {
  // Workflow UI state
  currentStep: WorkflowStep;
  completedSteps: Set<WorkflowStep>;
  stepValidations: Map<WorkflowStep, StepValidation>;
  
  // Workflow context (minimal metadata only)
  caseId: string | null; // Track which case we're editing

  // Actions - Workflow navigation
  goToStep: (step: WorkflowStep) => void;
  nextStep: () => void;
  previousStep: () => void;

  // Actions - Validation
  setStepValidation: (step: WorkflowStep, validation: StepValidation) => void;
  markStepComplete: (step: WorkflowStep) => void;
  markStepIncomplete: (step: WorkflowStep) => void;
  
  // Actions - Workflow lifecycle
  startWorkflow: (caseId?: string) => void;
  resetWorkflow: () => void;
}

// ============================================================================
// Workflow Configuration
// ============================================================================

/**
 * Ordered list of workflow steps
 */
const WORKFLOW_STEPS: WorkflowStep[] = [
  'family-info',
  'deceased-info',
  'service-selection',
  'merchandise',
  'pricing',
  'payment',
  'review',
];

/**
 * Get the next step in the workflow
 */
function getNextStep(currentStep: WorkflowStep): WorkflowStep | null {
  const currentIndex = WORKFLOW_STEPS.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex === WORKFLOW_STEPS.length - 1) {
    return null;
  }
  return WORKFLOW_STEPS[currentIndex + 1];
}

/**
 * Get the previous step in the workflow
 */
function getPreviousStep(currentStep: WorkflowStep): WorkflowStep | null {
  const currentIndex = WORKFLOW_STEPS.indexOf(currentStep);
  if (currentIndex <= 0) {
    return null;
  }
  return WORKFLOW_STEPS[currentIndex - 1];
}

// ============================================================================
// Store
// ============================================================================

/**
 * Case workflow store (UI state only)
 * 
 * Persisted to localStorage to remember workflow position between sessions.
 * Case data itself is managed by tRPC queries/mutations.
 */
export const useCaseWorkflowStore = createPersistedStore<CaseWorkflowState>(
  'case-workflow',
  (set, get) => ({
    // Initial state - UI only
    currentStep: 'family-info',
    completedSteps: new Set(),
    stepValidations: new Map(),
    caseId: null,

    // Workflow navigation
    goToStep: (step) =>
      set({
        currentStep: step,
      }),

    nextStep: () => {
      const nextStep = getNextStep(get().currentStep);
      if (nextStep) {
        set({ currentStep: nextStep });
      }
    },

    previousStep: () => {
      const previousStep = getPreviousStep(get().currentStep);
      if (previousStep) {
        set({ currentStep: previousStep });
      }
    },

    // Validation tracking
    setStepValidation: (step, validation) =>
      set((state) => {
        const newValidations = new Map(state.stepValidations);
        newValidations.set(step, validation);
        return { stepValidations: newValidations };
      }),

    markStepComplete: (step) =>
      set((state) => {
        const newCompleted = new Set(state.completedSteps);
        newCompleted.add(step);
        return { completedSteps: newCompleted };
      }),

    markStepIncomplete: (step) =>
      set((state) => {
        const newCompleted = new Set(state.completedSteps);
        newCompleted.delete(step);
        return { completedSteps: newCompleted };
      }),

    // Workflow lifecycle
    startWorkflow: (caseId) =>
      set({
        caseId,
        currentStep: 'family-info',
        completedSteps: new Set(),
        stepValidations: new Map(),
      }),

    resetWorkflow: () =>
      set({
        currentStep: 'family-info',
        completedSteps: new Set(),
        stepValidations: new Map(),
        caseId: null,
      }),
  }),
  {
    name: 'dykstra-case-workflow',
  }
);

// ============================================================================
// Selectors
// ============================================================================

/**
 * Derived state selectors for optimal performance
 */
export const useCaseWorkflowSelectors = () => {
  const currentStep = useCaseWorkflowStore((state) => state.currentStep);
  const completedSteps = useCaseWorkflowStore((state) => state.completedSteps);
  const stepValidations = useCaseWorkflowStore((state) => state.stepValidations);
  const caseId = useCaseWorkflowStore((state) => state.caseId);

  return {
    /** Whether current step is valid and can proceed */
    canProceed: stepValidations.get(currentStep)?.isValid ?? false,

    /** Whether there is a next step available */
    hasNextStep: getNextStep(currentStep) !== null,

    /** Whether there is a previous step available */
    hasPreviousStep: getPreviousStep(currentStep) !== null,

    /** Whether current step is marked as complete */
    isStepComplete: completedSteps.has(currentStep),

    /** Validation errors for current step */
    currentStepErrors: stepValidations.get(currentStep)?.errors ?? [],

    /** Validation warnings for current step */
    currentStepWarnings: stepValidations.get(currentStep)?.warnings ?? [],

    /** Progress percentage (0-100) */
    progressPercentage: Math.round(
      (completedSteps.size / WORKFLOW_STEPS.length) * 100
    ),

    /** Whether a workflow is active */
    isWorkflowActive: caseId !== null,

    /** Current step index (0-based) */
    currentStepIndex: WORKFLOW_STEPS.indexOf(currentStep),

    /** Total number of steps */
    totalSteps: WORKFLOW_STEPS.length,
  };
};

