/**
 * Template Approvals Feature - Public API
 */

export {
  ApprovalsPageHeader,
  EmptyState,
  PendingTemplatesList,
  ReviewPanel,
} from "./components";

export {
  usePendingTemplates,
  useTemplateHistory,
  useUpdateTemplateStatus,
  useTemplateSelection,
} from "./hooks/useTemplateApprovals";

export { ApprovalTemplateViewModel, HistoryVersionViewModel } from "./view-models/ApprovalTemplateViewModel";

export type { MemorialTemplate, ApprovalAction, TemplateHistoryItem } from "./types";
