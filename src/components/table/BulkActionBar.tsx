"use client";

import { X } from 'lucide-react';

export interface BulkAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Bulk Action Bar
 * Displayed when rows are selected, provides bulk operations
 */
export function BulkActionBar({ 
  selectedCount,
  actions,
  onClearSelection
}: { 
  selectedCount: number;
  actions?: BulkAction[];
  onClearSelection: () => void;
}) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-blue-50 border-b border-blue-200">
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-blue-900">
          {selectedCount} {selectedCount === 1 ? 'row' : 'rows'} selected
        </p>
        <button
          onClick={onClearSelection}
          className="inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-900"
        >
          <X className="w-4 h-4" />
          Clear selection
        </button>
      </div>
      
      <div className="flex items-center gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const variantClasses = action.variant === 'danger'
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50';

          return (
            <button
              key={index}
              onClick={action.onClick}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${variantClasses}`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
