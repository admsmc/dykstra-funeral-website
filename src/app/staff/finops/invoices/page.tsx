'use client';

import { useState } from 'react';
import { FileText, Plus, Search, Send, DollarSign, X, Loader2 } from 'lucide-react';
import { api } from '@/trpc/react';
import Link from 'next/link';
import { CardGridSkeleton, InvoiceTableSkeleton } from '@/components/skeletons/FinancialSkeletons';

/**
 * Invoice Management Page
 * 
 * List and manage AR invoices with:
 * - Filter by status (draft, sent, paid, overdue)
 * - Search by customer/invoice/case
 * - Quick actions: Send, Record Payment, Void
 * - Link to create new invoice
 */

type InvoiceStatus = 'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'void';

export default function InvoiceManagementPage() {
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // tRPC query
  const { data: invoices, isLoading, error, refetch } = api.financial.ar.listInvoices.useQuery({
    status: selectedStatus,
    funeralHomeId: 'fh-001', // TODO: Get from auth context
  });

  // Void mutation
  const voidInvoice = api.financial.ar.voidInvoice.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Filter invoices by search term
  const filteredInvoices = invoices?.filter(invoice => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      invoice.customerName.toLowerCase().includes(search) ||
      invoice.invoiceNumber.toLowerCase().includes(search) ||
      invoice.caseNumber.toLowerCase().includes(search)
    );
  }) || [];

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'sent':
        return 'bg-blue-100 text-blue-700';
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      case 'void':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Handle void invoice
  const handleVoid = (invoiceId: string, invoiceNumber: string) => {
    const reason = prompt(`Void invoice ${invoiceNumber}?\n\nEnter reason:`);
    if (reason) {
      voidInvoice.mutate({ invoiceId, reason });
    }
  };

  // Calculate stats
  const stats = {
    total: filteredInvoices.length,
    draft: filteredInvoices.filter(inv => inv.status === 'draft').length,
    sent: filteredInvoices.filter(inv => inv.status === 'sent').length,
    overdue: filteredInvoices.filter(inv => inv.status === 'overdue').length,
    paid: filteredInvoices.filter(inv => inv.status === 'paid').length,
    totalAmount: filteredInvoices.reduce((sum, inv) => sum + inv.balance, 0),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-[--navy]" />
            <div>
              <h1 className="text-3xl font-serif font-bold text-[--navy]">
                Invoices
              </h1>
              <p className="text-gray-600 mt-1">
                Manage accounts receivable invoices
              </p>
            </div>
          </div>

          <Link
            href="/staff/finops/invoices/new"
            className="px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-opacity-90 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Invoice
          </Link>
        </div>

        {/* Stats Cards */}
        {isLoading ? (
          <CardGridSkeleton cards={5} columns={5} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <button
            onClick={() => setSelectedStatus('all')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedStatus === 'all' ? 'border-[--navy] bg-[--cream]' : 'border-gray-200 bg-white hover:border-[--sage]'
            }`}
          >
            <div className="text-sm font-medium text-gray-600 mb-1">All Invoices</div>
            <div className="text-2xl font-bold text-[--navy]">{stats.total}</div>
          </button>

          <button
            onClick={() => setSelectedStatus('draft')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedStatus === 'draft' ? 'border-[--navy] bg-[--cream]' : 'border-gray-200 bg-white hover:border-[--sage]'
            }`}
          >
            <div className="text-sm font-medium text-gray-600 mb-1">Draft</div>
            <div className="text-2xl font-bold text-gray-700">{stats.draft}</div>
          </button>

          <button
            onClick={() => setSelectedStatus('sent')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedStatus === 'sent' ? 'border-[--navy] bg-[--cream]' : 'border-gray-200 bg-white hover:border-[--sage]'
            }`}
          >
            <div className="text-sm font-medium text-gray-600 mb-1">Sent</div>
            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
          </button>

          <button
            onClick={() => setSelectedStatus('overdue')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedStatus === 'overdue' ? 'border-[--navy] bg-[--cream]' : 'border-gray-200 bg-white hover:border-[--sage]'
            }`}
          >
            <div className="text-sm font-medium text-gray-600 mb-1">Overdue</div>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </button>

          <button
            onClick={() => setSelectedStatus('paid')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedStatus === 'paid' ? 'border-[--navy] bg-[--cream]' : 'border-gray-200 bg-white hover:border-[--sage]'
            }`}
          >
            <div className="text-sm font-medium text-gray-600 mb-1">Paid</div>
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            </button>
          </div>
        )}

        {/* Search */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by customer, invoice number, or case..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
              />
            </div>

            {selectedStatus !== 'all' && (
              <button
                onClick={() => setSelectedStatus('all')}
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
            <InvoiceTableSkeleton rows={10} />
          ) : error ? (
            <div className="p-8 text-center text-red-600">
              Error loading invoices
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Case
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Invoice Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                        No invoices found
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((invoice) => (
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
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(invoice.totalAmount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(invoice.balance)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(invoice.status)}`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {invoice.status === 'draft' && (
                              <button
                                onClick={() => alert('Send invoice functionality coming soon!')}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Send Invoice"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}
                            {(invoice.status === 'sent' || invoice.status === 'overdue') && invoice.balance > 0 && (
                              <button
                                onClick={() => alert('Record payment functionality coming soon!')}
                                className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Record Payment"
                              >
                                <DollarSign className="w-4 h-4" />
                              </button>
                            )}
                            {invoice.status !== 'paid' && (
                              <button
                                onClick={() => handleVoid(invoice.id, invoice.invoiceNumber)}
                                disabled={voidInvoice.isPending}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                title="Void Invoice"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        {!isLoading && !error && filteredInvoices.length > 0 && (
          <div className="mt-6 bg-[--cream] border border-[--navy] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-[--navy]">
                Total Outstanding Balance
              </div>
              <div className="text-3xl font-bold text-[--navy]">
                {formatCurrency(stats.totalAmount)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
