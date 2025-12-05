import type { TemplateUsageViewModel } from '../view-models/template-analytics-view-model';

interface MostUsedTemplatesProps {
  templates: TemplateUsageViewModel[];
}

export function MostUsedTemplates({ templates }: MostUsedTemplatesProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Most Used Templates</h2>
      <div className="space-y-3">
        {templates.map((template) => (
          <div key={template.businessKey} className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold">
              {template.rank}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {template.name}
              </p>
              <p className="text-xs text-gray-500">{template.category}</p>
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {template.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
