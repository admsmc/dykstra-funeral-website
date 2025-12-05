import { BaseViewModel } from "@/lib/view-models/base-view-model";
import type { ContractBuilderState } from "../types";

export class ContractBuilderViewModel extends BaseViewModel {
  constructor(private state: ContractBuilderState) {
    super();
  }

  get currentStep() {
    return this.state.step;
  }

  get caseId() {
    return this.state.caseId;
  }

  get serviceType() {
    return this.state.serviceType;
  }

  get selectedServices() {
    return this.state.selectedServices;
  }

  get selectedProducts() {
    return this.state.selectedProducts;
  }

  // Financial calculations
  get servicesSubtotal() {
    return this.state.selectedServices.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  get productsSubtotal() {
    return this.state.selectedProducts.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  get subtotal() {
    return this.servicesSubtotal + this.productsSubtotal;
  }

  get tax() {
    return this.subtotal * 0.06; // 6% tax
  }

  get total() {
    return this.subtotal + this.tax;
  }

  // Formatted values
  get formattedSubtotal() {
    return this.formatCurrency(this.subtotal);
  }

  get formattedTax() {
    return this.formatCurrency(this.tax);
  }

  get formattedTotal() {
    return this.formatCurrency(this.total);
  }

  get formattedServicesSubtotal() {
    return this.formatCurrency(this.servicesSubtotal);
  }

  get formattedProductsSubtotal() {
    return this.formatCurrency(this.productsSubtotal);
  }

  // Step validation
  get canProceedFromStep1() {
    return this.state.serviceType !== null;
  }

  get canProceedFromStep2() {
    return this.state.selectedServices.length > 0 || this.state.selectedProducts.length > 0;
  }

  get totalItemCount() {
    return this.state.selectedServices.length + this.state.selectedProducts.length;
  }
}
