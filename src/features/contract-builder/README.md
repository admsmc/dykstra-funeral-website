# Contract Builder Feature

**Purpose**: Multi-step wizard for creating funeral service contracts with service type selection, product/service catalog, and contract generation.

## Structure

```
contract-builder/
├── components/         # 5 components (header, progress, 3 step components)
├── hooks/             # 2 custom hooks (wizard state, catalog data)
├── view-models/       # ContractBuilderViewModel for calculations
├── constants/         # Service type options (6 service types)
├── types/             # ServiceType, ContractBuilderState, SelectedItem
└── index.ts           # Public API
```

## Components

- **ContractBuilderHeader** - Page header with back link
- **ProgressSteps** - 3-step progress indicator with icons
- **ServiceSelectionStep** - 6 service type cards with selection (Traditional Burial, Cremation, etc.)
- **ProductServicesStep** - Product/service catalog with shopping cart (simplified)
- **ReviewGenerateStep** - Summary review with pricing breakdown and contract generation

## Hooks

- **useContractBuilder** - Main wizard state management with actions
  - State updates: `setServiceType`, `nextStep`, `prevStep`
  - Item management: `addService`, `addProduct`, `updateQuantity`, `removeItem`
  - Returns ViewModel for formatted financial values
- **useCatalogs** - Product/service catalog data fetching
  - Separate queries for services and products
  - Loading states for each catalog

## ViewModels

- **ContractBuilderViewModel** - Financial calculations and validations
  - Computed properties: `servicesSubtotal`, `productsSubtotal`, `subtotal`, `tax`, `total`
  - Formatted values: `formattedSubtotal`, `formattedTax`, `formattedTotal`
  - Validation: `canProceedFromStep1`, `canProceedFromStep2`, `totalItemCount`

## Constants

- **SERVICE_TYPE_OPTIONS** - 6 service type configurations
  - Traditional Burial ($8,500), Traditional Cremation ($6,500), Memorial Service ($3,500)
  - Direct Burial ($3,000), Direct Cremation ($2,500), Celebration of Life ($4,000)
  - Each with name, description, base price, icon, and features list

## Usage

```typescript
import { useContractBuilder, ContractBuilderHeader, ProgressSteps } from '@/features/contract-builder';

export default function ContractBuilderPage() {
  const { state, viewModel, setServiceType, nextStep, prevStep } = useContractBuilder(caseId);
  
  return (
    <>
      <ContractBuilderHeader caseId={caseId} />
      <ProgressSteps steps={steps} currentStep={viewModel.currentStep} />
      {/* Step components */}
    </>
  );
}
```

## Page Reduction
- **Before**: 1,101 lines (3-step wizard in one file)
- **After**: 90 lines (orchestrating page)
- **Reduction**: 91.8% (highest reduction in Phase 2!)

## Key Features
- 3-step wizard: Service Selection → Products & Services → Review & Generate
- 6 pre-configured service types with pricing
- Product/service catalog integration
- Real-time price calculation with tax (6%)
- Contract PDF generation
- Step validation before proceeding
