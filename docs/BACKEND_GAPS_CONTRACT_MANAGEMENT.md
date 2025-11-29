# Backend Gaps: Contract Management System

**Date**: 2025-11-29  
**Status**: Requirements Document  
**Priority**: TIER 1 - CRITICAL

## Executive Summary

This document identifies **18 missing HTTP API endpoints** in the Go backend Contract Management system that are required to support the full funeral home case management vision described in CONTRACT_MANAGEMENT_ASSESSMENT.md.

### Current State
- ✅ **Implemented**: 7 basic CRUD endpoints (create, get, list, update, approve, sign, cancel)
- ❌ **Missing**: 18 advanced lifecycle endpoints (item management, pre-need, provisioning, etc.)

### Business Impact
Without these APIs, the system cannot support:
- Pre-need to at-need conversion workflow ($4.5k average contract value)
- Automated service provisioning (90% manual work reduction)
- Contract amendments (15% of cases require changes)
- Multi-level approval workflows (regulatory compliance)
- Service linking for warranty tracking

---

## Gap Analysis Summary

| Category | Missing Endpoints | Priority | Business Value |
|----------|------------------|----------|----------------|
| **Contract Item Management** | 4 | HIGH | Enable granular item updates (casket upgrades, service changes) |
| **Pre-Need Lifecycle** | 3 | CRITICAL | $4,500 average pre-need contract conversion |
| **Advanced Lifecycle** | 5 | HIGH | Contract renewals, amendments, extensions |
| **Provisioning Integration** | 3 | CRITICAL | Automate inventory/PS/AP coordination |
| **Service Linking** | 3 | MEDIUM | Warranty tracking, service-to-contract lookups |
| **Query & Reporting** | 6 | MEDIUM | Analytics, audit trails, profitability |

**Total Missing**: 24 endpoints across 6 categories

---

## Detailed Gap Specifications

### Category 1: Contract Item Management (HIGH PRIORITY)

#### Problem Statement
Current API only supports bulk contract updates (PATCH /v1/contracts/{id}). Funeral homes need to add/modify/remove individual items without replacing the entire contract.

**Use Case**: Johnson family upgrades casket from mahogany ($4,500) to oak ($6,200) after signing contract.

---

#### 1.1 Add Contract Item

**Endpoint**: `POST /v1/contracts/{id}/items`

**Description**: Add a single item to an existing contract (service or product).

**Request Body**:
```json
{
  "item_id": "string (optional, generated if omitted)",
  "service_type": "professional_services | physical_product | rental | subscription | lease | maintenance | support | procurement",
  "service_id": "string (optional, ID in downstream system)",
  "description": "string",
  "quantity": "uint64",
  "total_cents": "uint64",
  "start_date": "ISO8601 (optional)",
  "end_date": "ISO8601 (optional)",
  "gl_account_id": "string (optional)",
  "attributes": {
    "key": "value (arbitrary metadata)"
  }
}
```

**Response**: `201 Created`
```json
{
  "contract_id": "string",
  "item": {
    "id": "string",
    "service_type": "physical_product",
    "description": "Oak Casket - Premium",
    "quantity": 1,
    "total_cents": 620000,
    "status": "draft"
  },
  "contract_total_cents": 1210000,
  "version": 3
}
```

**Side Effects**:
- Emits `ContractItemAdded` event
- Recalculates contract total
- Increments contract version
- If contract is active and item has `service_type`, may trigger provisioning (based on auto_provision flag)

**Validation Rules**:
- Contract must be in `draft` or `active` status (reject if `completed`, `cancelled`)
- If contract is `active`, adding items may require re-approval (configurable)
- `service_type` must be valid enum value
- `total_cents` must be positive

---

#### 1.2 Update Contract Item

**Endpoint**: `PATCH /v1/contracts/{id}/items/{item_id}`

**Description**: Modify a specific contract item (quantity, price, description, or metadata).

**Request Body**: (all fields optional)
```json
{
  "description": "string",
  "quantity": "uint64",
  "total_cents": "uint64",
  "gl_account_id": "string",
  "attributes": {
    "key": "value"
  }
}
```

**Response**: `200 OK`
```json
{
  "contract_id": "string",
  "item": {
    "id": "string",
    "service_type": "physical_product",
    "description": "Oak Casket - Premium (updated)",
    "quantity": 1,
    "total_cents": 650000,
    "status": "draft"
  },
  "previous_total_cents": 620000,
  "contract_total_cents": 1240000,
  "version": 4
}
```

