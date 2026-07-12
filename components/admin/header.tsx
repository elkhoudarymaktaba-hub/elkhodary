// components/admin/header.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, AlertTriangle, User, ExternalLink, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { getMockData } from '@/lib/mockData';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [storeName, setStoreName] = useState('مكتبة الخضري');
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [adminEmail, setAdminEmail] = useState('admin@elkhodary.com');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDarkStored = localStorage.getItem('admin_dark_mode') === 'true';
      setIsDark(isDarkStored);
      if (isDarkStored) {
        document.body.classList.add('admin-dark');
      } else {
        document.body.classList.remove('admin-dark');
      }
    }
  }, []);

  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_dark_mode', String(newDark));
      if (newDark) {
        document.body.classList.add('admin-dark');
      } else {
        document.body.classList.remove('admin-dark');
      }
    }
  };

  // تنبيهات حية منبثقة
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const mockNotifications = [
    { id: 1, text: 'طلب جديد ORD-1011 من العميل سليمان الصاوي بقيمة 365 ج.م', time: 'منذ 5 دقائق', type: 'order' },
    { id: 2, text: 'تحذير المخزون: كتاب سلاح التلميذ لغة عربية قارب على النفاد', time: 'منذ 25 دقيقة', type: 'warning' },
    { id: 3, text: 'استخدم كوبون WELCOME للطلب ORD-1010 بقيمة 200 ج.م', time: 'منذ ساعة', type: 'coupon' },
    { id: 4, text: 'تسجيل عميل جديد: كريم أشرف من محافظة المنوفية', time: 'منذ ساعتين', type: 'user' },
    { id: 5, text: 'تم استلام الدفعة المالية للطلب ORD-1006 بقيمة 775 ج.م', time: 'منذ 3 ساعات', type: 'payment' }
  ];

  // إغلاق المنبثقة عند النقر بالخارج
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // استخراج اسم الصفحة الحالية
  const getPageTitle = () => {
    switch (pathname) {
      case '/admin': return 'لوحة التحكم الرئيسية';
      case '/admin/analytics': return 'التحليلات والتقارير المتقدمة';
      case '/admin/orders': return 'إدارة الطلبات والمبيعات';
      case '/admin/products': return 'إدارة دليل المنتجات';
      case '/admin/categories': return 'تصنيفات وأقسام المتجر';
      case '/admin/boxes': return 'منشئ البوكسات التعليمية';
      case '/admin/coupons': return 'كوبونات وقسائم الخصم';
      case '/admin/shipping': return 'إعدادات وتسعير شحن المحافظات';
      case '/admin/pages': return 'منشئ وإدارة صفحات الموقع';
      case '/admin/tracking': return 'أكواد التتبع والبيكسلات';
      case '/admin/api-keys': return 'مفاتيح الـ API وربط الأتمتة';
      case '/admin/settings': return 'إعدادات المتجر العامة';
      default: return 'لوحة التحكم الإدارية';
    }
  };

  // تحميل الإعدادات عند فتح الصفحة
  useEffect(() => {
    const loadSettings = async () => {
      // قراءة الجلسة لعرض البريد الإلكتروني الفعلي للمشرف
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setAdminEmail(data.session.user.email || 'admin@elkhodary.com');
      }

      // قراءة الإعدادات
      try {
        const { data: settings } = await supabase.from('site_settings').select('*');
        if (settings) {
          const nameObj = settings.find((s: any) => s.key === 'store_name');
          const maintenanceObj = settings.find((s: any) => s.key === 'maintenance_mode');
          if (nameObj) setStoreName(nameObj.value);
          if (maintenanceObj) setIsMaintenanceMode(maintenanceObj.value === 'true');
        }
      } catch (err) {
        // Fallback للـ LocalStorage
        const settings = getMockData.settings();
        setStoreName(settings.store_name);
        setIsMaintenanceMode(settings.maintenance_mode === 'true');
      }
    };

    loadSettings();

    // الاستماع لحدث حفظ التعديلات للتحديث المباشر
    const handleStorageUpdate = () => {
      const settings = getMockData.settings();
      setStoreName(settings.store_name);
      setIsMaintenanceMode(settings.maintenance_mode === 'true');
    };

    window.addEventListener('storage', handleStorageUpdate);
    // حدث مخصص للتواصل الداخلي بين الصفحات
    window.addEventListener('settingsUpdated', handleStorageUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('settingsUpdated', handleStorageUpdate);
    };
  }, []);

  return (
    <header className="w-full flex flex-col z-20" dir="rtl">
      {/* 1. بنر وضع الصيانة النشط */}
      {isMaintenanceMode && (
        <div className="w-full bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-xs md:text-sm font-semibold animate-pulse shadow-sm">
          <AlertTriangle className="w-4 h-4 md:w-5 h-5 shrink-0" />
          <span>وضع الصيانة مفعّل حالياً! واجهة المتجر مغلقة الآن في وجه الزوار لضمان عدم حدوث تداخلات أثناء التعديل.</span>
        </div>
      )}

      {/* 2. الهيدر الرئيسي للوحة التحكم */}
      <div className="w-full bg-white h-20 border-b border-[#E7DCC2] px-4 md:px-8 flex items-center justify-between shadow-sm">
        
        {/* عنوان الصفحة الحالي */}
        <div>
          <h2 className="font-bold text-lg md:text-xl text-ink font-arabic leading-tight">
            {getPageTitle()}
          </h2>
          <p className="text-xs text-ink-muted font-arabic hidden md:block mt-1">
            مرحباً بك في لوحة تحكم {storeName}
          </p>
        </div>

        {/* أدوات الهيدر (المشرف، التنبيهات، زيارة الموقع) */}
        <div className="flex items-center gap-3 md:gap-5">
          {/* معاينة المتجر */}
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-amber-light text-amber-deep text-xs font-bold hover:bg-amber hover:text-white transition-all duration-200 border border-amber/10"
          >
            <span className="hidden md:inline">زيارة المتجر</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* زر وضع الليل / النهار */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-[12px] bg-[#F6F1E4]/30 hover:bg-[#F6F1E4] border border-[#E7DCC2] text-ink transition-all flex items-center justify-center shrink-0"
            title={isDark ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-deep" /> : <Moon className="w-4 h-4 text-ink" />}
          </button>

          {/* التنبيهات المنبثقة التفاعلية */}
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 hover:bg-slate-50 rounded-full transition-colors ${showNotifications ? 'text-ink bg-slate-50' : 'text-ink-muted hover:text-ink'}`}
            >
              <span className="absolute top-1 left-1 w-2.5 h-2.5 bg-coral rounded-full border-2 border-white" />
              <Bell className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showNotifications && (
                <div 
                  className="absolute left-0 mt-2 bg-white border border-slate-100 rounded-[20px] shadow-xl w-80 py-3 z-30 overflow-hidden text-right animate-in fade-in slide-in-from-top-2 duration-200"
                  style={{ boxShadow: '0 10px 30px rgba(22, 35, 63, 0.12)' }}
                >
                  <div className="px-4 pb-2.5 mb-2 border-b border-slate-50 flex items-center justify-between text-xs font-bold font-arabic text-ink">
                    <span>التنبيهات والإشعارات الأخيرة</span>
                    <span className="text-[10px] bg-coral-light text-coral-deep px-2 py-0.5 rounded-full font-bold">5 جديدة</span>
                  </div>

                  <div className="divide-y divide-slate-50 max-h-[280px] overflow-y-auto">
                    {mockNotifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className="px-4 py-3 hover:bg-slate-50/70 transition-colors flex items-start gap-2.5 text-xs font-arabic cursor-pointer"
                        onClick={() => {
                          setShowNotifications(false);
                          router.push('/admin/notifications');
                        }}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          notif.type === 'order' ? 'bg-amber' :
                          notif.type === 'warning' ? 'bg-coral' :
                          notif.type === 'coupon' ? 'bg-plum' :
                          notif.type === 'user' ? 'bg-sage' : 'bg-ink-muted'
                        }`} />
                        <div className="flex-1 space-y-1">
                          <p className="text-slate-700 leading-snug font-medium">{notif.text}</p>
                          <span className="text-[10px] text-ink-muted font-english block">{notif.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-3 pt-2.5 mt-2 border-t border-slate-50 text-center">
                    <button 
                      onClick={() => {
                        setShowNotifications(false);
                        router.push('/admin/notifications');
                      }}
                      className="w-full py-1.5 bg-amber-light hover:bg-amber text-amber-deep hover:text-white rounded-[12px] text-xs font-bold transition-all font-arabic"
                    >
                      عرض جميع الإشعارات (الكل)
                    </button>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* الخط الفاصل */}
          <div className="h-8 w-px bg-slate-200" />

          {/* بيانات المشرف */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ink/10 border border-ink/20 flex items-center justify-center text-ink shadow-inner">
              <User className="w-5 h-5" />
            </div>
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-bold text-ink font-arabic">مدير النظام</span>
              <span className="text-[10px] text-ink-muted font-english truncate max-w-[120px]">{adminEmail}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
