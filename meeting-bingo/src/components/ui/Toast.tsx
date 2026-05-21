import { useCallback, useEffect, useState } from 'react';
import type { ToastItem, ToastVariant } from '../../types';
import { cn } from '../../lib/utils';

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 2500;

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const variantClasses: Record<ToastItem['variant'], string> = {
  success: 'bg-green-500 text-white',
  info: 'bg-blue-500 text-white',
  warning: 'bg-amber-500 text-white',
};

function ToastView({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const t = window.setTimeout(
      () => onDismiss(toast.id),
      toast.duration ?? DEFAULT_DURATION,
    );
    return () => window.clearTimeout(t);
  }, [toast, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-auto w-72 max-w-[90vw] rounded-lg px-4 py-3 shadow-lg animate-bounce-in',
        variantClasses[toast.variant],
      )}
    >
      <p className="text-sm font-medium leading-snug">{toast.message}</p>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  const visible = toasts.slice(-MAX_VISIBLE).reverse();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
      {visible.map((toast) => (
        <ToastView key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, message, variant }].slice(-MAX_VISIBLE));
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clear = useCallback(() => setToasts([]), []);

  return { toasts, push, dismiss, clear };
}
