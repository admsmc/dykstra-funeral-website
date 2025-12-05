/**
 * Template Library Feature - Components
 */

import type { TemplateLibraryViewModel, HistoryVersionViewModel } from "../view-models/TemplateLibraryViewModel";
import type { TemplateCategory } from "../types";

// Library Page Header
export function LibraryHeader() {
  return (
    <div
      className="page-header"
      style={{
        padding: "40px 20px",
        backgroundColor: "#1e3a5f",
        color: "white",
        borderBottom: "4px solid #8b9d83",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ margin: 0, fontFamily: "Playfair Display, serif", fontSize: "36px" }}>
          Template Library
        </h1>
        <p style={{ margin: "10px 0 0", fontSize: "16px", opacity: 0.9 }}>
          Browse and manage memorial document templates
        </p>
      </div>
    </div>
  );
}

// Search and Filter Controls
interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: TemplateCategory;
  onCategoryChange: (category: TemplateCategory) => void;
  onCreateNew: () => void;
}

export function SearchFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onCreateNew,
}: SearchFiltersProps) {
  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "30px auto",
        padding: "0 20px",
        display: "flex",
        gap: "20px",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      {/* Search */}
      <input
        type="text"
        placeholder="Search templates..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{
          flex: "1 1 300px",
          padding: "12px 16px",
          border: "2px solid #ddd",
          borderRadius: "6px",
          fontSize: "14px",
          fontFamily: "Inter, sans-serif",
          outline: "none",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#8b9d83")}
        onBlur={(e) => (e.target.style.borderColor = "#ddd")}
      />

      {/* Category Filter */}
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value as TemplateCategory)}
        style={{
          padding: "12px 16px",
          border: "2px solid #ddd",
          borderRadius: "6px",
          fontSize: "14px",
          fontFamily: "Inter, sans-serif",
          backgroundColor: "white",
          cursor: "pointer",
        }}
      >
        <option value="all">All Categories</option>
        <option value="service_program">Service Programs</option>
        <option value="prayer_card">Prayer Cards</option>
        <option value="memorial_folder">Memorial Folders</option>
        <option value="bookmark">Bookmarks</option>
      </select>

      {/* Create New Button */}
      <button
        onClick={onCreateNew}
        style={{
          padding: "12px 24px",
          backgroundColor: "#8b9d83",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: "bold",
          fontFamily: "Inter, sans-serif",
          cursor: "pointer",
          transition: "background-color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#7a8b74")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#8b9d83")}
      >
        + Create New Template
      </button>
    </div>
  );
}

// Template Grid
interface TemplateGridProps {
  templates: TemplateLibraryViewModel[];
  isLoading: boolean;
  onEdit: (template: TemplateLibraryViewModel) => void;
  onViewHistory: (template: TemplateLibraryViewModel) => void;
  hasFilters: boolean;
}

export function TemplateGrid({
  templates,
  isLoading,
  onEdit,
  onViewHistory,
  hasFilters,
}: TemplateGridProps) {
  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#666" }}>
        <div style={{ fontSize: "18px" }}>Loading templates...</div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "18px", color: "#666", marginBottom: "10px" }}>
          No templates found
        </div>
        <div style={{ fontSize: "14px", color: "#999" }}>
          {hasFilters
            ? "Try adjusting your search or filters"
            : "Create your first template to get started"}
        </div>
      </div>
    );
  }

  return (
    <div
      className="template-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "24px",
      }}
    >
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onEdit={() => onEdit(template)}
          onViewHistory={() => onViewHistory(template)}
        />
      ))}
    </div>
  );
}

// Template Card
interface TemplateCardProps {
  template: TemplateLibraryViewModel;
  onEdit: () => void;
  onViewHistory: () => void;
}

