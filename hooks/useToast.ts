import { useState } from 'react';

interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  });

  const show = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ visible: true, message, type });
  };

  const hide = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const success = (message: string) => show(message, 'success');
  const error = (message: string) => show(message, 'error');
  const info = (message: string) => show(message, 'info');

  return {
    toast,
    show,
    hide,
    success,
    error,
    info,
  };
}