**Side Effects**:
- Emits `ContractItemUpdated` event with diff (old vs new values)
- Recalculates contract total
- If item was provisioned (has `service_id`), may trigger re-provisioning:
  - Physical products: release old inventory, reserve new SKU
  - Rentals: adjust reservation dates
  - Subscriptions: modify billing amount

**Validation Rules**:
- Contract must not be `completed` or `cancelled`
- Cannot change `service_type` (must remove and re-add)
- If item is already provisioned (`status = "provisioned"` or `"active"`), price changes may require approval

---

#### 1.3 Remove Contract Item

**Endpoint**: `DELETE /v1/contracts/{id}/items/{item_id}`

**Description**: Remove an item from the contract (soft delete with audit trail).

**Query Parameters**:
- `reason` (required): string - reason for removal (e.g., "Family declined service")

**Response**: `200 OK`
```json
{
  "contract_id": "string",
  "removed_item_id": "string",
  "contract_total_cents": 590000,
  "version": 5,
  "reversal_operations": [
    {
      "type": "inventory_release",
      "service_id": "INV-RESERVE-123",
      "status": "completed"
    }
  ]
}
```

**Side Effects**:
- Emits `ContractItemRemoved` event (item not deleted, marked `status = "cancelled"`)
- Recalculates contract total
- If item was provisioned, triggers de-provisioning:
  - Inventory: release reservation
  - PS engagement: cancel engagement
  - Subscriptions: cancel subscription

**Validation Rules**:
- Contract must not be `completed`
- Cannot remove items if contract is `locked` (post-finalization)
- `reason` must be non-empty

---

#### 1.4 Get Contract Items

**Endpoint**: `GET /v1/contracts/{id}/items`

**Description**: List all items for a contract with optional filtering.

**Query Parameters**:
- `status` (optional): `draft | provisioned | active | cancelled`
- `service_type` (optional): filter by service type

**Response**: `200 OK`
```json
{
  "contract_id": "string",
  "items": [
    {
      "id": "string",
      "service_type": "professional_services",
      "service_id": "PS-ENG-456",
      "description": "Funeral Director Services",
      "quantity": 1,
      "total_cents": 350000,
      "status": "active",
      "created_at": "ISO8601",
      "updated_at": "ISO8601"
    }
  ],
  "total_items": 5,
  "total_cents": 1040000
}
```

---

### Category 2: Pre-Need Lifecycle (CRITICAL PRIORITY)

#### Problem Statement
Funeral homes sell pre-need contracts years before death occurs. The system must support converting pre-need contracts (with guaranteed pricing + payment plans) into at-need cases when death occurs.

**Business Value**: 30% of funeral homes' annual revenue comes from pre-need contracts ($4,500 average).

---

#### 2.1 Create Pre-Need Contract

**Endpoint**: `POST /v1/contracts/preneed`

**Description**: Create a pre-need contract with guaranteed pricing and payment plan terms.

**Request Body**:
```json
{
  "customer_id": "string (MDM party ID)",
  "beneficiary": "string (deceased-to-be name)",
  "name": "string",
  "legal_entity": "string",
  "currency": "USD",
  "items": [
    {
      "service_type": "professional_services | physical_product | etc.",
      "description": "string",
      "quantity": "uint64",
      "total_cents": "uint64"
    }
  ],
  "payment_terms": {
    "type": "installment | lump_sum | trust_funded",
    "installment_count": "uint32 (if installment)",
    "installment_amount_cents": "uint64",
    "trust_account_id": "string (if trust_funded)"
  },
  "guaranteed_pricing": true,
  "attributes": {
    "contract_type": "preneed",
    "beneficiary_dob": "ISO8601",
    "next_of_kin": "string"
  }
}
```

**Response**: `201 Created`
```json
{
  "contract_id": "PRENEED-2025-042",
  "status": "draft",
  "total_cents": 450000,
  "payment_plan_id": "PAY-PLAN-789 (if installment)",
  "subscription_id": "SUB-123 (if recurring payments)"
}
```

**Side Effects**:
- Emits `PreNeedContractCreated` event
- If `payment_terms.type = "installment"`, creates subscription via Subscriptions module
- Links subscription to contract via ServiceLinkPort

