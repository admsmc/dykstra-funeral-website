import { createPersistedStore } from '@/lib/store';

/**
 * Template Editor Store
 * 
 * Manages template editing state with undo/redo history and autosave.
 * Persists current template and dirty state to localStorage.
 */

export interface Template {
  id: string;
  name: string;
  category: string;
  htmlTemplate: string;
  cssStyles: string;
  [key: string]: any; // Allow other properties
}

interface TemplateEditorState {
  // Current template
  currentTemplate: Template | null;
  
  // Dirty state
  isDirty: boolean;
  lastSaved: Date | null;
  
  // History for undo/redo
  history: Template[];
  historyIndex: number;
  maxHistorySize: number;
  
  // Autosave
  autosaveEnabled: boolean;
  autosaveInterval: number; // milliseconds
  
  // Actions
  setTemplate: (template: Template) => void;
  updateTemplate: (updates: Partial<Template>) => void;
  save: () => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  
  // Settings
  setAutosaveEnabled: (enabled: boolean) => void;
  setAutosaveInterval: (interval: number) => void;
}

export const useTemplateEditorStore = createPersistedStore<TemplateEditorState>(
  'template-editor',
  (set, get) => ({
    // Initial state
    currentTemplate: null,
    isDirty: false,
    lastSaved: null,
    history: [],
    historyIndex: -1,
    maxHistorySize: 50,
    autosaveEnabled: true,
    autosaveInterval: 30000, // 30 seconds
    
    // Set initial template
    setTemplate: (template) => {
      set({
        currentTemplate: template,
        isDirty: false,
        lastSaved: new Date(),
        history: [template],
        historyIndex: 0,
      });
    },
    
    // Update template (adds to history)
    updateTemplate: (updates) => {
      const { currentTemplate, history, historyIndex, maxHistorySize } = get();
      if (!currentTemplate) return;
      
      const updatedTemplate = { ...currentTemplate, ...updates };
      
      // Trim history if we're not at the end
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(updatedTemplate);
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      }
      
      set({
        currentTemplate: updatedTemplate,
        isDirty: true,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });
    },
    
    // Save (mark as saved)
    save: () => {
      set({
        isDirty: false,
        lastSaved: new Date(),
      });
    },
    
    // Undo
    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex <= 0) return;
      
      const newIndex = historyIndex - 1;
      set({
        currentTemplate: history[newIndex],
        historyIndex: newIndex,
        isDirty: true,
      });
    },
    
    // Redo
    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex >= history.length - 1) return;
      
      const newIndex = historyIndex + 1;
      set({
        currentTemplate: history[newIndex],
        historyIndex: newIndex,
        isDirty: true,
      });
    },
    
    // Reset
    reset: () => {
      set({
        currentTemplate: null,
        isDirty: false,
        lastSaved: null,
        history: [],
        historyIndex: -1,
      });
    },
    
    // Settings
    setAutosaveEnabled: (enabled) => set({ autosaveEnabled: enabled }),
    setAutosaveInterval: (interval) => set({ autosaveInterval: interval }),
  })
);

/**
 * Selectors for performance and convenience
 */
export const useTemplateEditorSelectors = () => ({
  canUndo: useTemplateEditorStore((state) => state.historyIndex > 0),
  canRedo: useTemplateEditorStore(
    (state) => state.historyIndex < state.history.length - 1
  ),
  hasUnsavedChanges: useTemplateEditorStore((state) => state.isDirty),
  isTemplateLoaded: useTemplateEditorStore((state) => state.currentTemplate !== null),
  templateName: useTemplateEditorStore((state) => state.currentTemplate?.name || 'Untitled'),
});

/**
 * Hook for autosave functionality
 * 
 * Use this in the template editor component to enable autosave.
 * 
 * @example
 * ```typescript
 * import { useTemplateAutosave } from '@/stores/template-editor-store';
 * 
 * function TemplateEditor() {
 *   const save = trpc.template.update.useMutation();
 *   useTemplateAutosave((template) => save.mutate(template));
 *   // ...
 * }
 * ```
 */
export function useTemplateAutosave(onSave: (template: Template) => void | Promise<void>) {
  const { currentTemplate, isDirty, autosaveEnabled, autosaveInterval, save } =
    useTemplateEditorStore();
  
  // Effect hook would go here in actual usage
  // This is just the type definition
  // Implementation would use useEffect with interval
  
  return {
    trigger: async () => {
      if (currentTemplate && isDirty && autosaveEnabled) {
        await onSave(currentTemplate);
        save();
      }
    },
  };
}
