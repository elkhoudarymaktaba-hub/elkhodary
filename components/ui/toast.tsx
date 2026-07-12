// components/ui/toast.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastType } from '@/lib/toast';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    // Override window.alert globally in client side
    if (typeof window !== 'undefined') {
      window.alert = (message: string) => {
        const isError = 
          message.includes('خطأ') || 
          message.includes('فشل') || 
          message.includes('لا يمكن') || 
          message.includes('عذراً') ||
          message.includes('warning') ||
          message.includes('error');

        window.dispatchEvent(
          new CustomEvent('show-toast', {
            detail: {
              message,
              type: isError ? 'error' : 'success',
            },
          })
        );
      };
    }

    const handleShowToast = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string; type: ToastType }>;
      if (!customEvent.detail) return;

      const newToast: ToastItem = {
        id: Math.random().toString(36).substring(2, 9),
        message: customEvent.detail.message,
        type: customEvent.detail.type || 'success',
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss after 3.5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 3500);
    };

    window.addEventListener('show-toast', handleShowToast);
    return () => window.removeEventListener('show-toast', handleShowToast);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-6 left-6 z-[99999] flex flex-col gap-3 max-w-sm w-full pointer-events-none font-arabic" dir="rtl">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: -100, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.9, transition: { duration: 0.2 } }}
            className="w-full bg-white rounded-xl shadow-premium border border-slate-100 p-4 pointer-events-auto flex items-start gap-3 relative overflow-hidden"
          >
            {/* Left Accent indicator line */}
            <div
              className={`absolute top-0 bottom-0 left-0 w-1 ${
                toast.type === 'success'
                  ? 'bg-emerald-500'
                  : toast.type === 'error'
                  ? 'bg-rose-500'
                  : 'bg-blue-500'
              }`}
            />

            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-pulse" />
              )}
              {toast.type === 'error' && (
                <AlertCircle className="w-5 h-5 text-rose-500" />
              )}
              {toast.type === 'info' && (
                <Info className="w-5 h-5 text-blue-500" />
              )}
            </div>

            {/* Message Body */}
            <div className="flex-1 text-right pl-4">
              <span className="text-xs font-bold text-ink leading-relaxed">
                {toast.message}
              </span>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-ink transition-colors shrink-0"
              aria-label="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
