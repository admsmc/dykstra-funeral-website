import type { ColumnDef } from '@tanstack/react-table';

/**
 * Export table data to CSV
 * Handles nested accessors and custom cell renderers
 */
export function exportToCSV<TData>(
  data: TData[],
  columns: ColumnDef<TData>[],
  filename: string
) {
  // Extract headers from columns
  const headers = columns
    .filter((col) => {
      // Exclude select/action columns
      if (col.id === 'select' || col.id === 'actions') return false;
      return col.header;
    })
    .map((col) => {
      if (typeof col.header === 'string') return col.header;
      if (typeof col.header === 'function') {
        // For function headers, use accessorKey or id as fallback
        return (col.accessorKey as string) || col.id || 'Column';
      }
      return 'Column';
    });

  // Extract rows
  const rows = data.map((row) =>
    columns
      .filter((col) => col.id !== 'select' && col.id !== 'actions')
      .map((col) => {
        const accessor = col.accessorKey as keyof TData;
        if (accessor && row[accessor] !== undefined) {
          const value = row[accessor];
          // Handle dates
          if (value instanceof Date) {
            return value.toLocaleDateString();
          }
          // Handle objects/arrays
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
          }
          // Escape commas and quotes in strings
          if (typeof value === 'string') {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        }
        return '';
      })
  );

  // Generate CSV content
  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
