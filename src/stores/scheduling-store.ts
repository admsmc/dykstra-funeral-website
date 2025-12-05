import { createPersistedStore } from '@/lib/store';

/**
 * Scheduling Store
 * 
 * Manages state for staff scheduling, calendar views, and drag-and-drop operations.
 * Supports conflict detection, filter preferences, and temporary shift placements.
 * 
 * @example
 * ```typescript
 * const { shifts, startDrag, dropShift, conflicts } = useSchedulingStore();
 * 
 * // Start dragging a shift
 * startDrag(shiftId, { staffId: 'staff-1', date: '2025-12-03' });
 * 
 * // Drop shift in new slot
 * dropShift('staff-2', '2025-12-04');
 * ```
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Shift types
 */
export type ShiftType =
  | 'on-call'
  | 'service-coverage'
  | 'embalmer'
  | 'administrative'
  | 'part-time'
  | 'full-time';

/**
 * Calendar view modes
 */
export type CalendarView = 'day' | 'week' | 'month' | 'agenda';

/**
 * Shift assignment
 */
export interface Shift {
  id: string;
  staffId: string;
  type: ShiftType;
  date: string; // ISO date string (YYYY-MM-DD)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  caseId?: string; // Optional: linked to specific case
  notes?: string;
  
  // Status
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  isConflict?: boolean;
}

/**
 * Scheduling conflict
 */
export interface ScheduleConflict {
  id: string;
  shiftIds: string[];
  type: 'overlap' | 'rest-period' | 'overtime' | 'license-required';
  severity: 'error' | 'warning';
  message: string;
}

/**
 * Drag-and-drop state
 */
interface DragState {
  isDragging: boolean;
  draggedShiftId: string | null;
  sourceStaffId: string | null;
  sourceDate: string | null;
  targetStaffId: string | null;
  targetDate: string | null;
}

/**
 * Filter preferences
 */
export interface ScheduleFilters {
  shiftTypes: ShiftType[];
  staffIds: string[];
  showCancelled: boolean;
  showConflicts: boolean;
}

/**
 * Scheduling state
 */
interface SchedulingState {
  // Shifts
  shifts: Map<string, Shift>;
  conflicts: Map<string, ScheduleConflict>;

  // Calendar view
  currentView: CalendarView;
  currentDate: Date;
  
  // Filters
  filters: ScheduleFilters;
  
  // Drag-and-drop
  dragState: DragState;
  tempShift: Shift | null; // Preview shift during drag

  // Actions - Shifts
  addShift: (shift: Omit<Shift, 'id'>) => string; // Returns shift ID
  updateShift: (id: string, updates: Partial<Shift>) => void;
  deleteShift: (id: string) => void;
  
  // Actions - Conflicts
  addConflict: (conflict: Omit<ScheduleConflict, 'id'>) => void;
  resolveConflict: (id: string) => void;
  clearConflicts: () => void;

  // Actions - Calendar
  setView: (view: CalendarView) => void;
  setDate: (date: Date) => void;
  goToToday: () => void;
  nextPeriod: () => void;
  previousPeriod: () => void;

  // Actions - Filters
  setFilters: (filters: Partial<ScheduleFilters>) => void;
  toggleShiftType: (type: ShiftType) => void;
  toggleStaff: (staffId: string) => void;
  resetFilters: () => void;

  // Actions - Drag-and-drop
  startDrag: (shiftId: string, source: { staffId: string; date: string }) => void;
  updateDragTarget: (staffId: string, date: string) => void;
  dropShift: (targetStaffId: string, targetDate: string) => void;
  cancelDrag: () => void;

  // Queries
  getShiftsByStaff: (staffId: string) => Shift[];
  getShiftsByDate: (date: string) => Shift[];
  getConflictsForShift: (shiftId: string) => ScheduleConflict[];
  
