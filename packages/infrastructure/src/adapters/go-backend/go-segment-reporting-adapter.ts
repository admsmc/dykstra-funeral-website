import { Effect } from 'effect';
import { goClient, unwrapResponse } from './client';
import type {
  GoSegmentReportingPortService,
  GoSegment,
} from '@dykstra/application';
import { NetworkError } from '@dykstra/application';

/**
 * Segment Reporting Adapter
 * 
 * Implements GoSegmentReportingPortService for segment-based
 * profitability reporting.
 */

export const GoSegmentReportingAdapter: GoSegmentReportingPortService = {
  listSegments: (segmentType?: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/segments', {
          params: { query: segmentType ? { type: segmentType } : {} }
        });
        const data = unwrapResponse(res);
        return (data.segments || []).map(mapToGoSegment);
      },
      catch: (error) => new NetworkError('Failed to list segments', error as Error)
    }),
  
  generateSegmentReport: (asOfDate: Date, segmentType: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/segments/reports', {
          params: {
            query: {
              as_of_date: asOfDate.toISOString(),
              segment_type: segmentType,
            }
          }
        });
        const data = unwrapResponse(res);
        return {
          asOfDate: new Date(data.as_of_date),
          segmentType: data.segment_type,
          segments: (data.segments || []).map((s: any) => ({
            segmentCode: s.segment_code,
            segmentName: s.segment_name,
            revenue: s.revenue,
            expenses: s.expenses,
            netIncome: s.net_income,
          })),
        };
      },
      catch: (error) => new NetworkError('Failed to generate segment report', error as Error)
    }),
};

function mapToGoSegment(data: any): GoSegment {
  return {
    id: data.id,
    segmentType: data.segment_type,
    code: data.code,
    name: data.name,
  };
}
