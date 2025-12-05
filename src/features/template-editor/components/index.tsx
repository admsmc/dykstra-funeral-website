/**
 * Template Editor Feature - Components
 */

import type { SaveStatus, PreviewMode, DeviceType } from "../types";

// Editor Page Header with Save Status
interface EditorHeaderProps {
  isSaving: boolean;
  saveStatus: SaveStatus;
}

export function EditorHeader({ isSaving, saveStatus }: EditorHeaderProps) {
  return (
    <div
      className="page-header"
      style={{
        padding: "20px",
        backgroundColor: "#f5f3ed",
        borderBottom: "2px solid #1e3a5f",
      }}
    >
      <h1
        style={{
          margin: 0,
          fontFamily: "Playfair Display, serif",
          color: "#1e3a5f",
        }}
      >
        Memorial Template Editor
      </h1>
      <p style={{ margin: "10px 0 0", color: "#555" }}>
        Create and customize memorial document templates with drag-and-drop
        editing
      </p>

      {isSaving && (
        <div style={{ marginTop: "10px", color: "#8b9d83" }}>
          Saving template...
        </div>
      )}

      {saveStatus === "success" && (
        <div
          style={{
            marginTop: "10px",
            color: "#28a745",
            fontWeight: "bold",
          }}
        >
          ✓ Template saved successfully
        </div>
      )}

      {saveStatus === "error" && (
        <div
          style={{
            marginTop: "10px",
            color: "#dc3545",
            fontWeight: "bold",
          }}
        >
          ✗ Failed to save template
        </div>
      )}
    </div>
  );
}

// Device Preview Controls (Fixed Bottom-Right)
interface DevicePreviewControlsProps {
  previewMode: PreviewMode;
  onPreviewModeChange: (mode: PreviewMode) => void;
  selectedDevice: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
}

