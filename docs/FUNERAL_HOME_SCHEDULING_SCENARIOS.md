# Funeral Home Scheduling & Rostering Scenarios

**Purpose**: Define the most critical scheduling and staff roster management scenarios for funeral home operations.

**Date**: December 1, 2024  
**Status**: In Progress (5/12 scenarios complete - 41.7%)

---

## Overview

Funeral homes operate 24/7/365 with complex staffing requirements. Staff must be available for death calls, service preparation, ceremonies, and family consultations. This document defines the key scenarios our scheduling system must support.

---

## Critical Scenarios (Priority 1)

### Scenario 1: 24/7 On-Call Director Rotation ✅ COMPLETE

**Status**: ✅ **IMPLEMENTED** (December 1, 2024)

**Implementation Details**:
- Use case: `packages/application/src/use-cases/scheduling/assign-oncall-director.ts` (348 lines)
- Tests: `packages/application/src/use-cases/scheduling/__tests__/assign-oncall-director.test.ts` (585 lines, 20 tests passing)
- Functions:
  - `assignOnCallDirector()` - Main assignment logic with 6 validation rules
  - `getUpcomingOnCallAssignments()` - Query upcoming assignments
  - `hasAdequateRestPeriod()` - Validates 8-hour rest requirement
  - `countConsecutiveWeekends()` - Enforces max 2 consecutive weekends
- Integration: Go Scheduling Port (25 methods, 22 API endpoints)

**Business Need**: Ensure a licensed funeral director is always available for after-hours death calls.

**Users**: Funeral Directors, Office Manager

**Workflow**:
1. Office manager creates on-call rotation schedule
2. System assigns directors to on-call shifts (typically Friday 5pm → Monday 8am)
3. Director receives notification of on-call assignment
4. When death call received, director activates on-call duty
5. System tracks callback hours for compensation
6. System calculates on-call pay differential (flat rate + callback hours)

**Business Rules**:
- Minimum 48-hour advance notice for on-call assignments
- No director assigned >2 consecutive weekends
- Fair rotation across all licensed directors
- Minimum 8 hours off between on-call shifts
- On-call activation automatically links to case ID

**Staffing Requirements**:
- 1 licensed funeral director on-call at all times
- Backup director identified for emergencies

**Expected Frequency**: 
- Scheduled: Weekly (3-4 directors rotating)
- Activations: 2-5 per weekend

**Success Metrics**:
- 100% on-call coverage (zero gaps)
- <30 minute response time to death calls
- Fair distribution of on-call duties

---

### Scenario 2: Service Coverage Staffing ✅ COMPLETE

**Status**: ✅ **IMPLEMENTED** (December 1, 2024)

**Implementation Details**:
- Use case: `packages/application/src/use-cases/scheduling/assign-service-coverage.ts` (512 lines)
- Tests: `packages/application/src/use-cases/scheduling/__tests__/assign-service-coverage.test.ts` (787 lines, 18 tests passing)
- Functions:
  - `assignServiceCoverage()` - Main assignment logic with service type-based staffing requirements
  - `checkServiceCoverageAdequacy()` - Validates adequacy 24 hours before service
  - `getStaffingRequirements()` - Returns staffing by service type
  - `hasSchedulingConflict()` - Detects overlapping assignments
  - `hasAdequateRestPeriod()` - Validates 8-hour rest requirement
- Integration: Go Scheduling Port (assignShift, getStaffSchedule, listShiftAssignments methods)
- Service types: Traditional Funeral (4 staff), Memorial Service (2 staff), Graveside (3 staff), Visitation (1 staff)

**Business Need**: Ensure adequate staffing for scheduled funeral and memorial services.

**Users**: Funeral Directors, Service Staff, Office Manager

**Workflow**:
1. Service scheduled with date/time in case management
2. System calculates staffing requirements based on service type:
   - Traditional funeral: 1 director + 2 staff
   - Memorial service: 1 director + 1 staff
   - Graveside: 1 director + 1 staff + 1 driver
