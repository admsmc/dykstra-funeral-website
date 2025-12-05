/**
 * Template Library Feature - Public API
 */

export {
  LibraryHeader,
  SearchFilters,
  TemplateGrid,
  HistoryModal,
} from "./components";

export {
  useTemplateQueries,
  useTemplateFilters,
  useTemplateHistory,
  useTemplateRollback,
} from "./hooks/useTemplateLibrary";

export {
  TemplateLibraryViewModel,
  HistoryVersionViewModel,
} from "./view-models/TemplateLibraryViewModel";

export type {
  MemorialTemplate,
  TemplateCategory,
  TemplateFilters,
  RollbackParams,
} from "./types";
