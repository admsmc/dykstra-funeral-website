import { useEffect, memo } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
  onDismiss: (id: string) => void;
}

const variantConfig = {
  success: {
    bg: 'bg-green-50 border-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-600',
    textColor: 'text-green-900',
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: AlertCircle,
    iconColor: 'text-red-600',
    textColor: 'text-red-900',
  },
  warning: {
    bg: 'bg-yellow-50 border-yellow-200',
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
    textColor: 'text-yellow-900',
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: Info,
    iconColor: 'text-blue-600',
    textColor: 'text-blue-900',
  },
};

export const Toast = memo(function Toast({ id, message, variant, duration = 5000, onDismiss }: ToastProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  return (
    <div
      className={`${config.bg} border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-slide-in-right`}
      role="alert"
      onMouseEnter={(e) => {
        // Pause auto-dismiss on hover by stopping the timer
        e.currentTarget.style.animationPlayState = 'paused';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.animationPlayState = 'running';
      }}
    >
      <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
      <p className={`text-sm font-medium ${config.textColor} flex-1`}>{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className={`${config.iconColor} hover:opacity-70 transition flex-shrink-0`}
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
});
