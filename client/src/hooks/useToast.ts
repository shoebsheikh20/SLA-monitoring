import { useState, useCallback } from 'react';
import { Toast } from '../types';

let toastIdCounter = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (
      type: Toast['type'],
      title: string,
      message?: string,
      duration: number = 4000
    ) => {
      const id = String(++toastIdCounter);
      const toast: Toast = { id, type, title, message };
      setToasts((prev) => [...prev, toast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);

      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (title: string, message?: string) => addToast('success', title, message),
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string) => addToast('error', title, message),
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => addToast('warning', title, message),
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string) => addToast('info', title, message),
    [addToast]
  );

  return { toasts, addToast, removeToast, success, error, warning, info };
};

export default useToast;