3. System checks staff availability
4. Office manager assigns staff to service shifts
5. Staff receive shift notifications
6. System validates coverage 24 hours before service
7. Alerts sent if understaffed

**Business Rules**:
- Licensed director required for all services
- Minimum staffing levels by service type
- No staff assigned to overlapping services
- 8-hour minimum rest between shifts
- Priority given to staff with relationship to family

**Staffing Requirements**:
- Traditional Funeral: 1 director + 2 staff + 1 driver
- Memorial Service: 1 director + 1 staff
- Graveside: 1 director + 1 staff + 1 driver
- Visitation: 1 staff (rotating 4-hour shifts)

**Expected Frequency**: 15-25 services per week

**Success Metrics**:
- 100% of services adequately staffed
- <5% last-minute staffing changes
- Zero service delays due to understaffing

---

### Scenario 3: Embalmer Shift Assignment ✅ COMPLETE

**Status**: ✅ **IMPLEMENTED** (December 1, 2024)

**Implementation Details**:
- Use case: `packages/application/src/use-cases/scheduling/assign-embalmer-shift.ts` (411 lines)
- Tests: `packages/application/src/use-cases/scheduling/__tests__/assign-embalmer-shift.test.ts` (812 lines, 19 tests passing)
- Functions:
  - `assignEmbalmerShift()` - Main assignment logic with 8 validation rules
  - `getEmbalmerWorkload()` - Returns current workload for embalmer on shift date
  - `checkMultipleEmbalmerCapacity()` - Checks capacity across multiple embalmers (office manager helper)
  - `checkPreparationCapacity()` - Validates max 3 preps per shift and time capacity
- Integration: Go Scheduling Port (assignShift, listShiftAssignments methods)
- Case linkage via notes: `Preparation - Case {caseId} - Decedent: {name} - EstHours: {hours}`

**Business Need**: Schedule licensed embalmers for preparation room work.

**Users**: Embalmers, Funeral Directors, Office Manager

**Workflow**:
1. Case assigned to embalmer based on availability and workload
2. Embalmer shift scheduled (typically 8am-4pm)
3. Preparation time estimated (2-4 hours per case)
4. Embalmer clocks in/out via system
5. Preparation completion recorded
6. Case linked to embalmer's timesheet

**Business Rules**:
- Licensed embalmer required
- Maximum 3 preparations per shift
- 30-minute break between preparations
- All preparation work must be during regular shifts (no after-hours)
- Prep time tracked for labor costing

**Staffing Requirements**:
- 1-2 embalmers per shift depending on volume
- Backup embalmer on-call for urgent cases

**Expected Frequency**: 
- 10-15 preparations per week
- 2-3 shifts per day

**Success Metrics**:
- 100% of cases prepared within 24-48 hours
- Balanced workload across embalmers
- Accurate labor cost tracking per case

---

### Scenario 4: Shift Swap with Manager Approval ✅ COMPLETE

**Status**: ✅ **IMPLEMENTED** (December 1, 2024)

**Implementation Details**:
- Use case: `packages/application/src/use-cases/scheduling/request-shift-swap.ts` (410 lines)
- Tests: `packages/application/src/use-cases/scheduling/__tests__/request-shift-swap.test.ts` (705 lines, 15 tests passing)
- Functions:
  - `requestShiftSwap()` - Main request logic with 6 business rule validations
  - `reviewShiftSwap()` - Manager approval/rejection with role validation
  - `validateShiftSwapRequest()` - 48-hour notice, license level matching
  - `checkPendingSwapLimit()` - Max 2 pending swaps enforcement
  - `validateNoOvertimeViolation()` - Weekly hour limits (60h)
  - `validateRestPeriod()` - 8-hour rest period between shifts
