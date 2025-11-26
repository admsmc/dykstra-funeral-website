"use client";

import { trpc } from "@/lib/trpc-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  DollarSign,
  Package,
  ChevronRight,
  Plus,
  Minus,
  Search,
  Filter,
  ShoppingCart,
  Download,
  Save,
  Send,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Contract Builder - Multi-Step Wizard
 * 
 * Step 1: Service Selection
 * Step 2: Products & Services
 * Step 3: Review & Generate
 */

type ServiceType = 
  | 'TRADITIONAL_BURIAL'
  | 'TRADITIONAL_CREMATION'
  | 'MEMORIAL_SERVICE'
  | 'DIRECT_BURIAL'
  | 'DIRECT_CREMATION'
  | 'CELEBRATION_OF_LIFE';

type ContractBuilderState = {
  step: number;
  caseId: string;
  serviceType: ServiceType | null;
  selectedServices: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  selectedProducts: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  termsAndConditions: string;
};

export default function ContractBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseId = searchParams.get('caseId');

  const [state, setState] = useState<ContractBuilderState>({
    step: 1,
    caseId: caseId || '',
    serviceType: null,
    selectedServices: [],
    selectedProducts: [],
    termsAndConditions: '',
  });

  if (!caseId) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-medium">Missing Case ID</p>
          <p className="text-sm mt-1">Please select a case before creating a contract.</p>
          <Link href="/staff/cases" className="text-sm text-red-600 hover:underline mt-2 inline-block">
            Go to Cases
          </Link>
        </div>
      </div>
    );
  }

  const updateState = (updates: Partial<ContractBuilderState>) => {
    setState((prev) => ({ ...prev, ...updates }));
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

  const steps = [
    { number: 1, label: 'Service Type', icon: FileText },
    { number: 2, label: 'Products & Services', icon: Package },
    { number: 3, label: 'Review & Generate', icon: Check },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/staff/cases/${caseId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Case
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contract Builder</h1>
            <p className="text-gray-600 mt-1">
              Create a new contract for this case
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = state.step === step.number;
            const isCompleted = state.step > step.number;
            
            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex items-center flex-1">
                  {/* Step Circle */}
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition ${
                      isCompleted
                        ? 'bg-green-100 border-green-600 text-green-600'
                        : isActive
                        ? 'bg-[--navy] border-[--navy] text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  
                  {/* Step Label */}
                  <div className="ml-3">
                    <p
                      className={`text-sm font-medium ${
                        isActive ? 'text-[--navy]' : isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      Step {step.number}
                    </p>
                    <p
                      className={`text-xs ${
                        isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-4 ${
                      state.step > step.number ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        {state.step === 1 && (
          <ServiceSelectionStep
            selectedServiceType={state.serviceType}
            onSelectServiceType={(serviceType) => updateState({ serviceType })}
            onNext={nextStep}
          />
        )}
        
        {state.step === 2 && (
          <ProductServicesStep
            state={state}
            updateState={updateState}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        
        {state.step === 3 && (
          <ReviewGenerateStep
            state={state}
            updateState={updateState}
            onPrev={prevStep}
          />
        )}
      </div>
    </div>
  );
}

function ServiceSelectionStep({
  selectedServiceType,
  onSelectServiceType,
  onNext,
}: {
  selectedServiceType: ServiceType | null;
  onSelectServiceType: (type: ServiceType) => void;
  onNext: () => void;
}) {
  const serviceTypes = [
    {
      type: 'TRADITIONAL_BURIAL' as ServiceType,
      name: 'Traditional Burial',
      description: 'Full service funeral with viewing, ceremony, and burial. Includes embalming, casket selection, and cemetery arrangements.',
      basePrice: 8500,
      icon: '⚰️',
      features: [
        'Embalming and preparation',
        'Viewing and visitation',
        'Funeral ceremony',
        'Casket selection',
        'Cemetery services',
        'Memorial cards',
      ],
    },
    {
      type: 'TRADITIONAL_CREMATION' as ServiceType,
      name: 'Traditional Cremation',
      description: 'Full service funeral with viewing and ceremony followed by cremation. Includes embalming, ceremony, and urn selection.',
      basePrice: 6500,
      icon: '🕯️',
      features: [
        'Embalming and preparation',
        'Viewing and visitation',
        'Funeral ceremony',
        'Cremation services',
        'Urn selection',
        'Memorial cards',
      ],
    },
    {
      type: 'MEMORIAL_SERVICE' as ServiceType,
      name: 'Memorial Service',
      description: 'Ceremony without the body present, typically after cremation or burial has occurred. Focus on celebration of life.',
      basePrice: 3500,
      icon: '🌸',
      features: [
        'Memorial ceremony',
        'Photo displays',
        'Guest book',
        'Memorial cards',
        'Reception coordination',
      ],
    },
    {
      type: 'DIRECT_BURIAL' as ServiceType,
      name: 'Direct Burial',
      description: 'Simple burial service without viewing or ceremony. Cost-effective option with immediate interment.',
      basePrice: 3000,
      icon: '🪦',
      features: [
        'Basic services',
        'Transportation',
        'Simple casket',
        'Cemetery coordination',
        'Death certificates',
      ],
    },
    {
      type: 'DIRECT_CREMATION' as ServiceType,
      name: 'Direct Cremation',
      description: 'Simple cremation without viewing or ceremony. Most cost-effective option with immediate cremation.',
      basePrice: 2500,
      icon: '🔥',
      features: [
        'Basic services',
        'Transportation',
        'Cremation container',
        'Cremation services',
        'Basic urn',
        'Death certificates',
      ],
    },
    {
      type: 'CELEBRATION_OF_LIFE' as ServiceType,
      name: 'Celebration of Life',
      description: 'Personalized memorial service focused on celebrating the unique life and legacy of your loved one.',
      basePrice: 4000,
      icon: '🎉',
      features: [
        'Personalized ceremony',
        'Venue coordination',
        'Photo/video displays',
        'Memorial keepsakes',
        'Reception planning',
        'Memory sharing',
      ],
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Select Service Type</h2>
        <p className="text-gray-600 mt-1">
          Choose the type of service that best fits your needs. You can customize products and services in the next step.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {serviceTypes.map((service) => {
          const isSelected = selectedServiceType === service.type;
          
          return (
            <button
              key={service.type}
              onClick={() => onSelectServiceType(service.type)}
              className={`text-left p-6 rounded-lg border-2 transition hover:shadow-md ${
                isSelected
                  ? 'border-[--navy] bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{service.icon}</div>
                {isSelected && (
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[--navy] text-white">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Title & Price */}
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {service.name}
              </h3>
              <div className="flex items-center gap-1 text-[--navy] font-semibold mb-3">
                <DollarSign className="w-4 h-4" />
                <span>{service.basePrice.toLocaleString()}</span>
                <span className="text-xs text-gray-500 font-normal">starting at</span>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4">
                {service.description}
              </p>

              {/* Features */}
              <div className="space-y-1">
                {service.features.slice(0, 3).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                    <span>{feature}</span>
                  </div>
                ))}
                {service.features.length > 3 && (
                  <p className="text-xs text-gray-500 mt-1">
                    +{service.features.length - 3} more services
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div></div>
        <button
          onClick={onNext}
          disabled={!selectedServiceType}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Step 2: Products & Services Selection
function ProductServicesStep({
  state,
  updateState,
  onNext,
  onPrev,
}: {
  state: ContractBuilderState;
  updateState: (updates: Partial<ContractBuilderState>) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');
  const [productCategory, setProductCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch catalogs
  const { data: servicesData } = trpc.contract.getServiceCatalog.useQuery({
    serviceType: state.serviceType!,
    availableOnly: true,
  });

  const { data: productsData } = trpc.contract.getProductCatalog.useQuery({
    category: productCategory !== 'all' ? productCategory as any : undefined,
    search: searchQuery || undefined,
    availableOnly: true,
  });

  // Calculate totals
  const servicesSubtotal = state.selectedServices.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const productsSubtotal = state.selectedProducts.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const subtotal = servicesSubtotal + productsSubtotal;
  const tax = subtotal * 0.06; // 6% tax
  const total = subtotal + tax;

  const addService = (service: any) => {
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
          {
            id: service.id,
            name: service.name,
            quantity: 1,
            price: Number(service.price),
          },
        ],
      });
    }
  };

  const addProduct = (product: any) => {
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
          {
            id: product.id,
            name: product.name,
            quantity: 1,
            price: Number(product.price),
          },
        ],
      });
    }
  };

  const updateQuantity = (id: string, type: 'service' | 'product', delta: number) => {
    if (type === 'service') {
      updateState({
        selectedServices: state.selectedServices
          .map((s) => (s.id === id ? { ...s, quantity: Math.max(0, s.quantity + delta) } : s))
          .filter((s) => s.quantity > 0),
      });
    } else {
      updateState({
        selectedProducts: state.selectedProducts
          .map((p) => (p.id === id ? { ...p, quantity: Math.max(0, p.quantity + delta) } : p))
          .filter((p) => p.quantity > 0),
      });
    }
  };

  const productCategories = [
    { value: 'all', label: 'All Products' },
    { value: 'CASKET', label: 'Caskets' },
    { value: 'URN', label: 'Urns' },
    { value: 'VAULT', label: 'Vaults' },
    { value: 'FLOWERS', label: 'Flowers' },
    { value: 'MEMORIAL_CARDS', label: 'Memorial Cards' },
    { value: 'GUEST_BOOK', label: 'Guest Books' },
    { value: 'JEWELRY', label: 'Jewelry' },
    { value: 'KEEPSAKE', label: 'Keepsakes' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Select Products & Services</h2>
        <p className="text-gray-600 mt-1">
          Customize your {state.serviceType?.replace(/_/g, ' ').toLowerCase()} package
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Catalog */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('services')}
              className={`px-4 py-2 border-b-2 font-medium text-sm transition ${
                activeTab === 'services'
                  ? 'border-[--navy] text-[--navy]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Services
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 border-b-2 font-medium text-sm transition ${
                activeTab === 'products'
                  ? 'border-[--navy] text-[--navy]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Products
            </button>
          </div>

          {/* Filters */}
          {activeTab === 'products' && (
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                />
              </div>
              <select
                value={productCategory}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setProductCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
              >
                {productCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Services List */}
          {activeTab === 'services' && (
            <div className="space-y-3">
              {servicesData && servicesData.length > 0 ? (
                servicesData.map((service: any) => {
                  const selected = state.selectedServices.find((s) => s.id === service.id);
                  return (
                    <div
                      key={service.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{service.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-lg font-semibold text-[--navy]">
                              ${Number(service.price).toFixed(2)}
                            </span>
                            {service.isRequired && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                Required
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => addService(service)}
                          disabled={service.isRequired && selected !== undefined}
                          className="px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {selected ? 'Added' : 'Add'}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No services available</p>
                </div>
              )}
            </div>
          )}

          {/* Products Grid */}
          {activeTab === 'products' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productsData && productsData.length > 0 ? (
                productsData.map((product: any) => {
                  const selected = state.selectedProducts.find((p) => p.id === product.id);
                  return (
                    <div
                      key={product.id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
                    >
                      {product.imageUrl && (
                        <div className="h-48 bg-gray-100 flex items-center justify-center">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900">{product.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">{product.category.replace(/_/g, ' ')}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-lg font-semibold text-[--navy]">
                            ${Number(product.price).toFixed(2)}
                          </span>
                          <button
                            onClick={() => addProduct(product)}
                            className="px-3 py-1.5 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition text-sm"
                          >
                            {selected ? 'Added' : 'Add'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No products found</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Cart & Calculator */}
        <div className="space-y-4">
          {/* Cart */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Selected Items</h3>
            </div>

            {/* Services */}
            {state.selectedServices.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-600 mb-2">SERVICES</p>
                <div className="space-y-2">
                  {state.selectedServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <p className="text-xs text-gray-500">
                          ${service.price.toFixed(2)} × {service.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(service.id, 'service', -1)}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center">{service.quantity}</span>
                        <button
                          onClick={() => updateQuantity(service.id, 'service', 1)}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products */}
            {state.selectedProducts.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-600 mb-2">PRODUCTS</p>
                <div className="space-y-2">
                  {state.selectedProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">
                          ${product.price.toFixed(2)} × {product.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(product.id, 'product', -1)}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center">{product.quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, 'product', 1)}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {state.selectedServices.length === 0 && state.selectedProducts.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No items selected</p>
            )}

            {/* Totals */}
            <div className="border-t border-gray-300 pt-4 mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tax (6%):</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold border-t border-gray-300 pt-2">
                <span>Total:</span>
                <span className="text-[--navy]">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={state.selectedServices.length === 0 && state.selectedProducts.length === 0}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Review
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Step 3: Review & Generate Contract
function ReviewGenerateStep({
  state,
  updateState,
  onPrev,
}: {
  state: ContractBuilderState;
  updateState: (updates: Partial<ContractBuilderState>) => void;
  onPrev: () => void;
}) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Calculate totals
  const servicesSubtotal = state.selectedServices.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const productsSubtotal = state.selectedProducts.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const subtotal = servicesSubtotal + productsSubtotal;
  const tax = subtotal * 0.06;
  const total = subtotal + tax;

  // Fetch case data for contract
  const { data: caseData } = trpc.case.getDetails.useQuery({ caseId: state.caseId });

  // Fetch default template
  const { data: templateData } = trpc.contract.getDefaultTemplate.useQuery(
    { serviceType: state.serviceType! },
    { enabled: !!state.serviceType }
  );

  // Create contract mutation
  const createContractMutation = trpc.contract.createContract.useMutation({
    onSuccess: (contract) => {
      toast.success('Contract created successfully!');
      router.push(`/staff/cases/${state.caseId}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create contract');
      setIsGenerating(false);
    },
  });

  const handleGenerateContract = async (status: 'DRAFT' | 'PENDING_REVIEW') => {
    if (!state.termsAndConditions.trim()) {
      toast.error('Please add terms and conditions');
      return;
    }

    setIsGenerating(true);

    createContractMutation.mutate({
      caseId: state.caseId,
      services: state.selectedServices,
      products: state.selectedProducts,
      subtotal,
      tax,
      totalAmount: total,
      termsAndConditions: state.termsAndConditions,
      status,
    });
  };

  // Initialize default terms from template
  useState(() => {
    if (templateData && !state.termsAndConditions) {
      updateState({ termsAndConditions: templateData.content });
    }
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Review & Generate Contract</h2>
        <p className="text-gray-600 mt-1">
          Review all details and generate the contract
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contract Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Case Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Decedent Name</p>
                <p className="font-medium text-gray-900">{caseData?.case.decedentName || 'Loading...'}</p>
              </div>
              <div>
                <p className="text-gray-600">Service Type</p>
                <p className="font-medium text-gray-900">
                  {state.serviceType?.replace(/_/g, ' ') || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Case Number</p>
                <p className="font-medium text-gray-900">#{state.caseId.slice(0, 8)}</p>
              </div>
              <div>
                <p className="text-gray-600">Date</p>
                <p className="font-medium text-gray-900">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Selected Services */}
          {state.selectedServices.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Services</h3>
              <div className="space-y-3">
                {state.selectedServices.map((service) => (
                  <div key={service.id} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-500">Quantity: {service.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${(service.price * service.quantity).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        ${service.price.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Products */}
          {state.selectedProducts.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Products</h3>
              <div className="space-y-3">
                {state.selectedProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">Quantity: {product.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${(product.price * product.quantity).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        ${product.price.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Terms and Conditions Editor */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Terms and Conditions</h3>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center gap-2 text-sm text-[--navy] hover:underline"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Edit' : 'Preview'}
              </button>
            </div>

            {showPreview ? (
              <div className="prose prose-sm max-w-none bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="whitespace-pre-wrap">{state.termsAndConditions}</div>
              </div>
            ) : (
              <textarea
                value={state.termsAndConditions}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => updateState({ termsAndConditions: e.target.value })}
                placeholder="Enter contract terms and conditions..."
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent resize-none font-mono text-sm"
              />
            )}

            {templateData && !state.termsAndConditions && (
              <button
                onClick={() => updateState({ termsAndConditions: templateData.content })}
                className="mt-3 text-sm text-[--navy] hover:underline"
              >
                Load default template
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Summary & Actions */}
        <div className="space-y-4">
          {/* Price Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 sticky top-4">
            <h3 className="font-semibold text-gray-900 mb-4">Contract Summary</h3>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Services Subtotal:</span>
                <span className="font-medium">${servicesSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Products Subtotal:</span>
                <span className="font-medium">${productsSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-gray-300 pt-3">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tax (6%):</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold border-t border-gray-300 pt-3">
                <span>Total:</span>
                <span className="text-[--navy]">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Item Counts */}
            <div className="bg-white rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Services:</span>
                <span className="font-medium">{state.selectedServices.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Products:</span>
                <span className="font-medium">{state.selectedProducts.length}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => handleGenerateContract('DRAFT')}
                disabled={isGenerating || !state.termsAndConditions.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Save as Draft
              </button>

              <button
                onClick={() => handleGenerateContract('PENDING_REVIEW')}
                disabled={isGenerating || !state.termsAndConditions.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Generate Contract
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Contract will be saved to the case for review and signing
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
        <button
          onClick={onPrev}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="text-sm text-gray-500">
          Review all information before generating
        </div>
      </div>
    </div>
  );
}