function TemplateCard({ template, onEdit, onViewHistory }: TemplateCardProps) {
  const badgeConfig = template.statusBadgeConfig;

  return (
    <div
      className="template-card"
      style={{
        backgroundColor: "white",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
      }}
    >
      {/* Template Preview */}
      <div
        style={{
          height: "160px",
          backgroundColor: "#f8f8f8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid #eee",
        }}
      >
        <div style={{ fontSize: "48px", color: "#ddd" }}>📄</div>
      </div>

      {/* Template Info */}
      <div style={{ padding: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "8px",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: "bold",
              color: "#1e3a5f",
              fontFamily: "Playfair Display, serif",
            }}
          >
            {template.name}
          </h3>
          <span
            style={{
              fontSize: "10px",
              fontWeight: "bold",
              textTransform: "uppercase",
              padding: "2px 6px",
              borderRadius: "3px",
              backgroundColor: badgeConfig.bg,
              color: badgeConfig.text,
            }}
          >
            {template.status}
          </span>
        </div>

        <div
          style={{
            fontSize: "12px",
            color: "#666",
            marginBottom: "4px",
          }}
        >
          {template.formattedCategory}
        </div>

        <div
          style={{
            fontSize: "11px",
            color: "#999",
            marginBottom: "12px",
          }}
        >
          {template.formattedSettings}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={onEdit}
            style={{
              flex: 1,
              padding: "10px",
              backgroundColor: "#1e3a5f",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "bold",
              fontFamily: "Inter, sans-serif",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2c4a7f")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1e3a5f")}
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewHistory();
            }}
            style={{
              flex: 1,
              padding: "10px",
              backgroundColor: "#8b9d83",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "bold",
              fontFamily: "Inter, sans-serif",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#7a8b74")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#8b9d83")}
          >
            History
          </button>
        </div>
      </div>
    </div>
  );
}

// Version History Modal
interface HistoryModalProps {
  template: TemplateLibraryViewModel | null;
  versions: HistoryVersionViewModel[];
  isLoading: boolean;
  onClose: () => void;
  onRollback: (version: HistoryVersionViewModel) => void;
  isRollbackPending: boolean;
}

export function HistoryModal({
  template,
  versions,
  isLoading,
  onClose,
  onRollback,
  isRollbackPending,
}: HistoryModalProps) {
  if (!template) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          maxWidth: "800px",
          maxHeight: "90vh",
          width: "100%",
          overflow: "auto",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px",
            borderBottom: "2px solid #f0f0f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontFamily: "Playfair Display, serif", color: "#1e3a5f" }}>
            Version History
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              padding: "0 10px",
            }}
          >
            ×
          </button>
        </div>

        {/* Template Name */}
        <div style={{ padding: "20px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1e3a5f", marginBottom: "8px" }}>
            {template.name}
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>
            {template.formattedCategory} • Business Key: {template.businessKey}
          </div>
        </div>

        {/* History Timeline */}
        <div style={{ padding: "20px" }}>
          {isLoading && (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              Loading history...
            </div>
          )}

          {!isLoading && versions.length > 0 && (
            <div style={{ borderLeft: "3px solid #8b9d83", paddingLeft: "20px" }}>
              {versions.map((version) => (
                <VersionItem
                  key={version.id}
                  version={version}
                  onRollback={() => onRollback(version)}
                  isRollbackPending={isRollbackPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Version Item
interface VersionItemProps {
  version: HistoryVersionViewModel;
  onRollback: () => void;
  isRollbackPending: boolean;
}

function VersionItem({ version, onRollback, isRollbackPending }: VersionItemProps) {
  const badgeConfig = version.statusBadgeConfig;

  return (
    <div
      style={{
        marginBottom: "24px",
        paddingBottom: "24px",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      {/* Version Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <div style={{ fontWeight: "bold", color: "#1e3a5f", marginBottom: "4px" }}>
            Version {version.version}
            {version.isCurrent && (
              <span style={{ marginLeft: "8px", fontSize: "12px", color: "#28a745" }}>
                (Current)
              </span>
            )}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {version.formattedValidFrom} - {version.formattedValidTo}
          </div>
        </div>
        <span
          style={{
            fontSize: "11px",
            fontWeight: "bold",
            textTransform: "uppercase",
            padding: "4px 8px",
            borderRadius: "3px",
            backgroundColor: badgeConfig.bg,
            color: badgeConfig.text,
          }}
        >
          {version.status}
        </span>
      </div>

      {/* Change Reason */}
      {version.hasChangeReason && (
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: "#f5f3ed",
            borderRadius: "4px",
            fontSize: "13px",
            color: "#555",
            marginBottom: "12px",
          }}
        >
          {version.changeReason}
        </div>
      )}

      {/* Version Details */}
      <div style={{ fontSize: "12px", color: "#666", marginBottom: "12px" }}>
        {version.settings}
      </div>

      {/* Rollback Button */}
      {!version.isCurrent && (
        <button
          onClick={onRollback}
          disabled={isRollbackPending}
          style={{
            padding: "8px 16px",
            backgroundColor: "#8b9d83",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "13px",
            fontWeight: "bold",
            cursor: isRollbackPending ? "not-allowed" : "pointer",
            opacity: isRollbackPending ? 0.6 : 1,
          }}
        >
          {isRollbackPending ? "Restoring..." : "↺ Restore This Version"}
        </button>
      )}
    </div>
  );
}
