/**
 * Contract Builder Feature - Type Definitions
 */

export type ServiceType = 
  | 'TRADITIONAL_BURIAL'
  | 'TRADITIONAL_CREMATION'
  | 'MEMORIAL_SERVICE'
  | 'DIRECT_BURIAL'
  | 'DIRECT_CREMATION'
  | 'CELEBRATION_OF_LIFE';

export interface ContractBuilderState {
  step: number;
  caseId: string;
  serviceType: ServiceType | null;
  selectedServices: SelectedItem[];
  selectedProducts: SelectedItem[];
  termsAndConditions: string;
}

export interface SelectedItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface ServiceTypeOption {
  type: ServiceType;
  name: string;
  description: string;
  basePrice: number;
  icon: string;
  features: string[];
}

export interface StepConfig {
  number: number;
  label: string;
  icon: any; // Lucide icon component
}
