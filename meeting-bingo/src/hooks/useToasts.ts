import { useCallback, useState } from 'react';
import type { ToastItem, ToastVariant } from '../types';

const MAX_VISIBLE = 3;

/** Manages a capped queue of toast notifications (max 3 visible). Provides push, dismiss, and clear. */
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