  // Reset
  reset: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Generate shift ID
 */
function generateShiftId(): string {
  return `shift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate conflict ID
 */
function generateConflictId(): string {
  return `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add months to a date
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Get period increment based on view
 */
function getPeriodIncrement(view: CalendarView): (date: Date, direction: 1 | -1) => Date {
  switch (view) {
    case 'day':
      return (date, direction) => addDays(date, direction);
    case 'week':
      return (date, direction) => addDays(date, direction * 7);
    case 'month':
    case 'agenda':
      return (date, direction) => addMonths(date, direction);
  }
}

/**
 * Default filters
 */
const DEFAULT_FILTERS: ScheduleFilters = {
  shiftTypes: [],
  staffIds: [],
  showCancelled: false,
  showConflicts: true,
};

// ============================================================================
// Store
// ============================================================================

/**
 * Scheduling store
 * 
 * Persisted to localStorage for filter preferences and view state.
 * Shift data is fetched from API on page load.
 */
export const useSchedulingStore = createPersistedStore<SchedulingState>(
  'scheduling',
  (set, get) => ({
    // Initial state
    shifts: new Map(),
    conflicts: new Map(),
    currentView: 'week',
    currentDate: new Date(),
    filters: DEFAULT_FILTERS,
    dragState: {
      isDragging: false,
      draggedShiftId: null,
      sourceStaffId: null,
      sourceDate: null,
      targetStaffId: null,
      targetDate: null,
    },
    tempShift: null,

    // Shift management
    addShift: (shiftData) => {
      const id = generateShiftId();
      const shift: Shift = { ...shiftData, id, status: 'scheduled' };

      set((state) => {
        const newShifts = new Map(state.shifts);
        newShifts.set(id, shift);
        return { shifts: newShifts };
      });

      return id;
    },

    updateShift: (id, updates) => {
      set((state) => {
        const shift = state.shifts.get(id);
        if (!shift) return state;

        const updatedShift = { ...shift, ...updates };
        const newShifts = new Map(state.shifts);
        newShifts.set(id, updatedShift);

        return { shifts: newShifts };
      });
    },

    deleteShift: (id) => {
      set((state) => {
        const newShifts = new Map(state.shifts);
        newShifts.delete(id);

        // Remove conflicts related to this shift
        const newConflicts = new Map(state.conflicts);
        state.conflicts.forEach((conflict, conflictId) => {
          if (conflict.shiftIds.includes(id)) {
            newConflicts.delete(conflictId);
          }
        });

        return {
          shifts: newShifts,
          conflicts: newConflicts,
        };
      });
    },

    // Conflict management
    addConflict: (conflictData) => {
      const id = generateConflictId();
      const conflict: ScheduleConflict = { ...conflictData, id };

      set((state) => {
        const newConflicts = new Map(state.conflicts);
        newConflicts.set(id, conflict);

        // Mark conflicting shifts
        const newShifts = new Map(state.shifts);
        conflict.shiftIds.forEach((shiftId) => {
          const shift = newShifts.get(shiftId);
          if (shift) {
            newShifts.set(shiftId, { ...shift, isConflict: true });
          }
        });

        return {
          conflicts: newConflicts,
          shifts: newShifts,
        };
      });
    },

    resolveConflict: (id) => {
      set((state) => {
        const conflict = state.conflicts.get(id);
        if (!conflict) return state;

        const newConflicts = new Map(state.conflicts);
        newConflicts.delete(id);

        // Unmark shifts if no other conflicts exist
        const newShifts = new Map(state.shifts);
        conflict.shiftIds.forEach((shiftId) => {
          const otherConflicts = Array.from(newConflicts.values()).filter((c) =>
            c.shiftIds.includes(shiftId)
          );

          if (otherConflicts.length === 0) {
            const shift = newShifts.get(shiftId);
            if (shift) {
              newShifts.set(shiftId, { ...shift, isConflict: false });
            }
          }
        });

        return {
          conflicts: newConflicts,
          shifts: newShifts,
        };
      });
    },

    clearConflicts: () => {
      set((state) => {
        // Unmark all shifts
        const newShifts = new Map(state.shifts);
        state.shifts.forEach((shift, id) => {
          if (shift.isConflict) {
            newShifts.set(id, { ...shift, isConflict: false });
          }
        });

        return {
          conflicts: new Map(),
          shifts: newShifts,
        };
      });
    },

    // Calendar navigation
    setView: (view) => set({ currentView: view }),

    setDate: (date) => set({ currentDate: date }),

    goToToday: () => set({ currentDate: new Date() }),

    nextPeriod: () => {
      const { currentView, currentDate } = get();
      const increment = getPeriodIncrement(currentView);
      set({ currentDate: increment(currentDate, 1) });
    },

    previousPeriod: () => {
      const { currentView, currentDate } = get();
      const increment = getPeriodIncrement(currentView);
      set({ currentDate: increment(currentDate, -1) });
    },

    // Filters
    setFilters: (updates) =>
      set((state) => ({
        filters: { ...state.filters, ...updates },
      })),

    toggleShiftType: (type) =>
      set((state) => {
        const types = new Set(state.filters.shiftTypes);
        if (types.has(type)) {
          types.delete(type);
        } else {
          types.add(type);
        }
        return {
          filters: { ...state.filters, shiftTypes: Array.from(types) },
        };
      }),

    toggleStaff: (staffId) =>
      set((state) => {
        const staff = new Set(state.filters.staffIds);
        if (staff.has(staffId)) {
          staff.delete(staffId);
        } else {
          staff.add(staffId);
        }
        return {
          filters: { ...state.filters, staffIds: Array.from(staff) },
        };
      }),

    resetFilters: () => set({ filters: DEFAULT_FILTERS }),

    // Drag-and-drop
    startDrag: (shiftId, source) => {
      const shift = get().shifts.get(shiftId);
      if (!shift) return;

      set({
        dragState: {
          isDragging: true,
          draggedShiftId: shiftId,
          sourceStaffId: source.staffId,
          sourceDate: source.date,
          targetStaffId: null,
          targetDate: null,
        },
      });
    },

    updateDragTarget: (staffId, date) => {
      set((state) => {
        if (!state.dragState.isDragging) return state;

        const draggedShift = state.shifts.get(state.dragState.draggedShiftId!);
        if (!draggedShift) return state;

        // Create temporary preview shift
        const tempShift: Shift = {
          ...draggedShift,
          staffId,
          date,
        };

        return {
          dragState: {
            ...state.dragState,
            targetStaffId: staffId,
            targetDate: date,
          },
          tempShift,
        };
      });
    },

    dropShift: (targetStaffId, targetDate) => {
      const state = get();
      if (!state.dragState.isDragging || !state.dragState.draggedShiftId) return;

      const shiftId = state.dragState.draggedShiftId;
      
      get().updateShift(shiftId, {
        staffId: targetStaffId,
        date: targetDate,
      });

      set({
        dragState: {
          isDragging: false,
          draggedShiftId: null,
          sourceStaffId: null,
          sourceDate: null,
          targetStaffId: null,
          targetDate: null,
        },
        tempShift: null,
      });
    },

    cancelDrag: () => {
      set({
        dragState: {
          isDragging: false,
          draggedShiftId: null,
          sourceStaffId: null,
          sourceDate: null,
          targetStaffId: null,
          targetDate: null,
        },
        tempShift: null,
      });
    },

    // Queries
    getShiftsByStaff: (staffId) => {
      return Array.from(get().shifts.values()).filter(
        (shift) => shift.staffId === staffId
      );
    },

    getShiftsByDate: (date) => {
      return Array.from(get().shifts.values()).filter(
        (shift) => shift.date === date
      );
    },

    getConflictsForShift: (shiftId) => {
      return Array.from(get().conflicts.values()).filter((conflict) =>
        conflict.shiftIds.includes(shiftId)
      );
    },

    // Reset
    reset: () =>
      set({
        shifts: new Map(),
        conflicts: new Map(),
        currentView: 'week',
        currentDate: new Date(),
        filters: DEFAULT_FILTERS,
        dragState: {
          isDragging: false,
          draggedShiftId: null,
          sourceStaffId: null,
          sourceDate: null,
          targetStaffId: null,
          targetDate: null,
        },
        tempShift: null,
      }),
  }),
  {
    name: 'dykstra-scheduling',
  }
);

// ============================================================================
// Selectors
// ============================================================================

/**
 * Derived state selectors for optimal performance
 */
export const useSchedulingSelectors = () => {
  const shifts = useSchedulingStore((state) => state.shifts);
  const conflicts = useSchedulingStore((state) => state.conflicts);
  const filters = useSchedulingStore((state) => state.filters);
  const dragState = useSchedulingStore((state) => state.dragState);
  const currentDate = useSchedulingStore((state) => state.currentDate);

  // Apply filters
  const filteredShifts = Array.from(shifts.values()).filter((shift) => {
    // Filter by shift type
    if (filters.shiftTypes.length > 0 && !filters.shiftTypes.includes(shift.type)) {
      return false;
    }

    // Filter by staff
    if (filters.staffIds.length > 0 && !filters.staffIds.includes(shift.staffId)) {
      return false;
    }

    // Filter cancelled shifts
    if (!filters.showCancelled && shift.status === 'cancelled') {
      return false;
    }

    // Filter conflicts
    if (!filters.showConflicts && shift.isConflict) {
      return false;
    }

    return true;
  });

  return {
    /** Filtered shifts as array */
    filteredShifts,

    /** All shifts as array */
    allShifts: Array.from(shifts.values()),

    /** Number of total shifts */
    totalShifts: shifts.size,

    /** Number of conflicts */
    conflictCount: conflicts.size,

    /** Number of error-level conflicts */
    errorCount: Array.from(conflicts.values()).filter(
      (c) => c.severity === 'error'
    ).length,

    /** Number of warning-level conflicts */
    warningCount: Array.from(conflicts.values()).filter(
      (c) => c.severity === 'warning'
    ).length,

    /** Whether currently dragging a shift */
    isDragging: dragState.isDragging,

    /** Whether any filters are active */
    hasActiveFilters:
      filters.shiftTypes.length > 0 ||
      filters.staffIds.length > 0 ||
      !filters.showCancelled ||
      !filters.showConflicts,

    /** Current date as ISO string */
    currentDateISO: currentDate.toISOString().split('T')[0],

    /** Shifts for current visible period */
    visibleShifts: filteredShifts.filter((shift) => {
      const shiftDate = new Date(shift.date);
      // TODO: Implement date range based on view
      return true;
    }),
  };
};
