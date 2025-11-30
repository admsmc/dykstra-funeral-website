import { Effect } from 'effect';
import { goClient, unwrapResponse } from './client';
import type {
  GoEmployeeMasterDataPortService,
  GoEmployee,
  GoOrgChartNode,
  GoCompensationHistoryEntry,
  UpdateEmployeeInfoCommand,
} from '@dykstra/application';
import { NetworkError, NotFoundError } from '@dykstra/application';

/**
 * Employee Master Data Adapter
 * 
 * Implements GoEmployeeMasterDataPortService for employee
 * master data CRUD, org chart, and compensation history.
 * Split from GoHCMCommonAdapter for better separation of concerns.
 */

export const GoEmployeeMasterDataAdapter: GoEmployeeMasterDataPortService = {
  getEmployeeById: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/hcm/employees/{id}', {
          params: { path: { id } }
        });
        
        if (res.error) {
          if (res.response?.status === 404) {
            throw new NotFoundError({ message: 'Employee not found', entityType: 'Employee', entityId: id });
          }
          throw new Error(res.error.message);
        }
        
        return mapToGoEmployee(res.data);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new NetworkError('Failed to get employee by ID', error as Error);
      }
    }),
  
  updateEmployeeInfo: (id: string, command: UpdateEmployeeInfoCommand) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.PATCH('/v1/hcm/employees/{id}', {
          params: { path: { id } },
          body: {
            email: command.email,
            phone: command.phone,
            address: command.address,
            emergency_contact: command.emergencyContact,
            emergency_phone: command.emergencyPhone,
          }
        });
        unwrapResponse(res);
      },
      catch: (error) => new NetworkError('Failed to update employee info', error as Error)
    }),
  
  getOrgChart: (rootEmployeeId?: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/hcm/org-chart', {
          params: { query: { root_employee_id: rootEmployeeId } }
        });
        const data = unwrapResponse(res);
        return mapToGoOrgChartNode(data);
      },
      catch: (error) => new NetworkError('Failed to get org chart', error as Error)
    }),
  
  getCompensationHistory: (employeeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/hcm/employees/{id}/compensation-history', {
          params: { path: { id: employeeId } }
        });
        const data = unwrapResponse(res);
        return (data.history || []).map(mapToGoCompensationHistoryEntry);
      },
      catch: (error) => new NetworkError('Failed to get compensation history', error as Error)
    }),
};

function mapToGoEmployee(data: any): GoEmployee {
  return {
    id: data.id,
    employeeNumber: data.employee_number,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    hireDate: new Date(data.hire_date),
    terminationDate: data.termination_date ? new Date(data.termination_date) : undefined,
    status: data.status,
    positionId: data.position_id,
    positionTitle: data.position_title,
    department: data.department,
  };
}

function mapToGoOrgChartNode(data: any): GoOrgChartNode {
  return {
    employeeId: data.employee_id,
    employeeName: data.employee_name,
    positionTitle: data.position_title,
    managerId: data.manager_id,
    children: (data.children || []).map(mapToGoOrgChartNode),
  };
}

function mapToGoCompensationHistoryEntry(data: any): GoCompensationHistoryEntry {
  return {
    effectiveDate: new Date(data.effective_date),
    compensationType: data.compensation_type,
    amount: data.amount,
    reason: data.reason,
    approvedBy: data.approved_by,
  };
}