**Validation Rules**:
- `payment_terms` must be valid for pre-need (no immediate payment)
- If `trust_funded = true`, must provide `trust_account_id`
- `guaranteed_pricing = true` freezes item prices

---

#### 2.2 Convert Pre-Need to At-Need

**Endpoint**: `POST /v1/contracts/{preneed_id}/convert-to-atneed`

**Description**: Convert a pre-need contract to an at-need case when death occurs.

**Request Body**:
```json
{
  "death_date": "ISO8601",
  "case_id": "string (CRM case ID)",
  "migrate_items": true,
  "release_trust_funds": true,
  "trust_amount_cents": "uint64 (amount to release)",
  "additional_items": [
    {
      "service_type": "rental",
      "description": "Chapel use (2 days)",
      "total_cents": 120000
    }
  ]
}
```

**Response**: `201 Created`
```json
{
  "atneed_contract_id": "CASE-2035-123",
  "preneed_contract_id": "PRENEED-2025-042",
  "migrated_items_count": 5,
  "additional_items_count": 1,
  "preneed_total_cents": 450000,
  "atneed_total_cents": 570000,
  "trust_funds_released_cents": 450000,
  "balance_due_cents": 120000,
  "status": "draft"
}
```

**Side Effects**:
- Creates new at-need contract with `parent_id = preneed_id`
- Migrates all items from pre-need contract (preserves guaranteed prices)
- Marks pre-need contract as `status = "converted"`
- Emits `PreNeedContractConverted` event
- If `release_trust_funds = true`, creates AR credit memo for trust amount
- Cancels pre-need payment subscription (if active)

**Business Rules**:
- Pre-need contract must be `active` or `paid_in_full`
- All pre-need items retain their original prices (guaranteed pricing)
- Additional at-need items use current pricing
- Trust funds automatically applied as deposit to at-need contract

---

#### 2.3 Link Trust Account

**Endpoint**: `POST /v1/contracts/{id}/link-trust-account`

**Description**: Link a state-mandated trust account to a pre-need contract.

**Request Body**:
```json
{
  "trust_account_id": "string",
  "trust_provider": "state_trust | third_party",
  "account_number": "string",
  "expected_balance_cents": "uint64"
}
```

**Response**: `200 OK`
```json
{
  "contract_id": "string",
  "trust_account_id": "string",
  "linked_at": "ISO8601"
}
```

**Side Effects**:
- Emits `TrustAccountLinked` event
- Updates contract attributes with trust account metadata
- Used during at-need conversion to release funds

---

### Category 3: Advanced Lifecycle Operations (HIGH PRIORITY)

#### 3.1 Amend Contract

**Endpoint**: `POST /v1/contracts/{id}/amend`

**Description**: Create a formal amendment to an active contract (beyond simple item updates).

**Request Body**:
```json
{
  "amendment_type": "price_change | scope_change | terms_change",
  "reason": "string",
  "changes": {
    "total_cents": "uint64 (new total)",
    "payment_terms": "string (if changing)",
    "end_date": "ISO8601 (if extending)"
  },
  "items_to_add": [],
  "items_to_remove": [],
  "requires_signature": true
}
```

**Response**: `200 OK`
```json
{
  "contract_id": "string",
  "amendment_id": "string",
  "version": 6,
  "status": "pending_approval (if requires_signature)",
  "changes_summary": {
    "previous_total_cents": 1040000,
    "new_total_cents": 1210000,
    "delta_cents": 170000
  }
}
```

**Side Effects**:
- Emits `ContractAmended` event
- Increments version
- If `requires_signature = true`, transitions to `pending_approval` status
- Stores amendment in audit trail

---

#### 3.2 Renew Contract

**Endpoint**: `POST /v1/contracts/{id}/renew`

**Description**: Create a renewal contract (for recurring services like pre-need maintenance).

**Request Body**:
```json
{
  "renewal_type": "automatic | manual",
  "renewal_terms": "string",
  "new_start_date": "ISO8601",
  "new_end_date": "ISO8601",
  "price_adjustment_percent": "float (e.g., 3.5 for 3.5% increase)"
}
```

**Response**: `201 Created`
```json
{
  "original_contract_id": "string",
  "renewed_contract_id": "string",
  "renewal_number": 2,
  "new_total_cents": 465750
}
```

**Side Effects**:
- Creates new contract with `parent_id = original_contract_id`
- Copies all items from original with price adjustments
- Marks original contract as `status = "renewed"`
- Emits `ContractRenewed` event

