// app/admin/layout.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/admin/sidebar';
import Header from '@/components/admin/header';
import { supabase } from '@/lib/supabase';
import ToastContainer from '@/components/ui/toast';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (!data?.session && pathname !== '/admin/login') {
          router.replace('/admin/login');
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error during admin layout checkAuth:', err);
        if (pathname !== '/admin/login') {
          router.replace('/admin/login');
        } else {
          setLoading(false);
        }
      }
    };

    checkAuth();
  }, [pathname, router]);

  // استثناء صفحة تسجيل الدخول من هيكل اللي آوت العام (حتى لا يظهر الـ Sidebar هناك)
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper text-ink font-arabic">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-amber" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="font-bold">جاري تحميل لوحة التحكم...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" dir="rtl">
      <ToastContainer />
      {/* شريط التنقل الجانبي */}
      <Sidebar />

      {/* منطقة المحتوى الرئيسية */}
      <div className="flex-1 lg:pr-64 flex flex-col min-h-screen pb-20 lg:pb-0">
        {/* الهيدر العلوي */}
        <Header />

        {/* جسم الصفحة الرئيسي */}
        <main className="flex-1 p-4 md:p-8 bg-paper overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
