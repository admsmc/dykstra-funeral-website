/**
 * Case List Feature - Custom Hook
 */

import { trpc } from "@/lib/trpc-client";
import { CaseViewModel } from "../view-models/CaseViewModel";
import type { CaseListQueryParams } from "../types";

export function useCaseList(params: CaseListQueryParams) {
  const query = trpc.case.listAll.useInfiniteQuery(
    {
      limit: params.limit,
      status: params.status as any,
      type: params.type as any,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const allCases = query.data?.pages.flatMap((page) => page.items) ?? [];
  const cases = allCases.map((case_) => new CaseViewModel(case_));

  return {
    cases,
    total: query.data?.pages[0]?.total ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
