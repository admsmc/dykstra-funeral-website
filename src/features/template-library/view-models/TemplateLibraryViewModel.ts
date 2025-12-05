/**
 * Template Library Feature - ViewModels
 */

import { BaseViewModel } from "@/lib/view-models/base-view-model";
import type { MemorialTemplate } from "../types";

export class TemplateLibraryViewModel extends BaseViewModel {
  constructor(private template: MemorialTemplate) {
    super();
  }

  get id() {
    return this.template.metadata.id;
  }

  get name() {
    return this.template.metadata.name;
  }

  get businessKey() {
    return this.template.metadata.businessKey;
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

  get status() {
    return this.template.metadata.status;
  }

  get statusBadgeConfig() {
    const colors: Record<string, string> = {
      draft: "#999",
      active: "#28a745",
      deprecated: "#dc3545",
    };

    return {
      bg: colors[this.template.metadata.status] || "#999",
      text: "white",
    };
  }

  get version() {
    return this.template.temporal.version;
  }

  get pageSize() {
    return this.template.settings.pageSize;
  }

  get orientation() {
    return this.template.settings.orientation;
  }

  get printQuality() {
    return this.template.settings.printQuality;
  }

  get formattedSettings() {
    return `v${this.template.temporal.version} • ${this.template.settings.pageSize} • ${this.template.settings.orientation}`;
  }

  get rawTemplate() {
    return this.template;
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

  get isCurrent() {
    return this.version.temporal.validTo === null;
  }

  get changeReason() {
    return this.version.temporal.changeReason;
  }

  get hasChangeReason() {
    return !!this.version.temporal.changeReason;
  }

  get settings() {
    return `${this.version.settings.pageSize} • ${this.version.settings.orientation} • ${this.version.settings.printQuality} DPI`;
  }

  get rawVersion() {
    return this.version;
  }
}
