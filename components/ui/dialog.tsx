// components/ui/dialog.tsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disableBackdropClose?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  disableBackdropClose = false,
}) => {
  // منع التمرير في الخلفية عند فتح المودال
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      {/* الخلفية المظلمة */}
      <div 
        className="fixed inset-0 bg-[#16233F]/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={disableBackdropClose ? undefined : onClose}
      />

      {/* نافذة المودال */}
      <div className={`relative w-full ${sizeClasses[size]} bg-white rounded-[16px] shadow-premium border border-[#E7DCC2] overflow-hidden transform transition-all duration-300 animate-in fade-in zoom-in-95 duration-200 z-10 max-h-[90vh] flex flex-col`}>
        
        {/* هيدر النافذة */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#F6F1E4]/40">
          <h3 className="text-lg font-bold text-ink font-arabic">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* محتوى النافذة */}
        <div className="px-6 py-6 overflow-y-auto flex-1 text-right">
          {children}
        </div>
      </div>
    </div>
  );
};
