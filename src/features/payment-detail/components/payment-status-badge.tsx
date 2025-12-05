import type { LucideIcon } from 'lucide-react';

interface PaymentStatusBadgeProps {
  status: string;
  config: {
    bg: string;
    text: string;
    icon: LucideIcon;
  };
}

export function PaymentStatusBadge({ status, config }: PaymentStatusBadgeProps) {
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
    >
      <Icon className="w-4 h-4" />
      {status.toUpperCase()}
    </span>
  );
}
