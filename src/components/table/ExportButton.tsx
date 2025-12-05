"use client";

import type { ColumnDef } from '@tanstack/react-table';
import { Download } from 'lucide-react';
import { exportToCSV } from './export-utils';

/**
 * Export to CSV Button
 * Downloads table data as CSV file
 */
export function ExportButton<TData>({ 
  data,
  columns,
  filename = 'export'
}: { 
  data: TData[];
  columns: ColumnDef<TData>[];
  filename?: string;
}) {
  const handleExport = () => {
    exportToCSV(data, columns, filename);
  };

  return (
    <button
      onClick={handleExport}
      disabled={data.length === 0}
      className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
      aria-label="Export table data to CSV"
    >
      <Download className="w-4 h-4" aria-hidden="true" />
      Export CSV
    </button>
  );
}
