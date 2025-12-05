import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (event: KeyboardEvent) => void;
  description?: string;
}

/**
 * Hook for registering global keyboard shortcuts
 * 
 * @example
 * ```tsx
 * useKeyboardShortcut({
 *   key: '/',
 *   handler: () => searchInputRef.current?.focus(),
 *   description: 'Focus search'
 * });
 * 
 * useKeyboardShortcut({
 *   key: 'k',
 *   ctrl: true,
 *   handler: () => openCommandPalette(),
 *   description: 'Open command palette'
 * });
 * ```
 */
export function useKeyboardShortcut(shortcut: KeyboardShortcut): void {
  const { key, ctrl, shift, alt, meta, handler } = shortcut;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the key matches
      if (event.key.toLowerCase() !== key.toLowerCase()) {
        return;
      }

      // Check modifier keys
      if (ctrl && !event.ctrlKey) return;
      if (shift && !event.shiftKey) return;
      if (alt && !event.altKey) return;
      if (meta && !event.metaKey) return;

      // Don't trigger if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      const isInputField = 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Allow '/' to focus search even in non-input contexts (like GitHub)
      if (key === '/' && !isInputField) {
        event.preventDefault();
        handler(event);
        return;
      }

      // For other shortcuts, don't trigger in input fields unless explicitly using modifiers
      if (isInputField && !ctrl && !meta && !alt) {
        return;
      }

      event.preventDefault();
      handler(event);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, ctrl, shift, alt, meta, handler]);
}

/**
 * Hook for registering multiple keyboard shortcuts at once
 * 
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   { key: '/', handler: focusSearch },
 *   { key: 'k', ctrl: true, handler: openCommandPalette },
 *   { key: 'Escape', handler: closeModal }
 * ]);
 * ```
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]): void {
  shortcuts.forEach((shortcut) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useKeyboardShortcut(shortcut);
  });
}
