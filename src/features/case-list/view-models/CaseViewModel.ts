/**
 * Case List Feature - ViewModels
 */

import { BaseViewModel } from "@/lib/view-models/base-view-model";
import type { CaseListItem } from "../types";

export class CaseViewModel extends BaseViewModel {
  constructor(private case_: CaseListItem) {
    super();
  }

  get id() {
    return this.case_.id;
  }

  get businessKey() {
    return this.case_.businessKey;
  }

  get decedentName() {
    return this.case_.decedentName;
  }

  get type() {
    return this.case_.type;
  }

  get status() {
    return this.case_.status;
  }

  get formattedType() {
    return this.case_.type.replace("_", " ");
  }

  get formattedStatus() {
    return this.case_.status;
  }

  get statusBadgeConfig() {
    const configs: Record<
      string,
      { bg: string; text: string }
    > = {
      INQUIRY: { bg: "bg-yellow-100", text: "text-yellow-800" },
      ACTIVE: { bg: "bg-green-100", text: "text-green-800" },
      COMPLETED: { bg: "bg-gray-100", text: "text-gray-800" },
      ARCHIVED: { bg: "bg-gray-100", text: "text-gray-600" },
    };

    return (
      configs[this.case_.status] || {
        bg: "bg-gray-100",
        text: "text-gray-800",
      }
    );
  }

  get typeBadgeConfig() {
    return {
      bg: "bg-blue-100",
      text: "text-blue-800",
    };
  }

  get serviceType() {
    return this.case_.serviceType;
  }

  get formattedServiceType() {
    return this.case_.serviceType
      ? this.case_.serviceType.replace("_", " ")
      : "Not scheduled";
  }

  get hasServiceType() {
    return this.case_.serviceType !== null;
  }

  get serviceDate() {
    return this.case_.serviceDate;
  }

  get formattedServiceDate() {
    return this.case_.serviceDate
      ? this.formatDate(this.case_.serviceDate)
      : "Not scheduled";
  }

  get hasServiceDate() {
    return this.case_.serviceDate !== null;
  }

  get createdAt() {
    return this.case_.createdAt;
  }

  get formattedCreatedAt() {
    return this.formatDate(this.case_.createdAt);
  }

  get detailUrl() {
    return `/staff/cases/${this.case_.businessKey}`;
  }
}