---

#### 3.3 Extend Contract

**Endpoint**: `POST /v1/contracts/{id}/extend`

**Description**: Extend the end date of an active contract (e.g., extend payment plan).

**Request Body**:
```json
{
  "new_end_date": "ISO8601",
  "extension_reason": "string",
  "adjust_payment_schedule": true
}
```

**Response**: `200 OK`
```json
{
  "contract_id": "string",
  "previous_end_date": "ISO8601",
  "new_end_date": "ISO8601",
  "extended_days": 90,
  "version": 7
}
```

**Side Effects**:
- Emits `ContractExtended` event
- Updates subscription end date (if linked)
- Recalculates payment schedule if `adjust_payment_schedule = true`

---

#### 3.4 Uplift Contract

**Endpoint**: `POST /v1/contracts/{id}/uplift`

**Description**: Apply a price uplift to all contract items (annual price increases).

**Request Body**:
```json
{
  "uplift_percent": "float (e.g., 2.5)",
  "effective_date": "ISO8601",
  "reason": "annual_adjustment | market_rate | cost_increase"
}
```

**Response**: `200 OK`
```json
{
  "contract_id": "string",
  "previous_total_cents": 1040000,
  "new_total_cents": 1066000,
  "uplift_cents": 26000,
  "affected_items": 5
}
```

**Side Effects**:
- Emits `ContractUplifted` event
- Updates all item prices proportionally
- May require customer approval (configurable)

---

#### 3.5 Supersede Contract

**Endpoint**: `POST /v1/contracts/{id}/supersede`

**Description**: Replace a contract with a new version (major changes requiring new contract).

**Request Body**:
```json
{
  "new_contract": {
    "name": "string",
    "items": [],
    "payment_terms": "string"
  },
  "supersession_reason": "string",
  "migration_type": "full_replacement | partial_migration"
}
```

**Response**: `201 Created`
```json
{
  "original_contract_id": "string",
  "superseding_contract_id": "string",
  "status": "draft"
}
```

**Side Effects**:
- Creates new contract with `supersedes_contract_id = original_contract_id`
- Marks original as `status = "superseded"`
- Emits `ContractSuperseded` event

---

### Category 4: Provisioning Integration (CRITICAL PRIORITY)

#### Problem Statement
Current API has no way to trigger or monitor the ProvisioningOrchestrator described in the assessment. This orchestrator routes contract items to downstream systems (Inventory, PS, AP, Payroll).

---

#### 4.1 Trigger Provisioning

**Endpoint**: `POST /v1/contracts/{id}/provision`

**Description**: Manually trigger provisioning for all unprovisionioned contract items.

**Request Body**:
```json
{
  "auto_provision": true,
  "items_to_provision": ["item-id-1", "item-id-2"] // optional, all if omitted
}
```

**Response**: `202 Accepted`
```json
{
  "contract_id": "string",
  "provisioning_job_id": "string",
  "items_queued": 5,
  "estimated_completion": "ISO8601"
}
```

**Side Effects**:
- Triggers `ProvisioningOrchestrator.ProvisionAllItemsFromContract()`
- For each item by `service_type`:
  - `physical_product` → POST /v1/inventory/reservations
  - `professional_services` → POST /v1/professional-services/engagements
  - `rental` → Reserve capacity in TMS
  - `procurement` → POST /v1/procurement/requisitions
- Updates item `status = "provisioned"` and sets `service_id`
- Emits `ContractItemProvisioned` events

**Use Case**: After family signs contract, funeral director clicks "Provision Services" button.

---

#### 4.2 Get Provisioning Status

**Endpoint**: `GET /v1/contracts/{id}/provisioning-status`

**Description**: Check provisioning status for all contract items.

**Response**: `200 OK`
```json
{
  "contract_id": "string",
  "items": [
    {
      "item_id": "string",
      "description": "Oak Casket",
      "service_type": "physical_product",
      "provisioning_status": "provisioned | pending | failed | not_required",
      "service_id": "INV-RESERVE-123",
      "provisioned_at": "ISO8601",
      "error": "string (if failed)"
    }
  ],
  "overall_status": "fully_provisioned | partially_provisioned | pending | failed",
  "provisioned_count": 4,
  "total_count": 5
}
```

---

#### 4.3 Reverse Provisioning

