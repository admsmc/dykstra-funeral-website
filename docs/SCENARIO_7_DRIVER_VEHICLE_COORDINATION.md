# Scenario 7: Driver/Vehicle Coordination

## Overview

Scenario 7 implements comprehensive driver assignment and vehicle fleet management for funeral home removal, transfer, and procession operations. The system coordinates 15-25 removals/week with conflict prevention, real-time availability tracking, and mileage-based payroll integration.

**Status**: Complete ✅ (26 use cases across 8 implementation phases, 338 tests passing)

## Business Requirements

### Driver Assignment Workflow
- **Minimum 1-hour rest period** between assignments (validated with 60-minute buffer)
- **Duration: 15-240 minutes** for each assignment
- **Conflict prevention**: No overlapping assignments for same driver
- **Event types**: Removal, Transfer, Procession
- **Status workflow**: Pending → Accepted → In Progress → Completed

### Vehicle Management
- **Inspection tracking**: Current inspection required for assignment
- **Maintenance scheduling**: 6-month maintenance cycle enforcement
- **Capacity requirements**: Match vehicle type to event type
- **Mileage tracking**: Record start/end odometer readings at completion
- **Payroll integration**: Automatic $0.67/mile reimbursement calculation (IRS rate)

## Architecture

### Domain Layer (287 LOC)
**DriverAssignment Entity** (`packages/domain/src/entities/driver-assignment.ts`)
- Type-safe branded types: AssignmentId, DriverId, FuneralHomeId, CaseId
- Business methods:
  - `isActive()`: Check if assignment is pending/in-progress
  - `calculateMileage()`: Compute distance traveled
  - `calculateMileageAllowance()`: IRS reimbursement
  - `getScheduledEndTime()`: End time calculation
  - `overlapsWithTimeWindow()`: 1-hour rest period validation

**Vehicle Entity** (`packages/domain/src/entities/vehicle.ts`)
- Vehicle specifications (make, model, year, capacity)
- Business methods:
  - `isAvailable()`: Status checks
  - `hasCurrentInspection()`: Inspection date validation
  - `isDueForMaintenance()`: 6-month cycle check
  - `isReadyForAssignment()`: Multi-criteria readiness
  - `isSuitableForEventType()`: Capacity matching
  - `getAge()`: Vehicle age calculation

### Ports & Interfaces (388 LOC)

**DriverAssignmentRepositoryService** (8 methods)
```typescript
save(assignment): Effect<void, RepositoryError>
findById(id): Effect<DriverAssignment, NotFoundError | RepositoryError>
findByDriverId(driverId): Effect<DriverAssignment[], RepositoryError>
findByVehicleId(vehicleId): Effect<DriverAssignment[], RepositoryError>
findByStatus(status): Effect<DriverAssignment[], RepositoryError>
findByFuneralHomeAndDateRange(funeralHomeId, startDate, endDate): Effect<DriverAssignment[], RepositoryError>
update(assignment): Effect<void, NotFoundError | RepositoryError>
delete(id): Effect<void, NotFoundError | RepositoryError>
findHistory(businessKey): Effect<DriverAssignment[], NotFoundError | RepositoryError>
```

**VehicleRepositoryService** (12 methods)
- All CRUD operations
- Specialized queries: `findAvailable()`, `findWithExpiredInspections()`, `findDueForMaintenance()`
- Mileage tracking: `addMileage(id, miles)`
- Temporal history: `findHistory(businessKey)`

**DriverDispatchServiceService** (5 methods)
- `notifyDriverAssignment()`: Send dispatch notification
- `sendReminder()`: Assignment reminder
- `sendCompletionConfirmation()`: Post-assignment confirmation
- `sendCancellationNotice()`: Cancellation notification
- `sendBatchReminders()`: Bulk reminder sending

### Application Layer (876 LOC, 7 Use Cases)

**assignDriver** (171 LOC)
- Validates driver availability
- Enforces 1-hour rest period
- Creates pending assignment
- Returns assignmentId and status

**assignVehicle** (117 LOC)
- Validates vehicle status (available)
- Checks current inspection
- Verifies not due for maintenance
- Validates capacity requirements

**recordMileage** (95 LOC)
- Records start/end odometer readings
- Validates mileage delta (0-500 miles)
- Calculates $0.67/mile reimbursement
- Updates vehicle total mileage

