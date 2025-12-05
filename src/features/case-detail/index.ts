// Types
export type { TabType, CaseDetailData, TabConfig } from "./types";

// ViewModels
export { CaseDetailViewModel } from "./view-models/CaseDetailViewModel";

// Hooks
export { useCaseDetail } from "./hooks/useCaseDetail";
export { useTabState } from "./hooks/useTabState";
export { useInternalNotes } from "./hooks/useInternalNotes";
export { useFamilyInvitations } from "./hooks/useFamilyInvitations";

// Components
export {
  CaseDetailHeader,
  QuickStatsCards,
  TabNavigation,
  OverviewTab,
  ArrangementsTab,
  ContractTab,
  PaymentsTab,
  MemorialTab,
  DocumentsTab,
  TimelineTab,
  InternalNotesTab,
  FamiliesTab,
  InvitationForm,
} from "./components";