export function DevicePreviewControls({
  previewMode,
  onPreviewModeChange,
  selectedDevice,
  onDeviceChange,
}: DevicePreviewControlsProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        backgroundColor: "white",
        padding: "12px 16px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        display: "flex",
        gap: "12px",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          fontSize: "14px",
          fontWeight: "bold",
          color: "#1e3a5f",
        }}
      >
        Preview Mode:
      </div>
      <button
        onClick={() => onPreviewModeChange("single")}
        style={{
          padding: "8px 16px",
          backgroundColor: previewMode === "single" ? "#1e3a5f" : "white",
          color: previewMode === "single" ? "white" : "#1e3a5f",
          border: "2px solid #1e3a5f",
          borderRadius: "4px",
          fontSize: "13px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Single
      </button>
      <button
        onClick={() => onPreviewModeChange("multi")}
        style={{
          padding: "8px 16px",
          backgroundColor: previewMode === "multi" ? "#1e3a5f" : "white",
          color: previewMode === "multi" ? "white" : "#1e3a5f",
          border: "2px solid #1e3a5f",
          borderRadius: "4px",
          fontSize: "13px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Multi-Device
      </button>
      {previewMode === "single" && (
        <select
          value={selectedDevice}
          onChange={(e) => onDeviceChange(e.target.value as DeviceType)}
          style={{
            padding: "8px 12px",
            border: "2px solid #ddd",
            borderRadius: "4px",
            fontSize: "13px",
            backgroundColor: "white",
            cursor: "pointer",
          }}
        >
          <option value="letter">Letter (8.5x11")</option>
          <option value="a4">A4 (8.27x11.69")</option>
          <option value="4x6">Prayer Card (4x6")</option>
        </select>
      )}
    </div>
  );
}

// Preview Modal (Single or Multi-Device)
interface PreviewModalProps {
  previewPdfUrl: string;
  previewMode: PreviewMode;
  selectedDevice: DeviceType;
  onClose: () => void;
}

export function PreviewModal({
  previewPdfUrl,
  previewMode,
  selectedDevice,
  onClose,
}: PreviewModalProps) {
  return (
    <div
      className="preview-modal"
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
        className="preview-content"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          maxWidth: "900px",
          maxHeight: "90vh",
          width: "100%",
          overflow: "auto",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "15px 20px",
            borderBottom: "1px solid #ddd",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontFamily: "Playfair Display, serif" }}>
            PDF Preview (Sample Data)
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
        <div style={{ padding: "20px" }}>
          {previewMode === "single" ? (
            <SingleDevicePreview
              previewPdfUrl={previewPdfUrl}
              selectedDevice={selectedDevice}
            />
          ) : (
            <MultiDevicePreview previewPdfUrl={previewPdfUrl} />
          )}
        </div>
      </div>
    </div>
  );
}

// Single Device Preview
interface SingleDevicePreviewProps {
  previewPdfUrl: string;
  selectedDevice: DeviceType;
}

function SingleDevicePreview({
  previewPdfUrl,
  selectedDevice,
}: SingleDevicePreviewProps) {
  const deviceLabels: Record<DeviceType, string> = {
    letter: "Letter",
    a4: "A4",
    "4x6": "Prayer Card",
  };

  const deviceDimensions: Record<DeviceType, string> = {
    letter: '8.5" × 11"',
    a4: '8.27" × 11.69"',
    "4x6": '4" × 6"',
  };

  return (
    <div>
      <div
        style={{
          fontSize: "14px",
          color: "#666",
          marginBottom: "12px",
          padding: "8px 12px",
          backgroundColor: "#f5f3ed",
          borderRadius: "4px",
        }}
      >
        Device: {deviceLabels[selectedDevice]} • Dimensions:{" "}
        {deviceDimensions[selectedDevice]}
      </div>
      <iframe
        src={previewPdfUrl}
        style={{
          width: "100%",
          height: "70vh",
          border: "1px solid #ddd",
          borderRadius: "4px",
        }}
        title="PDF Preview"
      />
    </div>
  );
}

// Multi-Device Preview (3 Columns)
interface MultiDevicePreviewProps {
  previewPdfUrl: string;
}

function MultiDevicePreview({ previewPdfUrl }: MultiDevicePreviewProps) {
  const devices = [
    {
      name: "Letter (8.5x11\")",
      borderColor: "#1e3a5f",
      margins: "0.5\" margins",
    },
    { name: "A4 (8.27x11.69\")", borderColor: "#8b9d83", margins: "0.5\" margins" },
    {
      name: "Prayer Card (4x6\")",
      borderColor: "#b8956a",
      margins: "0.25\" margins",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
      {devices.map((device, index) => (
        <div key={index}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              color: "#1e3a5f",
              marginBottom: "8px",
              textAlign: "center",
            }}
          >
            {device.name}
          </div>
          <div
            style={{
              border: `2px solid ${device.borderColor}`,
              borderRadius: "4px",
              overflow: "hidden",
              backgroundColor: "#f8f8f8",
            }}
          >
            <iframe
              src={previewPdfUrl}
              style={{
                width: "100%",
                height: "400px",
                border: "none",
              }}
              title={`${device.name} Preview`}
            />
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#666",
              marginTop: "4px",
              textAlign: "center",
            }}
          >
            Portrait • {device.margins}
          </div>
        </div>
      ))}
    </div>
  );
}

// Loading Overlay (for PDF generation)
interface LoadingOverlayProps {
  isGenerating: boolean;
}

export function LoadingOverlay({ isGenerating }: LoadingOverlayProps) {
  if (!isGenerating) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 9998,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "30px 40px",
          borderRadius: "8px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "18px",
            color: "#1e3a5f",
            marginBottom: "10px",
          }}
        >
          Generating PDF Preview...
        </div>
        <div style={{ fontSize: "14px", color: "#666" }}>
          This may take a few seconds
        </div>
      </div>
    </div>
  );
}

// GrapesJS Custom Styles
export function EditorStyles() {
  return (
    <style jsx global>{`
      /* GrapesJS styling overrides */
      .gjs-one-bg {
        background-color: #1e3a5f;
      }

      .gjs-two-color {
        color: #8b9d83;
      }

      .gjs-three-bg {
        background-color: #f5f3ed;
      }

      .gjs-four-color {
        color: #2c3539;
      }

      /* Block category styling */
      .gjs-block-category .gjs-title {
        background-color: #1e3a5f;
        color: white;
        font-family: "Playfair Display", serif;
      }

      /* Memorial Elements blocks styling */
      .gjs-blocks-c .gjs-block {
        border: 1px solid #ddd;
        transition: all 0.2s ease;
      }

      .gjs-blocks-c .gjs-block:hover {
        border-color: #8b9d83;
        box-shadow: 0 2px 8px rgba(139, 157, 131, 0.3);
      }
    `}</style>
  );
}
