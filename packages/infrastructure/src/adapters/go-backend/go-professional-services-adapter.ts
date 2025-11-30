import { Effect } from 'effect';
import { goClient, unwrapResponse } from './client';
import type {
  GoProfessionalServicesPortService,
  GoPSEngagement,
  GoPSTimesheet,
  GoPSTimesheetEntry,
} from '@dykstra/application';
import { NetworkError } from '@dykstra/application';

/**
 * Professional Services Adapter
 * 
 * Implements GoProfessionalServicesPortService for case-based
 * engagement tracking and timesheet management.
 */

export const GoProfessionalServicesAdapter: GoProfessionalServicesPortService = {
  createEngagement: (caseId: string, employeeId: string, role: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/professional-services/engagements', {
          body: {
            case_id: caseId,
            employee_id: employeeId,
            role,
          }
        });
        return mapToGoPSEngagement(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to create engagement', error as Error)
    }),
  
  submitTimesheet: (employeeId: string, entries: readonly GoPSTimesheetEntry[]) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/professional-services/timesheets', {
          body: {
            employee_id: employeeId,
            entries: entries.map(e => ({
              case_id: e.caseId,
              date: e.date.toISOString(),
              hours: e.hours,
              description: e.description,
            })),
          }
        });
        return mapToGoPSTimesheet(unwrapResponse(res));
      },
      catch: (error) => new NetworkError('Failed to submit timesheet', error as Error)
    }),
  
  approveTimesheet: (timesheetId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/professional-services/timesheets/{id}/approve', {
          params: { path: { id: timesheetId } }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to approve timesheet', error as Error)
    }),
  
  getCaseEngagements: (caseId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/professional-services/engagements', {
          params: { query: { case_id: caseId } }
        });
        const data = unwrapResponse(res);
        return (data.engagements || []).map(mapToGoPSEngagement);
      },
      catch: (error) => new NetworkError('Failed to get case engagements', error as Error)
    }),
};

function mapToGoPSEngagement(data: any): GoPSEngagement {
  return {
    id: data.id,
    caseId: data.case_id,
    employeeId: data.employee_id,
    role: data.role,
    startDate: new Date(data.start_date),
    endDate: data.end_date ? new Date(data.end_date) : undefined,
    status: data.status,
    billable: data.billable,
    hourlyRate: data.hourly_rate,
  };
}

function mapToGoPSTimesheet(data: any): GoPSTimesheet {
  return {
    id: data.id,
    employeeId: data.employee_id,
    weekEnding: new Date(data.week_ending),
    entries: (data.entries || []).map((e: any) => ({
      caseId: e.case_id,
      date: new Date(e.date),
      hours: e.hours,
      description: e.description,
    })),
    totalHours: data.total_hours,
    status: data.status,
  };
}