**Endpoint**: `POST /v1/contracts/{id}/reverse-provisioning`

**Description**: De-provision all services (used during contract cancellation).

**Request Body**:
```json
{
  "reason": "contract_cancelled | error_correction",
  "items_to_reverse": ["item-id-1"] // optional
}
```

**Response**: `200 OK`
```json
{
  "contract_id": "string",
  "reversed_items_count": 5,
  "operations": [
    {
      "item_id": "string",
      "service_type": "physical_product",
      "service_id": "INV-RESERVE-123",
      "action": "inventory_released",
      "status": "completed"
    }
  ]
}
```

**Side Effects**:
- Releases inventory reservations
- Cancels PS engagements
- Cancels procurement requisitions
- Emits `ContractProvisioningReversed` event

---

### Category 5: Service Linking (MEDIUM PRIORITY)

#### Problem Statement
No API to link contracts to downstream services bidirectionally. This is needed for warranty tracking, service-to-case lookups, and consolidated reporting.

---

#### 5.1 Link Service to Contract

**Endpoint**: `POST /v1/service-links`

**Description**: Create a bidirectional link between a service (in any module) and a contract.

**Request Body**:
```json
{
  "contract_id": "string",
  "service_type": "inventory | professional_services | subscription | lease | payroll | procurement",
  "service_id": "string"
}
```

**Response**: `201 Created`
```json
{
  "link_id": "string",
  "contract_id": "string",
  "service_type": "inventory",
  "service_id": "INV-ITEM-789",
  "created_at": "ISO8601"
}
```

**Use Case**: Link a casket SKU to a contract for warranty tracking.

---

#### 5.2 Get Contract Services

**Endpoint**: `GET /v1/contracts/{id}/services`

**Description**: Get all services linked to a contract.

**Response**: `200 OK`
```json
{
  "contract_id": "string",
  "services": {
    "inventory": ["INV-RESERVE-123", "INV-ITEM-789"],
    "professional_services": ["PS-ENG-456"],
    "subscriptions": ["SUB-123"],
    "payroll": ["PAYROLL-RUN-20241115"]
  },
  "total_links": 5
}
```

---

#### 5.3 Get Service Contracts

**Endpoint**: `GET /v1/service-links/{service_type}/{service_id}/contracts`

**Description**: Get all contracts that reference a specific service.

**Response**: `200 OK`
```json
{
  "service_type": "inventory",
  "service_id": "INV-ITEM-789",
  "contracts": [
    {
      "contract_id": "CASE-2025-001",
      "contract_name": "Johnson Funeral",
      "status": "active",
      "linked_at": "ISO8601"
    }
  ],
  "total_contracts": 3
}
```

**Use Case**: "Which cases used this casket SKU?" for warranty claims.

---

### Category 6: Query & Reporting (MEDIUM PRIORITY)

#### 6.1 Get Contract Event History

**Endpoint**: `GET /v1/contracts/{id}/events`

**Description**: Retrieve full event sourcing history for audit trail.

**Query Parameters**:
- `event_type` (optional): filter by event type
- `from_date` (optional): ISO8601
- `to_date` (optional): ISO8601

**Response**: `200 OK`
```json
{
  "contract_id": "string",
  "events": [
    {
      "event_id": "string",
      "event_type": "ContractCreated | ContractApproved | ContractItemAdded | etc.",
      "version": 1,
      "timestamp": "ISO8601",
      "actor": "user-id",
      "payload": {
        "field": "value"
      }
    }
  ],
  "total_events": 15
}
```

---

#### 6.2 Calculate Contract Profitability

**Endpoint**: `GET /v1/contracts/{id}/profitability`

**Description**: Calculate real-time P&L for a contract (case-level profitability).

**Response**: `200 OK`
```json
{
  "contract_id": "string",
  "revenue_cents": 1040000,
  "costs": {
    "cogs_cents": 580000,
    "labor_cents": 120000,
    "overhead_cents": 50000,
    "total_costs_cents": 750000
  },
  "gross_profit_cents": 290000,
  "gross_margin_percent": 27.88,
  "breakdown": [
    {
      "item_id": "string",
      "description": "Oak Casket",
      "revenue_cents": 650000,
      "cogs_cents": 380000,
      "profit_cents": 270000
    }
  ]
}
```

**Data Sources**:
- Revenue: contract items
- COGS: inventory commits + AP vendor bills
- Labor: PS timesheets linked to contract