- Integration: Go Scheduling Port (requestShiftSwap, reviewShiftSwap, listShiftSwaps, getShiftSwap methods)
- License hierarchy: director (4) > embalmer (3) > staff (2) > driver (1)

**Business Need**: Allow staff to trade shifts with manager oversight.

**Users**: All Staff, Managers

**Workflow**:
1. Staff member requests shift swap (identifies replacement)
2. Replacement staff accepts swap request
3. System validates:
   - No licensing conflicts (e.g., director-only shift)
   - No overtime violations
   - Adequate rest periods
4. Swap request routes to manager
5. Manager reviews and approves/rejects
6. If approved: shifts updated, both staff notified
7. If rejected: reason provided, original assignments remain

**Business Rules**:
- Swap requests must be submitted 48 hours in advance
- Replacement must have same license level or higher
- Maximum 2 pending swap requests per person
- Manager approval required for all swaps
- Swaps cannot create overtime violations

**Staffing Requirements**: N/A (existing staff only)

**Expected Frequency**: 2-5 swap requests per month

**Success Metrics**:
- 80% of swap requests approved
- <24 hour turnaround on swap approvals
- Zero licensing violations from swaps

---

### Scenario 5: Rotating Weekend Shift Pattern ✅ COMPLETE

**Status**: ✅ **IMPLEMENTED** (December 1, 2024)

**Implementation Details**:
- Use case: `packages/application/src/use-cases/scheduling/create-rotating-weekend-shift.ts` (442 lines)
- Tests: `packages/application/src/use-cases/scheduling/__tests__/create-rotating-weekend-shift.test.ts` (1,031 lines, 31 tests passing)
- Functions:
  - `createRotatingWeekendShift()` - Main creation with 9 steps, 6 validations, 3 fair distribution rules
  - `getRotatingWeekendShift()` - Retrieve existing schedule
  - `getWeekendPattern()` - Pattern resolution (on-off-on-off, on-on-off-off, on-off-off-on, custom)
  - `validateRotatingWeekendShift()` - Input validation (name, employees, dates, times)
  - `validateFairDistribution()` - Fair distribution constraints (min weekend off, max consecutive, max weekends)
  - `calculateFairDistributionScore()` - Fairness metric 0-100 scale
  - `createWeekendShiftTemplates()` - Saturday/Sunday templates with 15% differential
- Integration: Go Scheduling Port (createShiftTemplate, createRotatingSchedule, getRotatingSchedule)
- 4 pattern types fully supported with fairness scoring

**Business Need**: Fairly distribute weekend work across all staff.

**Users**: All Staff, Office Manager

**Workflow**:
1. Office manager creates 4-week rotating schedule
2. Pattern example: Week 1 on, Week 2 off, Week 3 on, Week 4 off
3. System auto-assigns based on rotation pattern
4. Staff view their weekend schedule 4 weeks in advance
5. System sends reminders 7 days before weekend shift
6. Pattern repeats indefinitely until changed

**Business Rules**:
- All staff rotate weekends (no exemptions except medical)
- Maximum 2 consecutive weekends on
- Minimum 1 weekend off per month
- Holiday weekends count as premium shifts
- PTO requests can override rotation (if approved early)

**Staffing Requirements**:
- Weekend shifts: 1 director + 2 staff + 1 on-call

**Expected Frequency**: Continuous (every weekend)

**Success Metrics**:
- Fair distribution (each staff works ~50% of weekends)
- 90%+ staff satisfaction with rotation fairness
- <10% swap requests related to weekend rotation

---

## High Priority Scenarios (Priority 2)

### Scenario 6: Pre-Planning Appointment Scheduling

**Business Need**: Schedule pre-need consultation appointments with available directors.

**Users**: Funeral Directors, Families, Office Staff

**Workflow**:
1. Family requests pre-planning consultation (phone/web)
2. System shows director availability (1-hour blocks)
3. Office staff books appointment
4. Director receives calendar notification
5. Day before: automated reminder to family and director
6. Director completes appointment, marks as complete
7. System tracks appointment time for director workload

