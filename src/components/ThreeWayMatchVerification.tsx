'use client';

import { Check, X, AlertTriangle, FileText, Package, Receipt } from 'lucide-react';

/**
 * 3-Way Match Verification Component
 * 
 * Displays PO/Receipt/Invoice comparison with:
 * - Line-by-line matching
 * - Variance highlighting
 * - Match status indicators
 * - Tolerance thresholds
 */

export interface MatchLineItem {
  description: string;
  poQuantity: number;
  poUnitPrice: number;
  poAmount: number;
  receiptQuantity: number;
  invoiceQuantity: number;
  invoiceUnitPrice: number;
  invoiceAmount: number;
  quantityVariance: number;
  priceVariance: number;
  amountVariance: number;
  matchStatus: 'exact' | 'within-tolerance' | 'variance' | 'missing';
}

export interface ThreeWayMatchData {
  poNumber: string;
  receiptNumber: string;
  invoiceNumber: string;
  vendor: string;
  poTotal: number;
  receiptTotal: number;
  invoiceTotal: number;
  lineItems: MatchLineItem[];
  overallStatus: 'matched' | 'tolerance' | 'variance' | 'rejected';
  totalVariance: number;
  variancePercentage: number;
}

interface ThreeWayMatchVerificationProps {
  data: ThreeWayMatchData;
  onApprove?: () => void;
  onReject?: () => void;
  showActions?: boolean;
  toleranceThreshold?: number; // Percentage threshold for acceptable variance
}

export function ThreeWayMatchVerification({
  data,
  onApprove,
  onReject,
  showActions = true,
  toleranceThreshold = 5, // 5% default tolerance
}: ThreeWayMatchVerificationProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exact':
      case 'matched':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'within-tolerance':
      case 'tolerance':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'variance':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'rejected':
      case 'missing':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'exact':
      case 'matched':
        return <Check className="w-5 h-5" />;
      case 'within-tolerance':
      case 'tolerance':
        return <AlertTriangle className="w-5 h-5" />;
      case 'variance':
      case 'rejected':
      case 'missing':
        return <X className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className={`border-2 rounded-lg p-6 ${getStatusColor(data.overallStatus)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(data.overallStatus)}
            <div>
              <h3 className="text-lg font-semibold">
                3-Way Match Status: {data.overallStatus.charAt(0).toUpperCase() + data.overallStatus.slice(1)}
              </h3>
              <p className="text-sm mt-1">
                Total Variance: {formatCurrency(data.totalVariance)} ({data.variancePercentage.toFixed(2)}%)
              </p>
            </div>
          </div>
          
          {data.overallStatus === 'matched' && (
            <div className="text-sm font-medium">
              ✓ All items match within {toleranceThreshold}% tolerance
            </div>
          )}
        </div>
      </div>

      {/* Document Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Purchase Order */}
        <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Purchase Order</h4>
          </div>
          <div className="text-sm text-gray-600 mb-1">PO#: {data.poNumber}</div>
          <div className="text-2xl font-bold text-blue-600">{formatCurrency(data.poTotal)}</div>
        </div>

        {/* Receipt */}
        <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-purple-900">Receipt</h4>
          </div>
          <div className="text-sm text-gray-600 mb-1">REC#: {data.receiptNumber}</div>
          <div className="text-2xl font-bold text-purple-600">{formatCurrency(data.receiptTotal)}</div>
        </div>

        {/* Invoice */}
        <div className="bg-white border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Receipt className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-green-900">Vendor Invoice</h4>
          </div>
          <div className="text-sm text-gray-600 mb-1">INV#: {data.invoiceNumber}</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(data.invoiceTotal)}</div>
        </div>
      </div>

      {/* Line Items Comparison */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-[--navy]">Line Item Comparison</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                <th className="px-4 py-3 text-center font-semibold text-blue-700">PO Qty</th>
                <th className="px-4 py-3 text-center font-semibold text-purple-700">Recv Qty</th>
                <th className="px-4 py-3 text-center font-semibold text-green-700">Inv Qty</th>
                <th className="px-4 py-3 text-right font-semibold text-blue-700">PO Price</th>
                <th className="px-4 py-3 text-right font-semibold text-green-700">Inv Price</th>
                <th className="px-4 py-3 text-right font-semibold text-blue-700">PO Amount</th>
                <th className="px-4 py-3 text-right font-semibold text-green-700">Inv Amount</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Variance</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.lineItems.map((item, index) => {
                const hasVariance = item.matchStatus !== 'exact';
                return (
                  <tr 
                    key={index}
                    className={`
                      ${hasVariance ? 'bg-yellow-50' : 'hover:bg-gray-50'}
                      transition-colors
                    `}
                  >
                    <td className="px-4 py-3 font-medium">{item.description}</td>
                    <td className="px-4 py-3 text-center text-blue-700">{item.poQuantity}</td>
                    <td className="px-4 py-3 text-center text-purple-700">{item.receiptQuantity}</td>
                    <td className={`px-4 py-3 text-center ${item.quantityVariance !== 0 ? 'text-orange-600 font-bold' : 'text-green-700'}`}>
                      {item.invoiceQuantity}
                      {item.quantityVariance !== 0 && ` (${item.quantityVariance > 0 ? '+' : ''}${item.quantityVariance})`}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-700">{formatCurrency(item.poUnitPrice)}</td>
                    <td className={`px-4 py-3 text-right ${item.priceVariance !== 0 ? 'text-orange-600 font-bold' : 'text-green-700'}`}>
                      {formatCurrency(item.invoiceUnitPrice)}
                      {item.priceVariance !== 0 && ` (${item.priceVariance > 0 ? '+' : ''}${formatCurrency(item.priceVariance)})`}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-700">{formatCurrency(item.poAmount)}</td>
                    <td className="px-4 py-3 text-right text-green-700">{formatCurrency(item.invoiceAmount)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${item.amountVariance === 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.amountVariance === 0 ? '—' : `${item.amountVariance > 0 ? '+' : ''}${formatCurrency(item.amountVariance)}`}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded ${getStatusColor(item.matchStatus)}`}>
                        {item.matchStatus === 'exact' && 'Match'}
                        {item.matchStatus === 'within-tolerance' && 'OK'}
                        {item.matchStatus === 'variance' && 'Variance'}
                        {item.matchStatus === 'missing' && 'Missing'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-[--navy]">
              <tr>
                <td colSpan={6} className="px-4 py-3 font-semibold text-[--navy]">Totals</td>
                <td className="px-4 py-3 text-right font-bold text-blue-700">{formatCurrency(data.poTotal)}</td>
                <td className="px-4 py-3 text-right font-bold text-green-700">{formatCurrency(data.invoiceTotal)}</td>
                <td className={`px-4 py-3 text-right font-bold ${data.totalVariance === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.totalVariance === 0 ? '—' : `${data.totalVariance > 0 ? '+' : ''}${formatCurrency(data.totalVariance)}`}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center justify-end gap-4">
          {onReject && (
            <button
              onClick={onReject}
              className="px-6 py-3 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
            >
              Reject Bill
            </button>
          )}
          {onApprove && (
            <button
              onClick={onApprove}
              disabled={data.overallStatus === 'rejected'}
              className={`
                px-8 py-3 rounded-lg font-medium transition-colors
                ${
                  data.overallStatus === 'rejected'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }
              `}
            >
              Approve for Payment
            </button>
          )}
        </div>
      )}
    </div>
  );
}
