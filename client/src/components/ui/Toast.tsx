import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Toast } from '../../types';

const iconMap = {
  success: <CheckCircle size={18} className="text-success flex-shrink-0" />,
  error: <XCircle size={18} className="text-critical flex-shrink-0" />,
  warning: <AlertTriangle size={18} className="text-warning flex-shrink-0" />,
  info: <Info size={18} className="text-iris-bright flex-shrink-0" />,
};

const borderMap = {
  success: 'border-success/30',
  error: 'border-critical/30',
  warning: 'border-warning/30',
  info: 'border-iris/30',
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  return (
    <div className={`toast ${borderMap[toast.type]}`} role="alert">
      {iconMap[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-text-muted mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-text-muted hover:text-text-primary flex-shrink-0 ml-1 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}