**Business Rules**:
- Only licensed directors can conduct pre-planning
- Appointments during business hours only (8am-5pm)
- 1-hour minimum per appointment
- Maximum 4 appointments per director per day
- No double-booking

**Staffing Requirements**: 1 licensed director per appointment

**Expected Frequency**: 3-8 appointments per week

**Success Metrics**:
- 95%+ appointment attendance rate
- <5% scheduling conflicts
- Even distribution across directors

---

### Scenario 7: Driver/Vehicle Coordination

**Business Need**: Schedule drivers and vehicles for removals, transfers, and processions.

**Users**: Drivers, Funeral Directors, Office Manager

**Workflow**:
1. Removal needed (death call)
2. System checks driver availability
3. Office assigns driver and vehicle
4. Driver receives notification with address and details
5. Driver completes removal, records mileage
6. Vehicle status updated (in use → available)
7. Driver time tracked for payroll

**Business Rules**:
- Drivers must have valid license and training
- Vehicle availability checked
- Maximum 2 hours per removal
- Minimum 1-hour gap between assignments
- Procession duty always assigned to most experienced driver

**Staffing Requirements**:
- 1 driver per removal/transfer
- 2 drivers for processional lead vehicle

**Expected Frequency**: 
- Removals: 15-25 per week
- Transfers: 10-15 per week
- Processions: 10-15 per week

**Success Metrics**:
- <30 minute dispatch time for removals
- Zero vehicle conflicts
- Accurate mileage tracking

---

### Scenario 8: Holiday Shift Premium Scheduling

**Business Need**: Ensure coverage on holidays with premium pay.

**Users**: All Staff, Office Manager

