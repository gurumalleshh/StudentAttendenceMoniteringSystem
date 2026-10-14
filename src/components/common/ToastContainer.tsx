import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        let border = 'border-slate-200 dark:border-slate-800';
        let icon = <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />;

        if (toast.type === 'success') {
          border = 'border-emerald-500/30';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
        } else if (toast.type === 'warning') {
          border = 'border-amber-500/40';
          icon = <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
        } else if (toast.type === 'error') {
          border = 'border-rose-500/40';
          icon = <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 bg-white dark:bg-slate-900 border ${border} rounded-xl shadow-xl shadow-slate-950/10 dark:shadow-slate-950/40 animate-slide-up transition-all`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {toast.title}
              </h4>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 -mr-1 -mt-1 rounded-lg"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
