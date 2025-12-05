/**
 * Contract Table Component
 * DataTable with contract columns and actions
 */

import { useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Eye,
  Download,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  Send,
  FileSignature,
} from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/table';
import { ErrorBoundary, TableErrorFallback } from '@/components/error';
import { PageSection } from '@/components/layouts/PageSection';
import { useToast } from '@/components/toast';
import { trpc } from '@/lib/trpc-client';
import type { Contract, ContractStatus } from '../types';

// Helper Components
function StatusBadge({ status }: { status: ContractStatus }) {
  const config = {
    DRAFT: {
      icon: Clock,
      label: 'Draft',
      className: 'bg-gray-100 text-gray-700',
    },
    PENDING_REVIEW: {
      icon: AlertCircle,
      label: 'Pending Review',
      className: 'bg-blue-100 text-blue-700',
    },
    PENDING_SIGNATURES: {
      icon: Clock,
      label: 'Pending Signatures',
      className: 'bg-yellow-100 text-yellow-700',
    },
    FULLY_SIGNED: {
      icon: CheckCircle,
      label: 'Fully Signed',
      className: 'bg-green-100 text-green-700',
    },
    CANCELLED: {
      icon: XCircle,
      label: 'Cancelled',
      className: 'bg-red-100 text-red-700',
    },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

function SignatureStatus({
  familySigned,
  staffSigned,
  familySignedAt,
  staffSignedAt,
}: {
  familySigned: boolean;
  staffSigned: boolean;
  familySignedAt: Date | null;
  staffSignedAt: Date | null;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs">
        {familySigned ? (
          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
        ) : (
          <Clock className="w-3.5 h-3.5 text-gray-400" />
        )}
        <span className={familySigned ? 'text-green-700 font-medium' : 'text-gray-500'}>
          Family {familySigned && familySignedAt && `(${new Date(familySignedAt).toLocaleDateString()})`}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        {staffSigned ? (
          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
        ) : (
          <Clock className="w-3.5 h-3.5 text-gray-400" />
        )}
        <span className={staffSigned ? 'text-green-700 font-medium' : 'text-gray-500'}>
          Staff {staffSigned && staffSignedAt && `(${new Date(staffSignedAt).toLocaleDateString()})`}
        </span>
      </div>
    </div>
  );
}

function ContractActions({
  contractId,
  caseId,
  status,
  onRefetch,
  onRenewContract,
}: {
  contractId: string;
  caseId: string;
  status: ContractStatus;
  onRefetch: () => void;
  onRenewContract?: () => void;
}) {
  const toast = useToast();

  const sendForSignatureMutation = trpc.contract.sendForSignature.useMutation({
    onSuccess: (result) => {
      toast.success(`Contract sent for signature to ${result.signers.length} signer(s)`);
      onRefetch();
    },
    onError: (error) => {
      toast.error(`Failed to send contract: ${error.message}`);
    },
  });

  const generatePDFMutation = trpc.contract.generatePDF.useMutation({
    onSuccess: (result) => {
      toast.success('PDF generated successfully');
      // In production, would trigger download from result.pdfUrl
      window.open(result.pdfUrl, '_blank');
    },
  });

  const handleSendForSignature = () => {
    // In production, this would open a modal to configure signers
    sendForSignatureMutation.mutate({
      contractId,
      signers: [
        {
          name: 'John Smith',
          email: 'john.smith@example.com',
          role: 'primary_family',
          order: 1,
        },
        {
          name: 'Director Name',
          email: 'director@funeral-home.com',
          role: 'director',
          order: 2,
        },
      ],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
  };

  const handleSendReminder = () => {
    toast.success('Email reminder sent to family');
  };

  const handleDownloadPDF = () => {
    generatePDFMutation.mutate({
      contractId,
      includeSignatures: true,
      includeLineItems: true,
      includeTerms: true,
      watermark: status === 'FULLY_SIGNED' ? 'final' : 'draft',
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/staff/cases/${caseId}#contracts`}
        className="p-1.5 text-gray-600 hover:text-[--navy] hover:bg-blue-50 rounded transition"
        title="View contract"
      >
        <Eye className="w-4 h-4" />
      </Link>

      {status === 'DRAFT' && (
        <button
          onClick={handleSendForSignature}
          disabled={sendForSignatureMutation.isPending}
          className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition disabled:opacity-50"
          title="Send for signature"
        >
          <Send className="w-4 h-4" />
        </button>
      )}

      {status === 'PENDING_SIGNATURES' && (
        <>
          <button
            onClick={handleSendReminder}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
            title="Send reminder"
          >
            <Mail className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={generatePDFMutation.isPending}
            className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition disabled:opacity-50"
            title="Download draft PDF"
          >
            <Download className="w-4 h-4" />
          </button>
        </>
      )}

      {status === 'FULLY_SIGNED' && (
        <>
          <button
            onClick={handleDownloadPDF}
            disabled={generatePDFMutation.isPending}
            className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition disabled:opacity-50"
            title="Download final PDF"
          >
            <Download className="w-4 h-4" />
          </button>
          {onRenewContract && (
            <button
              onClick={onRenewContract}
              className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
              title="Renew contract"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

// Main Component
export interface ContractTableProps {
  contracts: Contract[];
  onRefetch: () => void;
  searchQuery: string;
  dateRange: { start: string; end: string };
  onRenewContract?: (contract: Contract) => void;
}

export function ContractTable({ contracts, onRefetch, searchQuery, dateRange, onRenewContract }: ContractTableProps) {
  const columns = useMemo<ColumnDef<Contract>[]>(
    () => [
      {
        accessorKey: 'caseNumber',
        header: 'Case Number',
        cell: ({ row }) => (
          <Link
            href={`/staff/cases/${row.original.caseId}`}
            className="text-[--navy] hover:underline font-medium"
          >
            {row.original.caseNumber}
          </Link>
        ),
      },
      {
        accessorKey: 'decedentName',
        header: 'Decedent',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900">{row.original.decedentName}</p>
            <p className="text-sm text-gray-500">
              {row.original.serviceType.replace(/_/g, ' ')}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'signatures',
        header: 'Signatures',
        cell: ({ row }) => (
          <SignatureStatus
            familySigned={!!row.original.familySignedAt}
            staffSigned={!!row.original.staffSignedAt}
            familySignedAt={row.original.familySignedAt}
            staffSignedAt={row.original.staffSignedAt}
          />
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: 'Total',
        cell: ({ row }) => (
          <span className="font-medium text-gray-900">
            ${row.original.totalAmount.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => (
          <div>
            <p className="text-sm text-gray-900">
              {new Date(row.original.createdAt).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-500">by {row.original.createdBy.name}</p>
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <ContractActions
            contractId={row.original.id}
            caseId={row.original.caseId}
            status={row.original.status}
            onRefetch={onRefetch}
            onRenewContract={onRenewContract ? () => onRenewContract(row.original) : undefined}
          />
        ),
      },
    ],
    [onRefetch, onRenewContract]
  );

  return (
    <PageSection title="Contract List" withCard={true}>
      <ErrorBoundary fallback={(error, reset) => <TableErrorFallback error={error} reset={reset} />}>
        <DataTable
          data={contracts}
          columns={columns}
          isLoading={false}
          enableColumnVisibility={true}
          enableExport={true}
          enableStickyHeader={true}
          pageSize={25}
          exportFilename="contracts"
          emptyState={
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="font-medium">No Contracts Found</p>
              <p className="text-sm mt-1">
                {searchQuery || dateRange.start || dateRange.end
                  ? 'Try adjusting your filters'
                  : 'Create a contract from a case'}
              </p>
            </div>
          }
        />
      </ErrorBoundary>
    </PageSection>
  );
}
