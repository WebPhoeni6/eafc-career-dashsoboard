import { useCallback } from 'react';

export function useConfirm() {
  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      resolve(window.confirm(message));
    });
  }, []);
  return confirm;
}