---

#### 6.3 List Contracts by Status

**Endpoint**: `GET /v1/contracts`

**Description**: Enhanced list endpoint with filtering (currently only supports case_id).

**Query Parameters**:
- `status` (optional): `draft | pending_approval | active | completed | cancelled`
- `legal_entity` (optional): filter by entity
- `from_date` (optional): created after date
- `to_date` (optional): created before date
- `customer_id` (optional): filter by customer
- `parent_id` (optional): filter by parent contract (pre-need → at-need)
- `limit` (default 50): pagination
- `offset` (default 0): pagination

**Response**: `200 OK`
```json
{
  "contracts": [],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

---

#### 6.4 Get Contract Lifecycle Metrics

**Endpoint**: `GET /v1/contracts/metrics`

**Description**: Aggregate lifecycle analytics across all contracts.

**Query Parameters**:
- `from_date` (required): ISO8601
- `to_date` (required): ISO8601
- `legal_entity` (optional): filter by entity

**Response**: `200 OK`
```json
{
  "total_contracts": 250,
  "by_status": {
    "draft": 15,
    "active": 180,
    "completed": 50,
    "cancelled": 5
  },
  "avg_contract_value_cents": 1120000,
  "avg_lifecycle_days": 45,
  "amendment_rate_percent": 15.2,
  "cancellation_rate_percent": 2.0,
  "approval_bottlenecks": [
    {
      "approver": "user-id",
      "avg_approval_time_hours": 72
    }
  ]
}
```

---

#### 6.5 Get Multi-Level Approval Status

**Endpoint**: `GET /v1/contracts/{id}/approvals`

**Description**: Get detailed multi-level approval status (beyond basic getApprovalHistory).

**Response**: `200 OK`
```json
{
  "contract_id": "string",
  "approval_workflow_id": "string",
  "required_levels": 2,
  "completed_levels": 1,
  "approvals": [
    {
      "level": 1,
      "approver_role": "funeral_director",
      "approver_id": "user-123",
      "status": "approved",
      "approved_at": "ISO8601",
      "notes": "Reviewed contract terms"
    },
    {
      "level": 2,
      "approver_role": "manager",
      "approver_id": "user-456",
      "status": "pending",
      "required_by": "ISO8601"
    }
  ],
  "overall_status": "pending_approval"
}
```

---

#### 6.6 Get Hierarchical Contract Tree

**Endpoint**: `GET /v1/contracts/{id}/hierarchy`

**Description**: Get parent-child contract relationships (pre-need → at-need chains).

**Response**: `200 OK`
```json
{
  "root_contract_id": "PRENEED-2020-001",
  "tree": {
    "contract_id": "PRENEED-2020-001",
    "type": "preneed",
    "status": "converted",
    "total_cents": 400000,
    "created_at": "ISO8601",
    "children": [
      {
        "contract_id": "CASE-2025-123",
        "type": "atneed",
        "status": "completed",
        "total_cents": 520000,
        "created_at": "ISO8601",
        "children": []
      }
    ]
  }
}
```

---

## Implementation Roadmap

### Phase 1: Contract Item Management (Week 1-2)
**Priority**: HIGH  
**Endpoints**: 4 (add, update, remove, list items)  
**Business Value**: Enable mid-case changes (15% of cases)

**Implementation Notes**:
- Reuse existing event sourcing infrastructure
- Add new event types: `ContractItemAdded`, `ContractItemUpdated`, `ContractItemRemoved`
- Implement item status state machine: `draft → provisioned → active → completed/cancelled`

---

### Phase 2: Provisioning Integration (Week 3-4)
**Priority**: CRITICAL  
**Endpoints**: 3 (trigger, status, reverse)  
**Business Value**: 90% reduction in manual coordination

**Implementation Notes**:
- Create `ProvisioningOrchestrator` service (may already exist in domain layer)
- Implement routing logic by `service_type`
- Add async job queue for provisioning (consider Temporal/Cadence for reliability)
- Implement compensating transactions for reversals

---

### Phase 3: Pre-Need Lifecycle (Week 5-6)
**Priority**: CRITICAL  
**Endpoints**: 3 (create preneed, convert, link trust)  
**Business Value**: $4,500 average contract value, 30% of revenue

**Implementation Notes**:
- Add `contract_type` discriminator: `preneed | atneed`
- Implement guaranteed pricing (freeze item prices at creation)
- Integrate with Subscriptions module for payment plans
- Add trust account linking (may require external API integration)

---

### Phase 4: Advanced Lifecycle (Week 7-8)
**Priority**: HIGH  
**Endpoints**: 5 (amend, renew, extend, uplift, supersede)  
**Business Value**: Contract renewals, annual price adjustments

**Implementation Notes**:
- Add amendment workflow with signature requirements
- Implement version branching for supersession
- Add price calculation utilities for uplifts

---

### Phase 5: Service Linking (Week 9)
**Priority**: MEDIUM  
**Endpoints**: 3 (link, get contract services, get service contracts)  
**Business Value**: Warranty tracking, cross-module reporting

**Implementation Notes**:
- Create new `ServiceLinkPort` interface
- Implement bidirectional indexes (contract→services, service→contracts)
- Use PostgreSQL JSONB for service metadata
- Consider eventual consistency for cross-module links

---

### Phase 6: Query & Reporting (Week 10-11)
**Priority**: MEDIUM  
**Endpoints**: 6 (events, profitability, metrics, etc.)  
**Business Value**: Analytics, audit compliance, profitability insights

**Implementation Notes**:
- Leverage existing event store for event history
- Implement CQRS projectors for profitability calculations
- Add read models for contract metrics (avoid event store queries)
- Implement hierarchical queries (recursive CTEs in PostgreSQL)

---

## API Design Principles

### 1. RESTful Conventions
- Use proper HTTP methods: POST (create), GET (read), PATCH (update), DELETE (remove)
- Return appropriate status codes: 200, 201, 202, 400, 404, 409, 500
- Use resource-oriented URLs: `/v1/contracts/{id}/items` not `/v1/addContractItem`

### 2. Snake Case for Go JSON
All request/response JSON fields use `snake_case` (Go convention):
```json
{
  "contract_id": "string",
  "total_cents": 1000000,
  "created_at": "ISO8601"
}
```

### 3. Money as Cents
All monetary values use `uint64` cents (never floats):
```json
{
  "total_cents": 1040000  // $10,400.00
}
```

### 4. Timestamps as ISO8601
All dates/times use ISO8601 strings:
```json
{
  "created_at": "2025-11-29T20:42:31Z"
}
```

### 5. Event Sourcing Side Effects
Every mutating operation emits domain events:
- `ContractItemAdded`
- `ContractAmended`
- `PreNeedContractConverted`
- etc.

### 6. Idempotency
All POST endpoints support idempotency keys:
```http
POST /v1/contracts/{id}/items
Idempotency-Key: abc123
```

### 7. Versioning
API version in URL path: `/v1/contracts`  
Contract domain version in response: `"version": 5`

---

## Validation & Testing

### API Contract Tests
For each new endpoint, implement:
1. **Happy path**: Valid request → 200/201 response
2. **Not found**: Invalid ID → 404
3. **Validation**: Invalid payload → 400 with error details
4. **Authorization**: Unauthorized user → 403
5. **Idempotency**: Duplicate request → same response
6. **Side effects**: Verify events emitted, downstream services called

### Integration Tests
Test provisioning orchestration end-to-end:
1. Create contract with items
2. Approve contract
3. Trigger provisioning
4. Verify inventory reserved
5. Verify PS engagement created
6. Verify service links created

### Load Tests
Benchmark critical paths:
- Contract creation: 100 req/s target
- Provisioning: 50 contracts/s
- Item updates: 200 req/s

---

## Security Considerations

### Authorization Rules
- **Contract creation**: Requires `contracts:create` permission
- **Contract approval**: Requires `contracts:approve` permission (role-based)
- **Multi-level approval**: Level 2 requires `contracts:approve:manager` permission
- **Financial operations**: Requires `contracts:financial` permission
- **Provisioning**: Requires `contracts:provision` permission

### Audit Trail
All operations logged to event store with:
- User ID (actor)
- Timestamp
- Request payload
- Response status
- IP address (optional)

### Data Privacy
- PII redaction in logs (customer names, addresses)
- Encryption at rest for contract data
- TLS for all API communication

---

## TypeScript Port Additions

Once these Go backend APIs are implemented, the following TypeScript ports/methods will need to be added:

### Extended GoContractPort (18 new methods)
```typescript
// packages/application/src/ports/go-contract-port.ts

