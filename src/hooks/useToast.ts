import { create } from 'zustand';

interface ToastState {
  message: string;
  visible: boolean;
  type: 'default' | 'success' | 'error' | 'achievement';
  show: (msg: string, type?: ToastState['type'], duration?: number) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: '',
  visible: false,
  type: 'default',
  show: (msg, type = 'default', duration = 2200) => {
    set({ message: msg, visible: true, type });
    setTimeout(() => set({ visible: false }), duration);
  },
  hide: () => set({ visible: false }),
}));
