import { trpc } from "@/lib/trpc-client";
import { useState } from "react";
import type { ToastInstance } from "@/components/toast";

// Note: toast must be passed from component using this hook
// This pattern allows the hook to work with our custom toast system

type StatusFilter = 'all' | 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export function useFamilyInvitations(caseId: string, toast: ToastInstance) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const query = trpc.invitation.list.useQuery({
    caseId,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const createMutation = trpc.invitation.create.useMutation({
    onSuccess: () => {
      toast.success('Invitation sent successfully');
      query.refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send invitation');
    },
  });

  const resendMutation = trpc.invitation.resend.useMutation({
    onSuccess: () => {
      toast.success('Invitation resent successfully');
      query.refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to resend invitation');
    },
  });

  const revokeMutation = trpc.invitation.revoke.useMutation({
    onSuccess: () => {
      toast.success('Invitation revoked');
      query.refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to revoke invitation');
    },
  });

  return {
    invitations: query.data,
    isLoading: query.isLoading,
    statusFilter,
    setStatusFilter,
    createInvitation: createMutation.mutate,
    resendInvitation: resendMutation.mutate,
    revokeInvitation: revokeMutation.mutate,
    isCreating: createMutation.isLoading,
    isResending: resendMutation.isLoading,
    isRevoking: revokeMutation.isLoading,
  };
}
