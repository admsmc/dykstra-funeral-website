"use client";

import { trpc } from "@/lib/trpc-client";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Copy,
  Star,
  FileText,
  Eye,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { contractTemplateSchema, CONTRACT_SERVICE_TYPES, type ContractTemplateForm } from "@dykstra/domain/validation";
import { Form } from "@dykstra/ui";
import { FormInput, FormTextarea, FormSelect, FormCheckbox } from "@dykstra/ui";

/**
 * Contract Templates Management
 * 
 * List, create, edit, delete contract templates
 * Set default templates per service type
 * Version control display
 */

type ServiceType = 
  | 'TRADITIONAL_BURIAL'
  | 'TRADITIONAL_CREMATION'
  | 'MEMORIAL_SERVICE'
  | 'DIRECT_BURIAL'
  | 'DIRECT_CREMATION'
  | 'CELEBRATION_OF_LIFE';

export default function ContractTemplatesPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch templates
  const { data: templates, isLoading, refetch } = trpc.contract.getTemplates.useQuery({
    serviceType: serviceTypeFilter !== 'all' ? serviceTypeFilter as any : undefined,
    activeOnly: false,
  });

  // Delete mutation
  const deleteMutation = trpc.contract.deleteTemplate.useMutation({
    onSuccess: () => {
      toast.success('Template deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete template');
    },
  });

  // Update mutation
  const updateMutation = trpc.contract.updateTemplate.useMutation({
    onSuccess: () => {
      toast.success('Template updated successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update template');
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSetDefault = (id: string, serviceType: ServiceType) => {
    updateMutation.mutate({
      id,
      isDefault: true,
    });
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    updateMutation.mutate({
      id,
      isActive: !currentStatus,
    });
  };

  // Filter templates by search
  const filteredTemplates = templates?.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const serviceTypes = [
    { value: 'all', label: 'All Service Types' },
    { value: 'TRADITIONAL_BURIAL', label: 'Traditional Burial' },
    { value: 'TRADITIONAL_CREMATION', label: 'Traditional Cremation' },
    { value: 'MEMORIAL_SERVICE', label: 'Memorial Service' },
    { value: 'DIRECT_BURIAL', label: 'Direct Burial' },
    { value: 'DIRECT_CREMATION', label: 'Direct Cremation' },
    { value: 'CELEBRATION_OF_LIFE', label: 'Celebration of Life' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/staff/contracts"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contracts
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contract Templates</h1>
            <p className="text-gray-600 mt-1">
              Manage contract templates with variable substitution
            </p>
          </div>
          
          {!isCreating && !editingTemplate && (
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition"
            >
              <Plus className="w-4 h-4" />
              New Template
            </button>
          )}
        </div>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingTemplate) && (
        <TemplateForm
          templateId={editingTemplate}
          onSuccess={() => {
            setIsCreating(false);
            setEditingTemplate(null);
            refetch();
          }}
          onCancel={() => {
            setIsCreating(false);
            setEditingTemplate(null);
          }}
        />
      )}

      {/* Filters */}
      {!isCreating && !editingTemplate && (
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
            />
          </div>
          <select
            value={serviceTypeFilter}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setServiceTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
          >
            {serviceTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Templates List */}
      {!isCreating && !editingTemplate && (
        <div className="bg-white rounded-lg border border-gray-200">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading templates...</div>
          ) : filteredTemplates && filteredTemplates.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-6 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {template.name}
                        </h3>
                        {template.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            <Star className="w-3 h-3 fill-current" />
                            Default
                          </span>
                        )}
                        {!template.isActive && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            Inactive
                          </span>
                        )}
                      </div>
                      
                      {template.description && (
                        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          Service Type:{' '}
                          <span className="font-medium">
                            {template.serviceType?.replace(/_/g, ' ') || 'Universal'}
                          </span>
                        </span>
                        <span>•</span>
                        <span>Version: {template.version}</span>
                        <span>•</span>
                        <span>
                          Created by: {template.creator.name}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(template.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {template.variables && Array.isArray(template.variables) && template.variables.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-600 mb-2">Variables:</p>
                          <div className="flex flex-wrap gap-2">
                            {(template.variables as string[]).map((variable, index) => (
                              <code
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono"
                              >
                                {`{{${variable}}}`}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-6">
                      {template.serviceType && !template.isDefault && template.isActive && (
                        <button
                          onClick={() => handleSetDefault(template.id, template.serviceType!)}
                          disabled={updateMutation.isLoading}
                          className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition disabled:opacity-50"
                          title="Set as default"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleToggleActive(template.id, template.isActive)}
                        disabled={updateMutation.isLoading}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition disabled:opacity-50 ${
                          template.isActive
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {template.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      
                      <button
                        onClick={() => setEditingTemplate(template.id)}
                        className="p-2 text-gray-600 hover:text-[--navy] hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(template.id, template.name)}
                        disabled={deleteMutation.isLoading}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="font-medium">No Templates Found</p>
              <p className="text-sm mt-1">
                {searchQuery || serviceTypeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first contract template'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TemplateForm({
  templateId,
  onSuccess,
  onCancel,
}: {
  templateId: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [newVariable, setNewVariable] = useState('');

  // Initialize form with react-hook-form + domain validation
  const form = useForm<ContractTemplateForm>({
    resolver: zodResolver(contractTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
      serviceType: '',
      content: '',
      variables: [],
      isDefault: false,
    },
  });

  // Array field for variables
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variables",
  });

  // Watch serviceType and content for conditional rendering
  const serviceType = form.watch("serviceType");
  const content = form.watch("content");

  // Fetch existing template if editing
  const { data: existingTemplate } = trpc.contract.getTemplates.useQuery(
    { activeOnly: false },
    {
      enabled: !!templateId,
      onSuccess: (templates) => {
        const template = templates.find((t) => t.id === templateId);
        if (template) {
          form.reset({
            name: template.name,
            description: template.description || '',
            serviceType: template.serviceType || '',
            content: template.content,
            variables: (template.variables as string[]) || [],
            isDefault: template.isDefault,
          });
        }
      },
    }
  );

  // Save mutation
  const saveMutation = trpc.contract.saveTemplate.useMutation({
    onSuccess: () => {
      toast.success(templateId ? 'Template updated successfully' : 'Template created successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save template');
    },
  });

  // Update mutation (for editing)
  const updateMutation = trpc.contract.updateTemplate.useMutation({
    onSuccess: () => {
      toast.success('Template updated successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update template');
    },
  });

  // Handle form submission (validation automatic via react-hook-form)
  const onSubmit = form.handleSubmit((data) => {
    if (templateId) {
      updateMutation.mutate({
        id: templateId,
        name: data.name,
        description: data.description,
        content: data.content,
        variables: data.variables,
        isDefault: data.isDefault,
      });
    } else {
      saveMutation.mutate({
        name: data.name,
        description: data.description,
        serviceType: data.serviceType || undefined,
        content: data.content,
        variables: data.variables,
        isDefault: data.isDefault,
      });
    }
  });

  const addVariable = () => {
    const trimmed = newVariable.trim();
    if (trimmed && !fields.some(f => f.value === trimmed)) {
      append(trimmed);
      setNewVariable('');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            {templateId ? 'Edit Template' : 'Create New Template'}
          </h2>
          <p className="text-sm text-gray-600">
            Create reusable contract templates with variable substitution
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            name="name"
            label="Template Name"
            placeholder="e.g., Standard Traditional Burial Contract"
            required
          />

          <FormSelect
            name="serviceType"
            label="Service Type"
            placeholder="Universal (All Types)"
            options={[
              { value: '', label: 'Universal (All Types)' },
              ...CONTRACT_SERVICE_TYPES.map(type => ({
                value: type,
                label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              }))
            ]}
          />
        </div>

        <FormInput
          name="description"
          label="Description"
          placeholder="Brief description of this template"
        />

        {/* Variables */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Variables
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newVariable}
              onChange={(e) => setNewVariable(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
              placeholder="e.g., decedentName, serviceDate, totalAmount"
            />
            <button
              type="button"
              onClick={addVariable}
              className="px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition"
            >
              Add
            </button>
          </div>
          {fields.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg"
                >
                  <code className="text-sm font-mono">{`{{${field.value}}}`}</code>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Template Content */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Template Content *
            </label>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center gap-2 text-sm text-[--navy] hover:underline"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Edit' : 'Preview'}
            </button>
          </div>

          {showPreview ? (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-[300px]">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {content}
              </div>
            </div>
          ) : (
            <FormTextarea
              name="content"
              label=""
              rows={16}
              placeholder="Enter contract template content. Use {{variableName}} for variable substitution."
              className="font-mono text-sm resize-none"
              required
            />
          )}
        </div>

        {/* Checkbox */}
        {serviceType && (
          <FormCheckbox
            name="isDefault"
            label={`Set as default template for ${serviceType.replace(/_/g, ' ').toLowerCase()}`}
          />
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={saveMutation.isLoading || updateMutation.isLoading}
            className="px-6 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveMutation.isLoading || updateMutation.isLoading ? 'Saving...' : templateId ? 'Update Template' : 'Create Template'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </Form>
  );
}
