import { trpc } from "@/lib/trpc-client";
import { CaseDetailViewModel } from "../view-models/CaseDetailViewModel";

export function useCaseDetail(caseId: string) {
  const query = trpc.case.getDetails.useQuery({ caseId });

  return {
    viewModel: query.data ? new CaseDetailViewModel(query.data) : null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
