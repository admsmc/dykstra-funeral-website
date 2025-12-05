"use client";

import { useState, useRef, useEffect } from 'react';
import type { Table } from '@tanstack/react-table';
import { Eye, EyeOff, Columns } from 'lucide-react';

/**
 * Column Visibility Toggle Dropdown
 * Allows users to show/hide table columns
 */
export function ColumnVisibilityToggle<TData>({ 
  table 
}: { 
  table: Table<TData>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const allColumns = table.getAllLeafColumns();
  const visibleColumns = allColumns.filter((col) => col.getIsVisible());

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
        aria-label="Toggle column visibility"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Columns className="w-4 h-4" aria-hidden="true" />
        Columns ({visibleColumns.length}/{allColumns.length})
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10"
          role="menu"
          aria-label="Column visibility options"
        >
          <div className="px-3 py-2 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Toggle Columns
            </p>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {allColumns
              .filter((col) => col.id !== 'select' && col.id !== 'actions')
              .map((column) => {
                const isVisible = column.getIsVisible();
                const columnName = typeof column.columnDef.header === 'string'
                  ? column.columnDef.header
                  : column.id;

                return (
                  <label
                    key={column.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={column.getToggleVisibilityHandler()}
                      className="w-4 h-4 rounded border-gray-300 text-[--navy] focus:ring-[--navy]"
                    />
                    <span className="flex-1 text-sm text-gray-700">
                      {columnName}
                    </span>
                    {isVisible ? (
                      <Eye className="w-4 h-4 text-gray-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </label>
                );
              })}
          </div>

          <div className="px-3 py-2 border-t border-gray-200">
            <button
              onClick={() => {
                table.toggleAllColumnsVisible(false);
                // Always keep select and actions visible
                const selectCol = table.getColumn('select');
                const actionsCol = table.getColumn('actions');
                if (selectCol) selectCol.toggleVisibility(true);
                if (actionsCol) actionsCol.toggleVisibility(true);
              }}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              Hide All
            </button>
            <span className="mx-2 text-gray-300">|</span>
            <button
              onClick={() => table.toggleAllColumnsVisible(true)}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              Show All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
