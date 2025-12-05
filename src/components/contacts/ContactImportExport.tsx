'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ContactImportExportProps {
  onImport: (data: any[]) => Promise<{ success: number; failed: number; errors: string[] }>;
  onExport: (format: 'csv' | 'xlsx') => Promise<void>;
}

interface ImportPreview {
  total: number;
  valid: number;
  invalid: number;
  data: Array<{ row: number; status: 'valid' | 'invalid'; errors?: string[]; data: any }>;
}

export function ContactImportExport({ onImport, onExport }: ContactImportExportProps) {
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      toast.error('Please select a CSV or XLSX file');
      return;
    }

    setImportFile(file);
    setIsProcessing(true);

    try {
      // Parse CSV (simplified - real implementation would use a library like papaparse)
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map((h) => h.trim());

      const preview: ImportPreview = {
        total: lines.length - 1,
        valid: 0,
        invalid: 0,
        data: [],
      };

      // Validate first 10 rows for preview
      for (let i = 1; i <= Math.min(10, lines.length - 1); i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        const row: any = {};
        const errors: string[] = [];

        headers.forEach((header, index) => {
          row[header] = values[index];
        });

        // Basic validation
        if (!row.firstName && !row.lastName) {
          errors.push('First name or last name required');
        }
        if (row.email && !row.email.includes('@')) {
          errors.push('Invalid email format');
        }

        const isValid = errors.length === 0;
        if (isValid) preview.valid++;
        else preview.invalid++;

        preview.data.push({
          row: i,
          status: isValid ? 'valid' : 'invalid',
          errors: isValid ? undefined : errors,
          data: row,
        });
      }

      setImportPreview(preview);
    } catch (error) {
      toast.error('Failed to parse file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!importFile || !importPreview) return;

    setIsProcessing(true);
    try {
      const result = await onImport(importPreview.data.map((d) => d.data));
      toast.success(
        `Import complete: ${result.success} succeeded, ${result.failed} failed`
      );
      if (result.errors.length > 0) {
        console.error('Import errors:', result.errors);
      }
      setShowImport(false);
      setImportFile(null);
      setImportPreview(null);
    } catch (error) {
      toast.error('Import failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setIsProcessing(true);
    try {
      await onExport(format);
      toast.success(`Contacts exported as ${format.toUpperCase()}`);
      setShowExport(false);
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Trigger Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowImport(true)}
          className="px-4 py-2 border-2 border-[--sage] text-[--sage] rounded-lg hover:bg-[--cream] transition-all flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Import
        </button>
        <button
          onClick={() => setShowExport(true)}
          className="px-4 py-2 border-2 border-[--sage] text-[--sage] rounded-lg hover:bg-[--cream] transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Import Modal */}
      <AnimatePresence>
        {showImport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-6 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-serif text-[--navy] mb-4">Import Contacts</h2>

              {/* File Upload */}
              {!importFile && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
                  <Upload className="w-12 h-12 text-[--charcoal] opacity-40 mx-auto mb-3" />
                  <p className="text-sm text-[--charcoal] mb-3">
                    Upload a CSV or XLSX file with contact data
                  </p>
                  <label className="inline-block px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 cursor-pointer transition-all">
                    Select File
                    <input
                      type="file"
                      accept=".csv,.xlsx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Import Preview */}
              {importFile && importPreview && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[--sage]" />
                      <span className="font-medium text-[--navy]">{importFile.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        setImportFile(null);
                        setImportPreview(null);
                      }}
                      className="text-sm text-[--sage] hover:underline"
                    >
                      Change File
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 border border-gray-200 rounded-lg">
                      <p className="text-2xl font-bold text-[--navy]">{importPreview.total}</p>
                      <p className="text-xs text-[--charcoal] opacity-60">Total Rows</p>
                    </div>
                    <div className="p-3 border border-green-200 rounded-lg bg-green-50">
                      <p className="text-2xl font-bold text-green-700">{importPreview.valid}</p>
                      <p className="text-xs text-green-700">Valid</p>
                    </div>
                    <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                      <p className="text-2xl font-bold text-red-700">{importPreview.invalid}</p>
                      <p className="text-xs text-red-700">Invalid</p>
                    </div>
                  </div>

                  {/* Preview Rows */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-[--navy]">Preview (first 10 rows)</h3>
                    {importPreview.data.map((row) => (
                      <div
                        key={row.row}
                        className={`p-3 border rounded-lg ${
                          row.status === 'valid'
                            ? 'border-green-200 bg-green-50'
                            : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs text-[--charcoal] opacity-60">
                            Row {row.row}
                          </span>
                          {row.status === 'valid' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <p className="text-sm text-[--navy] mb-1">
                          {row.data.firstName} {row.data.lastName} - {row.data.email}
                        </p>
                        {row.errors && row.errors.length > 0 && (
                          <div className="flex items-start gap-2 mt-2">
                            <AlertCircle className="w-3 h-3 text-red-600 mt-0.5" />
                            <p className="text-xs text-red-700">{row.errors.join(', ')}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowImport(false);
                    setImportFile(null);
                    setImportPreview(null);
                  }}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-[--navy] rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={isProcessing || !importFile || !importPreview}
                  className="flex-1 px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
                >
                  {isProcessing ? 'Importing...' : `Import ${importPreview?.total || 0} Contacts`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Export Modal */}
      <AnimatePresence>
        {showExport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-xl font-serif text-[--navy] mb-4">Export Contacts</h2>

              <p className="text-sm text-[--charcoal] opacity-60 mb-6">
                Choose a format to export your contact data
              </p>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleExport('csv')}
                  disabled={isProcessing}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[--sage] hover:bg-[--cream] transition-all text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-[--navy]">CSV Format</p>
                      <p className="text-xs text-[--charcoal] opacity-60">
                        Compatible with Excel, Google Sheets
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleExport('xlsx')}
                  disabled={isProcessing}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[--sage] hover:bg-[--cream] transition-all text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-[--navy]">Excel Format (XLSX)</p>
                      <p className="text-xs text-[--charcoal] opacity-60">
                        Native Excel format with formatting
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowExport(false)}
                disabled={isProcessing}
                className="w-full px-4 py-2 border-2 border-gray-300 text-[--navy] rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
