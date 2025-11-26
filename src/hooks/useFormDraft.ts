import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export interface UseFormDraftOptions<T> {
  key: string; // Unique storage key for this form
  data: T; // Current form data
  enabled?: boolean; // Enable/disable draft saving (default: true)
  autosaveInterval?: number; // Autosave interval in ms (default: 30000 = 30s)
  onRestore?: (data: T) => void; // Callback when draft is restored
}

export interface UseFormDraftReturn<T> {
  hasDraft: boolean;
  lastSaved: Date | null;
  saveDraft: () => void;
  clearDraft: () => void;
  restoreDraft: () => void;
  isDirty: boolean;
}

/**
 * Hook for auto-saving form data to localStorage
 * 
 * Features:
 * - Auto-saves form data every 30 seconds (configurable)
 * - Detects and restores drafts on mount
 * - Tracks last save time
 * - Shows "Draft saved" toast notifications
 * - Tracks dirty state (unsaved changes)
 * 
 * @example
 * const { hasDraft, restoreDraft, isDirty } = useFormDraft({
 *   key: 'arrangements-form',
 *   data: formState,
 *   onRestore: (data) => setFormState(data),
 * });
 */
export function useFormDraft<T extends Record<string, any>>({
  key,
  data,
  enabled = true,
  autosaveInterval = 30000,
  onRestore,
}: UseFormDraftOptions<T>): UseFormDraftReturn<T> {
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const initialDataRef = useRef<T | null>(null);
  const storageKey = `form-draft:${key}`;

  // Check for existing draft on mount
  useEffect(() => {
    if (!enabled) return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHasDraft(true);
        setLastSaved(new Date(parsed.savedAt));
      }
    } catch (error) {
      console.error('Failed to check for draft:', error);
    }

    // Store initial data for dirty checking
    initialDataRef.current = data;
  }, [storageKey, enabled]);

  // Track dirty state
  useEffect(() => {
    if (!initialDataRef.current) return;
    
    const isDataDirty = JSON.stringify(data) !== JSON.stringify(initialDataRef.current);
    setIsDirty(isDataDirty);
  }, [data]);

  // Auto-save draft
  useEffect(() => {
    if (!enabled || !isDirty) return;

    const timer = setInterval(() => {
      saveDraft();
    }, autosaveInterval);

    return () => clearInterval(timer);
  }, [enabled, isDirty, autosaveInterval, data]);

  const saveDraft = () => {
    if (!enabled) return;

    try {
      const draft = {
        data,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(draft));
      setLastSaved(new Date());
      setHasDraft(true);
      toast.success('Draft saved', {
        duration: 2000,
        position: 'bottom-right',
      });
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft');
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(storageKey);
      setHasDraft(false);
      setLastSaved(null);
      setIsDirty(false);
      initialDataRef.current = data;
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  };

  const restoreDraft = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        toast.error('No draft found');
        return;
      }

      const parsed = JSON.parse(stored);
      if (onRestore) {
        onRestore(parsed.data);
      }
      setLastSaved(new Date(parsed.savedAt));
      toast.success('Draft restored');
    } catch (error) {
      console.error('Failed to restore draft:', error);
      toast.error('Failed to restore draft');
    }
  };

  return {
    hasDraft,
    lastSaved,
    saveDraft,
    clearDraft,
    restoreDraft,
    isDirty,
  };
}
