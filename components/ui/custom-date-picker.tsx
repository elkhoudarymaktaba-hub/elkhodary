// components/ui/custom-date-picker.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomDatePickerProps {
  value: string;
  onChange: (val: string) => void;
  label: string;
  placeholder?: string;
}

const arabicMonths = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const weekDays = ['أحد', 'نثن', 'ثلا', 'أرب', 'خمس', 'جمع', 'سبت'];

export function CustomDatePicker({ value, onChange, label, placeholder = 'اختر التاريخ' }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // تاريخ العرض الحالي في الكالندر
  const [currentDate, setCurrentDate] = useState(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });

  const displayYear = currentDate.getFullYear();
  const displayMonth = currentDate.getMonth();

  // إغلاق الكالندر عند النقر بالخارج
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // تحديث تاريخ العرض إذا تغيرت القيمة الخارجية
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setCurrentDate(d);
      }
    }
  }, [value]);

  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
  const firstDayIndex = new Date(displayYear, displayMonth, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(displayYear, displayMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(displayYear, displayMonth + 1, 1));
  };

  const handleDaySelect = (day: number) => {
    // تنسيق التاريخ بصيغة YYYY-MM-DD مع المحافظة على التوقيت المحلي
    const selectedDate = new Date(displayYear, displayMonth, day);
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // تفكيك القيمة لعرضها
  const getFormattedDisplay = () => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // توليد خلايا الأيام
  const dayCells = [];
  // خلايا فارغة لبداية الشهر
  for (let i = 0; i < firstDayIndex; i++) {
    dayCells.push(<div key={`empty-${i}`} className="h-8 w-8" />);
  }
  // خلايا أيام الشهر
  for (let day = 1; day <= daysInMonth; day++) {
    const isSelected = value && (() => {
      const vDate = new Date(value);
      return vDate.getFullYear() === displayYear && 
             vDate.getMonth() === displayMonth && 
             vDate.getDate() === day;
    })();

    const isToday = (() => {
      const today = new Date();
      return today.getFullYear() === displayYear &&
             today.getMonth() === displayMonth &&
             today.getDate() === day;
    })();

    dayCells.push(
      <motion.button
        key={`day-${day}`}
        type="button"
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleDaySelect(day)}
        className={`h-8 w-8 text-xs font-english font-bold rounded-full flex items-center justify-center transition-all ${
          isSelected 
            ? 'bg-amber text-white shadow-md shadow-amber/30 font-black' 
            : isToday
            ? 'border-2 border-ink text-ink font-black'
            : 'text-slate-700 hover:bg-paper hover:text-ink'
        }`}
      >
        {day}
      </motion.button>
    );
  }

  return (
    <div ref={containerRef} className="relative inline-block text-right">
      {/* حقل الإدخال المنشط */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border border-[#E7DCC2] hover:border-[#E7A537]/50 rounded-[12px] px-3.5 py-2.5 text-xs outline-none transition-all duration-200 text-slate-700 font-arabic cursor-pointer shadow-sm flex items-center justify-between gap-3 w-44 hover:shadow-md select-none"
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="w-4 h-4 text-amber shrink-0" />
          <span className={value ? 'text-slate-800 font-bold' : 'text-slate-400'}>
            {getFormattedDisplay() || placeholder}
          </span>
        </div>
        {value && (
          <button 
            type="button" 
            onClick={clearDate}
            className="p-0.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-ink"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <span className="absolute -top-2.5 right-3 bg-[#F6F1E4] px-2 text-[9px] font-bold text-ink rounded-full border border-[#E7DCC2] select-none">
        {label}
      </span>

      {/* مودال التقويم المنسدل */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 mt-2 right-0 bg-white border border-slate-100 rounded-[20px] p-4 shadow-xl w-64 select-none animate-in fade-in slide-in-from-top-2 duration-150"
            style={{ boxShadow: '0 10px 30px rgba(22, 35, 63, 0.12)' }}
          >
            {/* الهيدر العلوي للتحكم بالشهور */}
            <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
              <button 
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-paper rounded-[8px] text-ink transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1.5 font-arabic">
                 <span className="text-xs font-bold text-ink">
                   {arabicMonths[displayMonth]}
                 </span>
                 <select
                   value={displayYear}
                   onChange={(e) => {
                     const selectedYear = Number(e.target.value);
                     setCurrentDate(new Date(selectedYear, displayMonth, 1));
                   }}
                   className="bg-transparent text-xs font-bold text-ink outline-none cursor-pointer border-none font-english focus:ring-0 p-0"
                 >
                   {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - 10 + i).map(year => (
                     <option key={year} value={year} className="bg-white text-slate-800 font-bold font-english">
                       {year}
                     </option>
                   ))}
                 </select>
               </div>

              <button 
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-paper rounded-[8px] text-ink transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* أيام الأسبوع */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {weekDays.map((day) => (
                <div key={day} className="text-[10px] font-bold text-slate-400 font-arabic py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* شبكة الأيام */}
            <div className="grid grid-cols-7 gap-1 text-center justify-items-center">
              {dayCells}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