**Workflow**:
1. Office manager identifies holidays requiring coverage (Thanksgiving, Christmas, New Year's, etc.)
2. System calculates premium pay rate (1.5x or 2x)
3. Volunteer signup period (30 days before holiday)
4. If insufficient volunteers: mandatory rotation based on seniority
5. Shifts assigned with premium pay flag
6. Staff receive confirmation with premium rate noted
7. Timesheet automatically includes holiday differential

**Business Rules**:
- Major holidays: 2x pay (Christmas, Thanksgiving)
- Minor holidays: 1.5x pay (Memorial Day, Labor Day, etc.)
- Minimum 2 staff + 1 director on all holidays
- Priority to volunteers over mandated assignments
- Holiday hours do not count toward overtime calculation

**Staffing Requirements**:
- Holiday shift: 1 director + 2 staff + 1 on-call

**Expected Frequency**: 10-12 holidays per year

**Success Metrics**:
- 100% holiday coverage
- 60%+ volunteer rate (vs. mandatory)
- Fair distribution over 3-year period

---

### Scenario 9: Preparation Room Scheduling Conflicts

**Status**: 📋 **PLANNING** (December 1, 2024)

**Implementation Plan**: [View Full Plan](docs/SCENARIO_9_PREP_ROOM_SCHEDULING.md)

**Estimated Effort**: 18-22 hours (7 phases)

**Business Need**: Prevent double-booking of preparation room facilities and manage embalmer workflow through preparation facilities.

**Users**: Embalmers, Office Manager, Funeral Directors

**Workflow**:
1. Embalmer requests preparation time for case
2. System checks prep room capacity and conflicts
3. If available: reserves time slot (2-4 hours) with buffer
4. If conflict: suggests next available slots (prioritizes urgent cases)
5. Embalmer confirms reservation or chooses alternative
6. System blocks time for other users
7. Embalmer checks in when arriving at prep room
8. System tracks actual duration
9. Embalmer checks out on completion
10. Time slot released and room cleaned
11. Auto-release triggered if no check-in within 30 minutes

**Business Rules**:
- **Capacity**: Maximum 2 cases per prep room simultaneously (1-2 rooms typical)
- **Cleaning Buffer**: 30-minute mandatory cleaning between cases
- **Duration**: 2-hour minimum, 8-hour maximum per reservation
- **Priority Override**: Urgent cases (24-hr service) can override non-urgent bookings
- **Same-Family Constraint**: Cases from same family cannot prep simultaneously
- **Auto-Release**: Confirmed reservations auto-released if no check-in after 30 minutes
- **Check-In/Out**: Embalmer must check in/out to track actual duration
- **Cancellation**: Case cancellations release slots within 2 hours

**Staffing Requirements**: 1-2 embalmers depending on facility and case volume

**Expected Frequency**: 10-15 preparations per week

**Success Metrics**:
- Zero double-bookings
- 90%+ on-time prep completion
- <10% schedule adjustments
- Buffers enforced in 100% of cases

**Key Features**:
1. **Facility Management**: Define number of prep rooms per funeral home
2. **Conflict Detection**: Real-time capacity and overlap checking
3. **Priority Scheduling**: Urgent cases (24-hr service) prioritized
4. **Check-In/Out System**: Track actual duration vs. estimated
5. **Auto-Release**: Automatic slot release on timeout
6. **Availability Views**: Daily calendar and embalmer workload dashboard
7. **Override Capability**: Manager override for urgent cases with justification

**Port Integration**:
- **New**: PrepRoomRepository (prep room and reservation management)
- **Existing**: GoSchedulingPort methods (assignShift, getStaffSchedule, completeShift)
- **Existing**: Case Management system (case priority, service date linking)

**Implementation Phases**:
1. Domain entities (4-5 hours)
2. Ports & interfaces (2-3 hours)
3. Use cases (6-7 hours): reserveRoom, checkAvailability, checkIn, checkOut, autoRelease, listSchedule, overrideConflict
4. Prisma schema & migrations (2 hours)
5. Repositories (3-4 hours)
6. Comprehensive tests (4-5 hours): 28 tests covering basic paths, conflicts, buffers, auto-release, availability
7. tRPC API router (1-2 hours)
8. DI wiring & documentation (1 hour)

**Dependencies**:
- GoSchedulingPort (existing - 25 methods)
- Case Management (existing - case priority, service dates)
- Staff availability data (existing)
- Prisma ORM (existing)
- Notifications (optional enhancement)

**Risks & Mitigations**:
- **Race Conditions**: DB constraints + optimistic locking + indexes
- **Performance**: Pre-compute conflicts, cache availability, query optimization
- **Priority Logic**: Start with urgent override only, expand later

**Next Steps**:
1. ✅ Approve plan
2. ⏳ Review domain model with embalmers
3. ⏳ Validate Prisma schema
4. ⏳ Create implementation issues
5. ⏳ Begin Phase 1 (Domain entities)
6. ⏳ Add comprehensive tests
7. ⏳ Wire to infrastructure layer
8. ⏳ Document and release

---

### Scenario 10: Staff Training & PTO Coverage

**Business Need**: Ensure coverage when staff are on PTO or training.

**Users**: All Staff, Office Manager

**Workflow**:
1. Staff member requests PTO (advance notice required)
2. System identifies shifts needing coverage
3. System suggests available staff for backfill
4. Office manager assigns coverage
5. Covering staff receive notification with premium pay (if overtime)
6. Original staff member's PTO recorded
7. Coverage verified 48 hours before absence

**Business Rules**:
- PTO requests require 2-week advance notice (4 weeks for holidays)
- Maximum 20% of staff on PTO simultaneously
- Critical roles (directors) require qualified replacement
- Overtime approved only if no regular-hour coverage available
- Training days count as regular work (no PTO deduction)

**Staffing Requirements**: Varies based on role being covered

**Expected Frequency**: 
- PTO: 15-25 days per employee per year
- Training: 2-5 days per employee per year

**Success Metrics**:
- 100% coverage for PTO absences
- <5% last-minute PTO denials
- Zero service disruptions

---

## Medium Priority Scenarios (Priority 3)

### Scenario 11: Mass Casualty Event Staffing Surge

**Business Need**: Quickly mobilize all available staff for mass casualty or disaster response.

**Users**: All Staff, Management, External Partners

**Workflow**:
1. Mass casualty event declared (e.g., plane crash, fire)
2. Office manager activates emergency staffing protocol
3. System sends alerts to all available staff
4. Staff confirm availability via app
5. System creates emergency shift assignments
6. All normal schedules suspended
7. Overtime pre-approved for duration
8. Staff clock in/out as needed
9. System tracks all emergency hours for FEMA reimbursement

**Business Rules**:
- All non-critical shifts cancelled
- Unlimited overtime authorized
- Emergency pay rate applies (2x)
- All licensed directors required to respond
- Partnership with neighboring funeral homes activated

**Staffing Requirements**: All available staff

**Expected Frequency**: Rare (0-2 per decade)

**Success Metrics**:
- <2 hour full staff mobilization
- 100% capacity utilization
- Accurate FEMA reimbursement documentation

---

### Scenario 12: Part-Time vs. Full-Time Staff Balancing

**Business Need**: Balance part-time and full-time staff to optimize costs while maintaining coverage.

**Users**: Office Manager, HR

**Workflow**:
1. System tracks hours per employee per pay period
2. Alerts when part-time employee approaches full-time threshold (30 hours/week for 12+ weeks)
3. Office manager reviews part-time schedules weekly
4. System suggests shift adjustments to keep part-time under threshold
5. If full-time conversion needed: HR approval workflow

**Business Rules**:
- Part-time: <30 hours per week
- Full-time: 35-40 hours per week
- ACA compliance: track rolling 12-month average
- Benefits eligibility triggers at 30+ hours for 12 weeks
- Premium pay for part-time overtime (>40 hours)

**Staffing Requirements**: Varies (mix of full-time and part-time)

**Expected Frequency**: Continuous monitoring

**Success Metrics**:
- Zero unintended ACA violations
- Optimal labor cost per case
- 80%+ schedule utilization

---

## Technical Requirements Summary

### Port Methods Required (All Available in GoSchedulingPort)
- ✅ `createShiftTemplate` - Define shift patterns
- ✅ `assignShift` - Assign staff to shifts
- ✅ `assignOnCall` - Create on-call assignments
- ✅ `activateOnCall` - Record callback activations
- ✅ `requestShiftSwap` - Initiate swap workflow
- ✅ `reviewShiftSwap` - Approve/reject swaps
- ✅ `getStaffSchedule` - View employee schedule
- ✅ `getShiftCoverage` - Check staffing adequacy
- ✅ `createRotatingSchedule` - Define rotation patterns
- ✅ `setShiftCoverageRule` - Define minimum staffing
- ✅ `completeShift` - Mark shift complete
- ✅ `cancelShift` - Cancel assignments

### Integration Points
- **Case Management**: Link shifts to case IDs (services, preparations)
- **Payroll**: Time worked flows to payroll via GoTimesheetPort
- **Calendar Sync**: Sync to Outlook/Google Calendar via CalendarSyncPort
- **Notifications**: Email/SMS for shift assignments, reminders, swaps
- **Labor Costing**: Track hours per case for profitability analysis

### Data Flow
```
Shift Assignment → Time Clock → Timesheet → Payroll → GL Posting
              ↓
         Case Linking → Labor Cost Analysis → Profitability Report
```

---

## Implementation Priority Matrix

|| Priority | Scenario | Complexity | Business Impact | Status | Implementation Order |
||----------|----------|------------|-----------------|--------|---------------------|
|| P1 | 24/7 On-Call Rotation | Medium | Critical | ✅ Complete | 1 |
|| P1 | Service Coverage | High | Critical | ✅ Complete | 2 |
|| P1 | Embalmer Shifts | Low | High | ✅ Complete | 3 |
|| P1 | Shift Swaps | Medium | High | ✅ Complete | 4 |
|| P1 | Weekend Rotation | Medium | High | ✅ Complete | 5 |
| P2 | Pre-Planning Appts | Low | Medium | 6 |
| P2 | Driver Coordination | Medium | High | 7 |
| P2 | Holiday Premiums | Low | Medium | 8 |
| P2 | Prep Room Conflicts | Low | Medium | 9 |
| P2 | PTO Coverage | Medium | High | 10 |
| P3 | Mass Casualty | High | Low (Rare) | 11 |
| P3 | PT/FT Balancing | Medium | Medium | 12 |

---

## Success Criteria for Implementation

### Phase 1 (Scenarios 1-5) - 40% Complete
- ✅ **DONE**: 100% on-call coverage with zero gaps (Scenario 1)
  - 20 comprehensive tests passing
  - All 6 business rules implemented
  - Integration with Go Scheduling module complete
- ✅ **DONE**: All services adequately staffed (Scenario 2)
  - 18 comprehensive tests passing (4 service types, 9 validation rules, 2 conflict checks)
  - Service type-based staffing requirements (traditional=4, memorial=2, graveside=3, visitation=1)
  - Conflict detection and rest period validation
  - Integration with case management via shift notes
- 🔜 **TODO**: Embalmer workload balanced (Scenario 3)
- 🔜 **TODO**: Shift swap workflow functional (Scenario 4)
- 🔜 **TODO**: Fair weekend rotation (Scenario 5)

### Phase 2 (Scenarios 6-10)
- ✅ Pre-planning appointments streamlined
- ✅ Driver assignments conflict-free
- ✅ Holiday coverage with volunteers
- ✅ Prep room scheduling optimized
- ✅ PTO coverage automated

### Phase 3 (Scenarios 11-12)
- ✅ Emergency protocols documented
- ✅ Labor cost tracking accurate
- ✅ ACA compliance maintained

---

## Next Steps

### Completed
- ✅ **Scenario 1**: 24/7 On-Call Director Rotation (December 1, 2024)
  - Use case implementation: `assign-oncall-director.ts` (348 lines)
  - 20 tests passing (happy path, validations, rest periods, consecutive weekends)
  - Go Scheduling Port & Adapter integration complete

- ✅ **Scenario 2**: Service Coverage Staffing (December 1, 2024)
  - Use case implementation: `assign-service-coverage.ts` (512 lines)
  - 18 tests passing (4 service types, 9 validations, 2 conflict checks, 2 adequacy checks)
  - Service type-based staffing with role requirements
  - Conflict detection and rest period validation
  - Case management integration via shift notes

### Current Sprint
- ⏳ **Scenario 3**: Embalmer Shift Assignment
  - **Scope**: Preparation room scheduling, workload balancing, case linking
  - **Files to create**:
    - Use case: `packages/application/src/use-cases/scheduling/assign-embalmer-shift.ts`
    - Tests: `packages/application/src/use-cases/scheduling/__tests__/assign-embalmer-shift.test.ts`
  - **Go methods needed**: `assignShift`, `getStaffSchedule`, `listShiftAssignments`
  - **Integration**: Link to case management for preparation tracking

### Upcoming (Week 2-3)
- 🔜 **Scenario 3**: Embalmer Shift Assignment
- 🔜 **Scenario 4**: Shift Swap with Manager Approval
- 🔜 **Scenario 5**: Rotating Weekend Shift Pattern

### Infrastructure Work (Ongoing)
- Wire scheduling into infrastructure layer (Layer.succeed pattern)
- Create tRPC router for staff dashboard
- Add scheduling navigation to staff portal

**Documentation**: See `docs/GO_BACKEND_INTEGRATION_PLAYBOOK.md` for implementation process.