export interface GoContractPortService {
  // Existing 7 methods...
  
  // Category 1: Item Management (4 methods)
  readonly addContractItem: (contractId: string, item: AddContractItemCommand) => Effect.Effect<GoContractItem, NetworkError>;
  readonly updateContractItem: (contractId: string, itemId: string, updates: UpdateContractItemCommand) => Effect.Effect<GoContractItem, NetworkError>;
  readonly removeContractItem: (contractId: string, itemId: string, reason: string) => Effect.Effect<void, NetworkError>;
  readonly getContractItems: (contractId: string, filters?: ItemFilters) => Effect.Effect<readonly GoContractItem[], NetworkError>;
  
  // Category 2: Pre-Need (3 methods)
  readonly createPreNeedContract: (command: CreatePreNeedContractCommand) => Effect.Effect<GoContract, NetworkError>;
  readonly convertPreNeedToAtNeed: (preneedId: string, command: ConvertToAtNeedCommand) => Effect.Effect<GoContract, NetworkError>;
  readonly linkTrustAccount: (contractId: string, trustAccount: TrustAccountCommand) => Effect.Effect<void, NetworkError>;
  
  // Category 3: Advanced Lifecycle (5 methods)
  readonly amendContract: (contractId: string, amendment: AmendmentCommand) => Effect.Effect<GoContractAmendment, NetworkError>;
  readonly renewContract: (contractId: string, renewal: RenewalCommand) => Effect.Effect<GoContract, NetworkError>;
  readonly extendContract: (contractId: string, extension: ExtensionCommand) => Effect.Effect<void, NetworkError>;
  readonly upliftContract: (contractId: string, uplift: UpliftCommand) => Effect.Effect<void, NetworkError>;
  readonly supersedeContract: (contractId: string, newContract: CreateContractCommand) => Effect.Effect<GoContract, NetworkError>;
  
