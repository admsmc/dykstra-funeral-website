/**
 * Employee Master Data Port
 * 
 * Handles employee master data CRUD, org chart, and compensation history.
 * Split from GoHCMCommonPort to follow Interface Segregation Principle.
 */

import { Effect, Context } from 'effect';
import { NotFoundError } from '@dykstra/domain';
import { NetworkError } from './go-contract-port';
import type { GoEmployee } from './go-employee-onboarding-port';

// Re-export for convenience
export { NotFoundError, NetworkError };
export type { GoEmployee };

export interface GoOrgChartNode {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly positionTitle: string;
  readonly managerId?: string;
  readonly children: readonly GoOrgChartNode[];
}

export interface GoCompensationHistoryEntry {
  readonly effectiveDate: Date;
  readonly compensationType: 'salary' | 'wage' | 'bonus' | 'commission';
  readonly amount: number;
  readonly reason?: string;
  readonly approvedBy?: string;
}

export interface UpdateEmployeeInfoCommand {
  readonly email?: string;
  readonly phone?: string;
  readonly address?: string;
  readonly emergencyContact?: string;
  readonly emergencyPhone?: string;
}

export interface GoEmployeeMasterDataPortService {
  readonly getEmployeeById: (id: string) => 
    Effect.Effect<GoEmployee, NotFoundError | NetworkError>;
  readonly updateEmployeeInfo: (id: string, command: UpdateEmployeeInfoCommand) => 
    Effect.Effect<void, NetworkError>;
  readonly getOrgChart: (rootEmployeeId?: string) => 
    Effect.Effect<GoOrgChartNode, NetworkError>;
  readonly getCompensationHistory: (employeeId: string) => 
    Effect.Effect<readonly GoCompensationHistoryEntry[], NetworkError>;
}

export const GoEmployeeMasterDataPort = Context.GenericTag<GoEmployeeMasterDataPortService>(
  '@dykstra/GoEmployeeMasterDataPort'
);