**checkDriverAvailability** (115 LOC)
- Detects scheduling conflicts
- Includes 1-hour buffer
- Returns next available time
- Suggests alternatives if conflicts exist

**checkVehicleAvailability** (125 LOC)
- Comprehensive readiness assessment
- Inspection status check
- Maintenance status check
- Capacity adequacy verification
- Returns detailed readiness message

**listDriverSchedule** (147 LOC)
- Date-range schedule queries
- Daily summary statistics
- Sorted by scheduled time
- Optional include totals

**dispatchDriver** (106 LOC)
- Updates assignment status
- Sends driver notification
- Fire-and-forget notification pattern
- Returns confirmation status

### Prisma Schema & Migration

**DriverAssignment Model**
- 15 fields with SCD2 temporal pattern
- Enums: EventType, AssignmentStatus
- 7 indexes for query optimization
- JSON fields for location data

**Vehicle Model**
- 18 fields with SCD2 temporal pattern
- Enums: VehicleStatus
- 7 indexes including inspection/maintenance dates
- Tracks mileage and acquisition date

**Migration**: `20251201051404_add_driver_assignment_and_vehicle_models_scenario_7`
- Creates PostgreSQL enums and tables
- Establishes relationships with FuneralHome
- Includes all indexes for performance

### Repository Implementation (867 LOC)

**DriverAssignmentRepositoryImpl**
- All 8 methods implemented with Effect-TS
- SCD2 temporal versioning on updates
- Soft delete via CANCELLED status
- Complete audit trail support

**VehicleRepositoryImpl**
- All 12 methods implemented
- Mileage accumulation tracking
- Maintenance/inspection queries
- Temporal history preservation

### API Router (276 LOC, 7 Endpoints)

**Endpoints** (tRPC procedures with role-based access)

1. **assignDriver** (POST) - Director-only
   - Creates new assignment
   - Returns assignmentId, status

2. **assignVehicle** (POST) - Director-only
   - Validates vehicle readiness
   - Confirms assignment eligibility

3. **recordMileage** (POST) - Staff-only
   - Records completion mileage
   - Returns reimbursement amount

4. **checkDriverAvailability** (GET) - Director-only
   - Queries conflict detection
   - Returns availability status

5. **checkVehicleAvailability** (GET) - Director-only
   - Checks readiness criteria
   - Returns detailed status

6. **listDriverSchedule** (GET) - Staff-only
   - Retrieves schedule view
   - Optional daily summaries

7. **dispatch** (POST) - Director-only
   - Sends driver notification
   - Updates assignment status

### Testing (610 LOC, 338 Tests Passing)

**Test Coverage**
- DriverAssignment creation and validation
- Mileage calculations and reimbursement
- Overlap detection with 1-hour buffer
- Status transitions and activity tracking
- Duration calculations
- Vehicle creation and properties
- Inspection validation (current/expired)
- Maintenance tracking (6-month cycle)
- Multi-criteria readiness assessment

**All 338 tests passing** ✅

## Data Models

