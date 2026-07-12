// lib/toast.ts

export type ToastType = 'success' | 'error' | 'info';

export function showToast(message: string, type: ToastType = 'success') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('show-toast', {
        detail: { message, type },
      })
    );
  }
}
