/**
 * Template Approvals Feature - ViewModels
 */

import { BaseViewModel } from "@/lib/view-models/base-view-model";
import type { MemorialTemplate } from "../types";

export class ApprovalTemplateViewModel extends BaseViewModel {
  constructor(private template: MemorialTemplate) {
    super();
  }

  get id() {
    return this.template.metadata.id;
  }

  get businessKey() {
    return this.template.metadata.businessKey;
  }

  get name() {
    return this.template.metadata.name;
  }

  get category() {
    return this.template.metadata.category;
  }

  get formattedCategory() {
    const labels: Record<string, string> = {
      service_program: "Service Program",
      prayer_card: "Prayer Card",
      memorial_folder: "Memorial Folder",
      bookmark: "Bookmark",
    };
    return labels[this.template.metadata.category] || this.template.metadata.category;
  }

  get version() {
    return this.template.temporal.version;
  }

  get validFrom() {
    return this.template.temporal.validFrom;
  }

  get formattedValidFrom() {
    return this.formatDate(this.template.temporal.validFrom);
  }

  get changeReason() {
    return this.template.temporal.changeReason;
  }

  get hasChangeReason() {
    return !!this.template.temporal.changeReason;
  }

  get createdBy() {
    return this.template.metadata.createdBy;
  }

  get pageSize() {
    return this.template.settings.pageSize;
  }

  get orientation() {
    return this.template.settings.orientation;
  }

  get formattedSettings() {
    return `${this.template.settings.pageSize} (${this.template.settings.orientation})`;
  }

  get status() {
    return this.template.metadata.status;
  }
}

export class HistoryVersionViewModel extends BaseViewModel {
  constructor(private version: MemorialTemplate) {
    super();
  }

  get id() {
    return this.version.metadata.id;
  }

  get version() {
    return this.version.temporal.version;
  }

  get status() {
    return this.version.metadata.status;
  }

  get statusBadgeConfig() {
    const colors: Record<string, string> = {
      draft: "#999",
      active: "#28a745",
      deprecated: "#dc3545",
    };

    return {
      bg: colors[this.version.metadata.status] || "#999",
      text: "white",
    };
  }

  get validFrom() {
    return this.version.temporal.validFrom;
  }

  get validTo() {
    return this.version.temporal.validTo;
  }

  get formattedValidFrom() {
    return this.formatDate(this.version.temporal.validFrom);
  }

  get formattedValidTo() {
    return this.version.temporal.validTo
      ? this.formatDate(this.version.temporal.validTo)
      : "Present";
  }

  get changeReason() {
    return this.version.temporal.changeReason;
  }

  get hasChangeReason() {
    return !!this.version.temporal.changeReason;
  }
}
