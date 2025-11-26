"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Global keyboard shortcuts hook
 * 
 * Shortcuts:
 * - N: New case
 * - /: Focus search
 * - Esc: Close modals/clear focus
 * - Ctrl+K / Cmd+K: Command palette (future)
 */

interface UseKeyboardShortcutsOptions {
  onNewCase?: () => void;
  onFocusSearch?: () => void;
  onEscape?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const router = useRouter();
  const { onNewCase, onFocusSearch, onEscape, enabled = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs/textareas
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Escape even in inputs
        if (event.key === "Escape" && onEscape) {
          onEscape();
        }
        return;
      }

      // N - New case
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (onNewCase) {
          onNewCase();
        } else {
          router.push("/staff/cases/new");
        }
      }

      // / - Focus search
      if (event.key === "/") {
        event.preventDefault();
        if (onFocusSearch) {
          onFocusSearch();
        } else {
          const searchInput = document.querySelector<HTMLInputElement>('input[type="text"]');
          searchInput?.focus();
        }
      }

      // Escape - Close modals/clear focus
      if (event.key === "Escape" && onEscape) {
        event.preventDefault();
        onEscape();
      }

      // Ctrl+K or Cmd+K - Command palette (future enhancement)
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        // Future: Open command palette
        console.log("Command palette (not yet implemented)");
      }
    },
    [enabled, onNewCase, onFocusSearch, onEscape, router]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Hook to display keyboard shortcut hints
 */
export function useKeyboardShortcutHints() {
  return {
    newCase: { key: "N", label: "New case" },
    search: { key: "/", label: "Search" },
    escape: { key: "Esc", label: "Close/Clear" },
    commandPalette: { key: "⌘K", label: "Command palette" },
  };
}
