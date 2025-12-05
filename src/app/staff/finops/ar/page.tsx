'use client';

import { useState } from 'react';
import { Calendar, FileText, Download, Filter, Search, AlertTriangle, TrendingUp } from 'lucide-react';
import { api } from '@/trpc/react';
import { CardGridSkeleton } from '@/components/skeletons/FinancialSkeletons';

/**
 * AR Aging Report Page
 * 
 * Displays accounts receivable aging analysis with:
 * - Aging buckets: Current, 0-30, 31-60, 61-90, 90+ days
 * - Filter by customer/case
 * - Sortable columns
 * - Export capability
 * - Integration with financial.router.ts ar.getAgingReport
 */

type SortField = 'customerName' | 'invoiceNumber' | 'invoiceDate' | 'dueDate' | 'totalAmount' | 'daysOverdue';
type SortDirection = 'asc' | 'desc';

export default function ARAgingReportPage() {
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('daysOverdue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedBucket, setSelectedBucket] = useState<string>('all');

  // tRPC query
  const { data: reportData, isLoading, error } = api.financial.ar.getAgingReport.useQuery({
    asOfDate: new Date(asOfDate),
    funeralHomeId: 'fh-001', // TODO: Get from auth context
  });

  // Mock invoice data since the endpoint returns structured aging data
  // In production, this would come from the API
  const mockInvoices = [
    { id: '1', invoiceNumber: 'INV-2024-001', customerName: 'Smith Family', caseNumber: 'CASE-001', invoiceDate: '2024-11-15', dueDate: '2024-12-15', totalAmount: 8500, paidAmount: 0, balance: 8500, daysOverdue: 0, bucket: 'current' },
    { id: '2', invoiceNumber: 'INV-2024-002', customerName: 'Johnson Family', caseNumber: 'CASE-002', invoiceDate: '2024-10-20', dueDate: '2024-11-20', totalAmount: 12000, paidAmount: 5000, balance: 7000, daysOverdue: 15, bucket: '0-30' },
    { id: '3', invoiceNumber: 'INV-2024-003', customerName: 'Williams Estate', caseNumber: 'CASE-003', invoiceDate: '2024-09-10', dueDate: '2024-10-10', totalAmount: 6500, paidAmount: 1000, balance: 5500, daysOverdue: 56, bucket: '31-60' },
    { id: '4', invoiceNumber: 'INV-2024-004', customerName: 'Brown Family', caseNumber: 'CASE-004', invoiceDate: '2024-08-15', dueDate: '2024-09-15', totalAmount: 9200, paidAmount: 2000, balance: 7200, daysOverdue: 81, bucket: '61-90' },
    { id: '5', invoiceNumber: 'INV-2024-005', customerName: 'Davis Family', caseNumber: 'CASE-005', invoiceDate: '2024-06-20', dueDate: '2024-07-20', totalAmount: 15000, paidAmount: 0, balance: 15000, daysOverdue: 138, bucket: '90+' },
    { id: '6', invoiceNumber: 'INV-2024-006', customerName: 'Miller Family', caseNumber: 'CASE-006', invoiceDate: '2024-11-25', dueDate: '2024-12-25', totalAmount: 7800, paidAmount: 0, balance: 7800, daysOverdue: 0, bucket: 'current' },
    { id: '7', invoiceNumber: 'INV-2024-007', customerName: 'Wilson Estate', caseNumber: 'CASE-007', invoiceDate: '2024-10-05', dueDate: '2024-11-05', totalAmount: 11500, paidAmount: 11500, balance: 0, daysOverdue: 0, bucket: 'current' },
    { id: '8', invoiceNumber: 'INV-2024-008', customerName: 'Moore Family', caseNumber: 'CASE-008', invoiceDate: '2024-10-12', dueDate: '2024-11-12', totalAmount: 5200, paidAmount: 0, balance: 5200, daysOverdue: 23, bucket: '0-30' },
    { id: '9', invoiceNumber: 'INV-2024-009', customerName: 'Taylor Family', caseNumber: 'CASE-009', invoiceDate: '2024-09-18', dueDate: '2024-10-18', totalAmount: 8900, paidAmount: 3000, balance: 5900, daysOverdue: 48, bucket: '31-60' },
    { id: '10', invoiceNumber: 'INV-2024-010', customerName: 'Anderson Estate', caseNumber: 'CASE-010', invoiceDate: '2024-07-05', dueDate: '2024-08-05', totalAmount: 13500, paidAmount: 0, balance: 13500, daysOverdue: 122, bucket: '90+' },
  ];

  // Calculate aging bucket totals
  const buckets = {
    current: { label: 'Current', count: 0, total: 0 },
    '0-30': { label: '1-30 Days', count: 0, total: 0 },
    '31-60': { label: '31-60 Days', count: 0, total: 0 },
    '61-90': { label: '61-90 Days', count: 0, total: 0 },
    '90+': { label: '90+ Days', count: 0, total: 0 },
  };

  mockInvoices.forEach(invoice => {
    if (invoice.balance > 0) {
      buckets[invoice.bucket as keyof typeof buckets].count++;
      buckets[invoice.bucket as keyof typeof buckets].total += invoice.balance;
    }
  });

  // Filter invoices
  const filteredInvoices = mockInvoices.filter(invoice => {
    // Filter by balance > 0
    if (invoice.balance === 0) return false;

    // Filter by search term
    if (searchTerm && !invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !invoice.caseNumber.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filter by bucket
    if (selectedBucket !== 'all' && invoice.bucket !== selectedBucket) {
      return false;
    }

    return true;
  });

  // Sort invoices
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    let compareValue = 0;

    switch (sortField) {
      case 'customerName':
        compareValue = a.customerName.localeCompare(b.customerName);
        break;
      case 'invoiceNumber':
        compareValue = a.invoiceNumber.localeCompare(b.invoiceNumber);
        break;
      case 'invoiceDate':
        compareValue = new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime();
        break;
      case 'dueDate':
        compareValue = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
      case 'totalAmount':
        compareValue = a.balance - b.balance;
        break;
      case 'daysOverdue':
        compareValue = a.daysOverdue - b.daysOverdue;
        break;
    }

    return sortDirection === 'asc' ? compareValue : -compareValue;
  });

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get bucket color
  const getBucketColor = (bucket: string) => {
    switch (bucket) {
      case 'current': return 'text-green-600 bg-green-50';
      case '0-30': return 'text-blue-600 bg-blue-50';
      case '31-60': return 'text-yellow-600 bg-yellow-50';
      case '61-90': return 'text-orange-600 bg-orange-50';
      case '90+': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Calculate totals
  const grandTotal = filteredInvoices.reduce((sum, inv) => sum + inv.balance, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-[--navy]" />
              <div>
                <h1 className="text-3xl font-serif font-bold text-[--navy]">
                  AR Aging Report
                </h1>
                <p className="text-gray-600 mt-1">
                  Accounts receivable aging analysis by customer
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert('Export functionality coming soon!')}
              className="px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-opacity-90 transition-all flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export to Excel
            </button>
          </div>

          {/* As of Date */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">As of Date:</label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
            />
          </div>
        </div>

        {/* Aging Buckets Summary */}
        {isLoading ? (
          <CardGridSkeleton cards={5} columns={5} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {Object.entries(buckets).map(([key, bucket]) => (
              <button
              key={key}
              onClick={() => setSelectedBucket(selectedBucket === key ? 'all' : key)}
              className={`
                p-6 rounded-lg border-2 transition-all text-left
                ${selectedBucket === key ? 'border-[--navy] bg-[--cream]' : 'border-gray-200 bg-white hover:border-[--sage]'}
              `}
            >
              <div className="text-sm font-medium text-gray-600 mb-2">{bucket.label}</div>
              <div className="text-2xl font-bold text-[--navy] mb-1">
                {formatCurrency(bucket.total)}
              </div>
              <div className="text-sm text-gray-500">
                {bucket.count} {bucket.count === 1 ? 'invoice' : 'invoices'}
              </div>
              </button>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by customer name, invoice number, or case..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
              />
            </div>

            {selectedBucket !== 'all' && (
              <button
                onClick={() => setSelectedBucket('all')}
                className="px-4 py-2 text-sm text-[--navy] hover:bg-gray-50 rounded-lg transition-colors"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {Array.from({ length: 10 }).map((_, idx) => (
                  <div key={idx} className="grid grid-cols-8 gap-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    onClick={() => handleSort('invoiceNumber')}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Invoice #
                  </th>
                  <th
                    onClick={() => handleSort('customerName')}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Case
                  </th>
                  <th
                    onClick={() => handleSort('invoiceDate')}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Invoice Date
                  </th>
                  <th
                    onClick={() => handleSort('dueDate')}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Due Date
                  </th>
                  <th
                    onClick={() => handleSort('totalAmount')}
                    className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Balance
                  </th>
                  <th
                    onClick={() => handleSort('daysOverdue')}
                    className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Days Overdue
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Bucket
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No outstanding invoices found
                    </td>
                  </tr>
                ) : (
                  sortedInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm text-[--navy] font-semibold">
                          {invoice.invoiceNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.customerName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {invoice.caseNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {formatDate(invoice.invoiceDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {formatDate(invoice.dueDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(invoice.balance)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`text-sm font-semibold ${invoice.daysOverdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {invoice.daysOverdue > 0 ? invoice.daysOverdue : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getBucketColor(invoice.bucket)}`}>
                          {buckets[invoice.bucket as keyof typeof buckets].label}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-[--navy]">
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-sm font-semibold text-[--navy]">
                    Total Outstanding
                  </td>
                  <td className="px-6 py-4 text-right text-lg font-bold text-[--navy]">
                    {formatCurrency(grandTotal)}
                  </td>
                  <td colSpan={2} className="px-6 py-4 text-sm text-gray-600 text-right">
                    {filteredInvoices.length} {filteredInvoices.length === 1 ? 'invoice' : 'invoices'}
                  </td>
                </tr>
              </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
