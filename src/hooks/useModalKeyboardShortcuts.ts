import { useEffect } from 'react';

/**
 * Global keyboard shortcuts for modal actions
 * 
 * Shortcuts:
 * - Cmd+Shift+P: New Purchase Order
 * - Cmd+Shift+I: Record Insurance Claim
 * - Cmd+Shift+T: Transfer Inventory
 * - Cmd+Shift+A: Approve Timesheet
 * - Cmd+Shift+S: Add Supplier
 * - Cmd+Shift+B: Pay Vendor Bill
 * - Cmd+Shift+R: Run Payroll
 */

interface ModalShortcuts {
  onNewPO?: () => void;
  onInsurance?: () => void;
  onTransfer?: () => void;
  onApprove?: () => void;
  onSupplier?: () => void;
  onPayBill?: () => void;
  onRunPayroll?: () => void;
}

export function useModalKeyboardShortcuts(shortcuts: ModalShortcuts) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if Cmd (Mac) or Ctrl (Windows/Linux) + Shift are pressed
      const isModifier = event.metaKey || event.ctrlKey;
      if (!isModifier || !event.shiftKey) return;

      // Prevent default browser behavior
      const key = event.key.toUpperCase();
      let handled = false;

      switch (key) {
        case 'P':
          if (shortcuts.onNewPO) {
            event.preventDefault();
            shortcuts.onNewPO();
            handled = true;
          }
          break;
        case 'I':
          if (shortcuts.onInsurance) {
            event.preventDefault();
            shortcuts.onInsurance();
            handled = true;
          }
          break;
        case 'T':
          if (shortcuts.onTransfer) {
            event.preventDefault();
            shortcuts.onTransfer();
            handled = true;
          }
          break;
        case 'A':
          if (shortcuts.onApprove) {
            event.preventDefault();
            shortcuts.onApprove();
            handled = true;
          }
          break;
        case 'S':
          if (shortcuts.onSupplier) {
            event.preventDefault();
            shortcuts.onSupplier();
            handled = true;
          }
          break;
        case 'B':
          if (shortcuts.onPayBill) {
            event.preventDefault();
            shortcuts.onPayBill();
            handled = true;
          }
          break;
        case 'R':
          if (shortcuts.onRunPayroll) {
            event.preventDefault();
            shortcuts.onRunPayroll();
            handled = true;
          }
          break;
      }

      if (handled) {
        // Show visual feedback
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg z-[9999] animate-fade-in-out';
        toast.textContent = `Keyboard shortcut: ⌘⇧${key}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