  // Category 4: Provisioning (3 methods)
  readonly triggerProvisioning: (contractId: string, options?: ProvisioningOptions) => Effect.Effect<ProvisioningJob, NetworkError>;
  readonly getProvisioningStatus: (contractId: string) => Effect.Effect<ProvisioningStatus, NetworkError>;
  readonly reverseProvisioning: (contractId: string, reason: string) => Effect.Effect<void, NetworkError>;
  
  // Category 5: Service Linking (3 methods - separate port)
  // See GoServiceLinkPort below
}

// New port for service linking
export interface GoServiceLinkPortService {
  readonly linkService: (link: ServiceLinkCommand) => Effect.Effect<ServiceLink, NetworkError>;
  readonly getContractServices: (contractId: string) => Effect.Effect<ContractServices, NetworkError>;
  readonly getServiceContracts: (serviceType: string, serviceId: string) => Effect.Effect<readonly ContractReference[], NetworkError>;
}

export const GoServiceLinkPort = Context.GenericTag<GoServiceLinkPortService>('@dykstra/GoServiceLinkPort');
```

---

## Success Metrics

### API Coverage
- ✅ 100% of CONTRACT_MANAGEMENT_ASSESSMENT.md requirements implemented
- ✅ 25 total contract endpoints (7 existing + 18 new)

### Business Outcomes
- **Pre-need conversion**: Reduce conversion time from 2 hours → 15 minutes (87.5% reduction)
- **Contract amendments**: Reduce amendment time from 30 minutes → 5 minutes (83% reduction)
- **Provisioning**: Automate 90% of manual coordination (200 cases/year × 40 min/case = 133 hours saved)
- **Case profitability**: Real-time P&L calculation (vs. end-of-month reconciliation)

### Technical Metrics
- **API latency**: p95 < 200ms for all endpoints
- **Event throughput**: 1000 events/second
- **Provisioning reliability**: 99.5% success rate

---

## References

- **Assessment Document**: docs/CONTRACT_MANAGEMENT_ASSESSMENT.md
- **Current API Coverage**: docs/GO_BACKEND_API_COVERAGE.md
- **Current Port**: packages/application/src/ports/go-contract-port.ts
- **Architecture**: ARCHITECTURE.md (Clean Architecture patterns)

---

**Document Status**: Requirements Document v1.0  
**Next Steps**: 
1. Review with Go backend team
2. Create implementation tickets (1 ticket per category)
3. Prioritize Phase 1-2 (Critical: Item Management + Provisioning)
4. Estimate development effort (10-11 weeks for all 6 phases)
