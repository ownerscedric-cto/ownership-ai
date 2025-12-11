import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    // 간단하게 alert 사용
    const message = description ? `${title}\n\n${description}` : title;

    if (variant === 'destructive') {
      alert(`⚠️ ${message}`);
    } else {
      alert(`✅ ${message}`);
    }
  }, []);

  return {
    toast,
    toasts,
  };
}
