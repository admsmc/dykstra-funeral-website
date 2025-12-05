# Workflow Approvals Feature

**Purpose**: Dashboard for managing pending approval workflows with batch actions.

## Page Reduction
- **Before**: 367 lines
- **After**: 86 lines
- **Reduction**: 76.6%

## Structure
```
src/features/workflow-approvals/
├── components/
│   ├── ApprovalCard.tsx         # Individual approval request card
│   ├── ApprovalGrid.tsx         # Grid layout for approval cards
│   ├── FilterTabs.tsx           # All/Pending/Approved tabs
│   └── EmptyState.tsx           # No approvals state
├── hooks/
│   └── useWorkflowApprovals.ts  # Fetch approval data
├── view-models/
│   └── workflowApprovalsViewModel.ts  # Filtering and computed stats
└── types/
    └── index.ts                 # Approval type definitions
```

## Key Features
- Tab-based filtering (All/Pending/Approved)
- Real-time count badges
- Approve/Reject actions
- Empty state handling
