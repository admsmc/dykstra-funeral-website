import { useState } from "react";
import { ContractBuilderViewModel } from "../view-models/ContractBuilderViewModel";
import type { ContractBuilderState, ServiceType, SelectedItem } from "../types";

export function useContractBuilder(caseId: string) {
  const [state, setState] = useState<ContractBuilderState>({
    step: 1,
    caseId,
    serviceType: null,
    selectedServices: [],
    selectedProducts: [],
    termsAndConditions: '',
  });

  const viewModel = new ContractBuilderViewModel(state);

  const updateState = (updates: Partial<ContractBuilderState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const setServiceType = (serviceType: ServiceType) => {
    updateState({ serviceType });
  };

  const nextStep = () => {
    if (state.step < 3) {
      updateState({ step: state.step + 1 });
    }
  };

  const prevStep = () => {
    if (state.step > 1) {
      updateState({ step: state.step - 1 });
    }
  };

  const addService = (service: { id: string; name: string; price: number }) => {
    const existing = state.selectedServices.find((s) => s.id === service.id);
    if (existing) {
      updateState({
        selectedServices: state.selectedServices.map((s) =>
          s.id === service.id ? { ...s, quantity: s.quantity + 1 } : s
        ),
      });
    } else {
      updateState({
        selectedServices: [
          ...state.selectedServices,
          { ...service, quantity: 1 },
        ],
      });
    }
  };

  const addProduct = (product: { id: string; name: string; price: number }) => {
    const existing = state.selectedProducts.find((p) => p.id === product.id);
    if (existing) {
      updateState({
        selectedProducts: state.selectedProducts.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        ),
      });
    } else {
      updateState({
        selectedProducts: [
          ...state.selectedProducts,
          { ...product, quantity: 1 },
        ],
      });
    }
  };

  const updateQuantity = (id: string, type: 'service' | 'product', delta: number) => {
    if (type === 'service') {
      updateState({
        selectedServices: state.selectedServices
          .map((s) =>
            s.id === id ? { ...s, quantity: Math.max(0, s.quantity + delta) } : s
          )
          .filter((s) => s.quantity > 0),
      });
    } else {
      updateState({
        selectedProducts: state.selectedProducts
          .map((p) =>
            p.id === id ? { ...p, quantity: Math.max(0, p.quantity + delta) } : p
          )
          .filter((p) => p.quantity > 0),
      });
    }
  };

  const removeItem = (id: string, type: 'service' | 'product') => {
    if (type === 'service') {
      updateState({
        selectedServices: state.selectedServices.filter((s) => s.id !== id),
      });
    } else {
      updateState({
        selectedProducts: state.selectedProducts.filter((p) => p.id !== id),
      });
    }
  };

  return {
    state,
    viewModel,
    setServiceType,
    nextStep,
    prevStep,
    addService,
    addProduct,
    updateQuantity,
    removeItem,
  };
}
