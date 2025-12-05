import { BaseViewModel } from "@/lib/view-models/base-view-model";
import type { CaseDetailData } from "../types";

export class CaseDetailViewModel extends BaseViewModel {
  constructor(private data: CaseDetailData) {
    super();
  }

  get decedentName() {
    return this.data.case.decedentName;
  }

  get caseId() {
    return this.data.case.id;
  }

  get caseNumberShort() {
    return this.data.case.id.slice(0, 8);
  }

  get caseType() {
    return this.data.case.type.replace("_", " ");
  }

  get status() {
    return this.data.case.status;
  }

  get statusBadgeConfig() {
    const status = this.data.case.status;
    const configs = {
      INQUIRY: { bg: "bg-yellow-100", text: "text-yellow-800" },
      ACTIVE: { bg: "bg-green-100", text: "text-green-800" },
      COMPLETED: { bg: "bg-blue-100", text: "text-blue-800" },
    };
    return configs[status as keyof typeof configs] || { bg: "bg-gray-100", text: "text-gray-800" };
  }

  get formattedServiceDate() {
    return this.data.case.serviceDate
      ? this.formatDate(this.data.case.serviceDate)
      : "Not scheduled";
  }

  get formattedServiceType() {
    return this.data.case.serviceType?.replace("_", " ") || "Not selected";
  }

  get formattedCreatedDate() {
    return this.formatDate(this.data.case.createdAt);
  }

  get formattedUpdatedDate() {
    return this.formatDate(this.data.case.updatedAt);
  }

  // Decedent information
  get decedentDateOfBirth() {
    return (this.data.case as any).decedentDateOfBirth
      ? this.formatDate((this.data.case as any).decedentDateOfBirth)
      : "Not provided";
  }

  get decedentDateOfDeath() {
    return (this.data.case as any).decedentDateOfDeath
      ? this.formatDate((this.data.case as any).decedentDateOfDeath)
      : "Not provided";
  }
}