### DriverAssignment (SCD2 Temporal)
```typescript
{
  id: AssignmentId;
  businessKey: string; // funeralHomeId:eventType_caseId:driverId
  version: number;
  validFrom: Date;
  validTo?: Date;
  isCurrent: boolean;
  
  funeralHomeId: FuneralHomeId;
  driverId: DriverId;
  vehicleId?: string;
  eventType: 'removal' | 'transfer' | 'procession';
  caseId: CaseId;
  pickupLocation: Location;
  dropoffLocation: Location;
  
  scheduledTime: Date;
  estimatedDuration: number; // minutes (15-240)
  actualDuration?: number;
  
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  
  mileageStart?: number;
  mileageEnd?: number;
  mileageAllowance?: number; // $0.67/mile
  
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

### Vehicle (SCD2 Temporal)
```typescript
{
  id: VehicleId;
  businessKey: string; // funeralHomeId:licensePlate
  version: number;
  validFrom: Date;
  validTo?: Date;
  isCurrent: boolean;
  
  funeralHomeId: FuneralHomeId;
  vehicleType: string; // hearse, limousine, van, sedan
  licensePlate: string; // unique constraint
  vin: string; // unique constraint
  year: number;
  make: string;
  model: string;
  color: string;
  capacity: number; // passengers including driver
  
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  mileageCurrentTotal: number;
  
  lastMaintenanceDate?: Date;
  nextMaintenanceDate: Date;
  lastInspectionDate?: Date;
  nextInspectionDate: Date;
  
  acquisitionDate: Date;
  retirementDate?: Date;
  
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

## API Examples

### Assign Driver
```bash
POST /trpc/driverVehicle.assignDriver
Authorization: Bearer {token}
Content-Type: application/json

{
  "driverId": "driver-456",
  "eventType": "removal",
  "caseId": "case-789",
  "funeralHomeId": "fh-123",
  "pickupLocation": {
    "address": "123 Oak St",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62701"
  },
  "dropoffLocation": {
    "address": "456 Pine Ave",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62702"
  },
  "scheduledTime": "2025-12-15T10:00:00Z",
  "estimatedDuration": 90,
  "notes": "Winter conditions - use hearse"
}

Response:
{
  "assignmentId": "assign-001",
  "driverId": "driver-456",
  "status": "pending",
  "notificationSent": false
}
```

### Check Driver Availability
```bash
GET /trpc/driverVehicle.checkDriverAvailability?driverId=driver-456&scheduledTime=2025-12-15T10:00:00Z&estimatedDuration=90

Response:
{
  "driverId": "driver-456",
  "isAvailable": true,
  "conflicts": [],
  "nextAvailableTime": null,
  "conflictMessage": null
}
```

### Record Mileage
```bash
POST /trpc/driverVehicle.recordMileage
Authorization: Bearer {token}

{
  "assignmentId": "assign-001",
  "vehicleId": "veh-001",
  "mileageStart": 12500,
  "mileageEnd": 12545
}

Response:
{
  "assignmentId": "assign-001",
  "mileageDelta": 45,
  "allowanceAmount": 30.15,  // 45 * 0.67
  "recorded": true
}
```

## Validation Rules

### Driver Assignment
- Duration: 15-240 minutes
- Rest period: 1-hour minimum between assignments
- Scheduled time: Must be in future
- No overlapping assignments for same driver

### Vehicle
- Status must be 'available' for assignment
- Inspection must be current (not expired)
- Not due for maintenance (6-month cycle)
- Capacity must meet event requirements

### Mileage
- End odometer ≥ Start odometer
- Delta: 0-500 miles maximum
- Only recorded for completed/in-progress assignments

## Performance Considerations

### Indexes
- `(businessKey, isCurrent)`: Fast current-version lookups
- `(validFrom, validTo)`: Temporal queries for SCD2 history
- `(funeralHomeId)`: Multi-tenant queries
- `(driverId)`, `(vehicleId)`, `(caseId)`: Foreign key lookups
- `(scheduledTime)`: Schedule queries
- `(status)`: Status filtering
- `(nextInspectionDate)`, `(nextMaintenanceDate)`: Expiration tracking

### Query Patterns
- Active assignments only: Filter by `isCurrent = true`
- History retrieval: Use `businessKey` with all versions
- Schedule queries: Use `(funeralHomeId, scheduledTime)` range

## Integration Points

### With Pre-Planning (Scenario 6)
- Uses Case data for assignment linking
- Coordinates funeral director availability

### With Financial (Scenario 4-6)
- Mileage allowance for payroll ($0.67/mile)
- Labor cost assignment via case linking

### With Go Backend
- 21 Go ERP modules support driver/vehicle operations
- Contract module for service agreements
- Payroll module for reimbursement processing
- Financial module for GL posting

## Future Enhancements

- Real-time GPS tracking for removals
- Automated maintenance scheduling
- Vehicle maintenance cost tracking
- Driver performance analytics
- Fuel cost tracking integration
- Multi-stop removal optimization

## References

- **Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md) for Clean Architecture patterns
- **Implementation Plan**: [Implementation Plan: Remaining 20 Critical Use Cases](./Implementation%20Plan_%20Remaining%2020%20Critical%20Use%20Cases.md)
- **Scheduling Scenarios**: [Funeral Home Scheduling Scenarios](./FUNERAL_HOME_SCHEDULING_SCENARIOS.md)
- **Go Backend Playbook**: [Go Backend Integration Playbook](./GO_BACKEND_INTEGRATION_PLAYBOOK.md)
