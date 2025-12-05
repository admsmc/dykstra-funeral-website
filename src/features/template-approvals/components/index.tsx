/**
 * Template Approvals Feature - Components
 */

import type { ApprovalTemplateViewModel, HistoryVersionViewModel } from "../view-models/ApprovalTemplateViewModel";
import type { MemorialTemplate } from "../types";

// Page Header
export function ApprovalsPageHeader() {
  return (
    <div
      style={{
        padding: "40px 20px",
        backgroundColor: "#1e3a5f",
        color: "white",
        borderBottom: "4px solid #8b9d83",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "Playfair Display, serif",
            fontSize: "36px",
          }}
        >
          Template Approvals
        </h1>
        <p style={{ margin: "10px 0 0", fontSize: "16px", opacity: 0.9 }}>
          Review and approve pending template changes
        </p>
      </div>
    </div>
  );
}

// Empty State
export function EmptyState() {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "80px 20px",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div style={{ fontSize: "48px", marginBottom: "20px" }}>✅</div>
      <div
        style={{ fontSize: "20px", color: "#1e3a5f", marginBottom: "10px" }}
      >
        All Caught Up!
      </div>
      <div style={{ fontSize: "14px", color: "#666" }}>
        No pending templates require approval
      </div>
    </div>
  );
}

// Pending Templates Sidebar
interface PendingTemplatesListProps {
  templates: ApprovalTemplateViewModel[];
  selectedId: string | null;
  onSelect: (template: MemorialTemplate) => void;
}

export function PendingTemplatesList({
  templates,
  selectedId,
  onSelect,
}: PendingTemplatesListProps) {
  return (
    <div style={{ flex: "0 0 350px" }}>
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px",
            borderBottom: "2px solid #f0f0f0",
            fontWeight: "bold",
            color: "#1e3a5f",
          }}
        >
          Pending Templates ({templates.length})
        </div>
        <div style={{ maxHeight: "600px", overflowY: "auto" }}>
          {templates.map((template) => (
            <TemplateListItem
              key={template.id}
              template={template}
              isSelected={selectedId === template.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Template List Item
interface TemplateListItemProps {
  template: ApprovalTemplateViewModel;
  isSelected: boolean;
  onSelect: (template: MemorialTemplate) => void;
}

function TemplateListItem({
  template,
  isSelected,
  onSelect,
}: TemplateListItemProps) {
  return (
    <div
      onClick={() => onSelect(template as any)}
      style={{
        padding: "16px",
        borderBottom: "1px solid #f0f0f0",
        cursor: "pointer",
        backgroundColor: isSelected ? "#f5f3ed" : "white",
        transition: "background-color 0.2s",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = "#fafafa";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = "white";
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          color: "#1e3a5f",
          marginBottom: "4px",
        }}
      >
        {template.name}
      </div>
      <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
        {template.formattedCategory}
      </div>
      <div style={{ fontSize: "11px", color: "#999" }}>
        Version {template.version} • {template.formattedValidFrom}
      </div>
    </div>
  );
}

// Review Panel
interface ReviewPanelProps {
  template: ApprovalTemplateViewModel | null;
  showHistory: boolean;
  onToggleHistory: () => void;
  versions: HistoryVersionViewModel[];
  reviewNotes: string;
  onReviewNotesChange: (notes: string) => void;
  onApprove: () => void;
  onReject: () => void;
  isPending: boolean;
  isError: boolean;
  errorMessage?: string;
}

export function ReviewPanel({
  template,
  showHistory,
  onToggleHistory,
  versions,
  reviewNotes,
  onReviewNotesChange,
  onApprove,
  onReject,
  isPending,
  isError,
  errorMessage,
}: ReviewPanelProps) {
  if (!template) {
    return (
      <div style={{ flex: 1 }}>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            padding: "60px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>👈</div>
          <div style={{ fontSize: "16px", color: "#666" }}>
            Select a template to review
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1 }}>
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          padding: "24px",
        }}
      >
        {/* Template Info */}
        <div style={{ marginBottom: "24px" }}>
          <h2
            style={{
              margin: "0 0 8px",
              fontFamily: "Playfair Display, serif",
              color: "#1e3a5f",
            }}
          >
            {template.name}
          </h2>
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>
            {template.formattedCategory} • Version {template.version} •{" "}
            {template.formattedSettings}
          </div>

          {/* Change Reason */}
          {template.hasChangeReason && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#f5f3ed",
                borderRadius: "4px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#1e3a5f",
                  marginBottom: "4px",
                }}
              >
                Change Reason:
              </div>
              <div style={{ fontSize: "14px", color: "#555" }}>
                {template.changeReason}
              </div>
            </div>
          )}

          <div style={{ fontSize: "12px", color: "#666" }}>
            Created by: {template.createdBy}
          </div>
        </div>

        {/* View History Button */}
        <button
          onClick={onToggleHistory}
          style={{
            padding: "8px 16px",
            backgroundColor: "white",
            border: "2px solid #1e3a5f",
            borderRadius: "4px",
            color: "#1e3a5f",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: "pointer",
            marginBottom: "24px",
          }}
        >
          {showHistory ? "Hide History" : "View History"}
        </button>

        {/* History */}
        {showHistory && versions.length > 0 && (
          <TemplateHistory versions={versions} />
        )}

        {/* Review Notes */}
        <div style={{ marginBottom: "24px" }}>
          <label
            htmlFor="review-notes"
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "bold",
              color: "#1e3a5f",
              marginBottom: "8px",
            }}
          >
            Review Notes (Optional)
          </label>
          <textarea
            id="review-notes"
            value={reviewNotes}
            onChange={(e) => onReviewNotesChange(e.target.value)}
            placeholder="Add notes about this approval/rejection..."
            rows={4}
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              fontFamily: "Inter, sans-serif",
              resize: "vertical",
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onApprove}
            disabled={isPending}
            style={{
              flex: 1,
              padding: "14px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {isPending ? "Processing..." : "✓ Approve"}
          </button>
          <button
            onClick={onReject}
            disabled={isPending}
            style={{
              flex: 1,
              padding: "14px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {isPending ? "Processing..." : "✗ Reject"}
          </button>
        </div>

        {/* Error Message */}
        {isError && errorMessage && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              backgroundColor: "#ffebee",
              border: "1px solid #f44336",
              borderRadius: "4px",
              color: "#c62828",
              fontSize: "14px",
            }}
          >
            Error: {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}

// Template History
interface TemplateHistoryProps {
  versions: HistoryVersionViewModel[];
}

function TemplateHistory({ versions }: TemplateHistoryProps) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h3
        style={{
          fontSize: "16px",
          color: "#1e3a5f",
          marginBottom: "12px",
        }}
      >
        Version History ({versions.length})
      </h3>
      <div style={{ borderLeft: "3px solid #8b9d83", paddingLeft: "16px" }}>
        {versions.map((version) => (
          <div key={version.id} style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontWeight: "bold",
                color: "#1e3a5f",
                marginBottom: "4px",
              }}
            >
              Version {version.version} -{" "}
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "normal",
                  padding: "2px 6px",
                  borderRadius: "3px",
                  backgroundColor: version.statusBadgeConfig.bg,
                  color: version.statusBadgeConfig.text,
                }}
              >
                {version.status}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              {version.formattedValidFrom} - {version.formattedValidTo}
            </div>
            {version.hasChangeReason && (
              <div
                style={{ fontSize: "12px", color: "#555", marginTop: "4px" }}
              >
                {version.changeReason}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
