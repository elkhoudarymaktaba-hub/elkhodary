// components/admin/sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, BarChart3, ClipboardList, Package, FolderOpen, 
  Box, Ticket, Truck, FileEdit, Radio, Key, Settings, LogOut, Users, FileText
} from 'lucide-react';
import { clsx } from 'clsx';
import { supabase } from '@/lib/supabase';

const menuItems = [
  { label: 'الرئيسية', path: '/admin', icon: Home },
  { label: 'التحليلات', path: '/admin/analytics', icon: BarChart3 },
  { label: 'الطلبات', path: '/admin/orders', icon: ClipboardList },
  { label: 'قوائم المدارس', path: '/admin/supply-lists', icon: FileText },
  { label: 'المنتجات', path: '/admin/products', icon: Package },
  { label: 'الأقسام', path: '/admin/categories', icon: FolderOpen },
  { label: 'الباقات والبوكسات', path: '/admin/boxes', icon: Box },
  { label: 'كوبونات الخصم', path: '/admin/coupons', icon: Ticket },
  { label: 'إعدادات الشحن', path: '/admin/shipping', icon: Truck },
  { label: 'إدارة الصفحات', path: '/admin/pages', icon: FileEdit },
  { label: 'التتبع والتكاملات', path: '/admin/tracking', icon: Radio },
  { label: 'API والأتمتة', path: '/admin/api-keys', icon: Key },
  { label: 'صلاحيات المدراء', path: '/admin/staff', icon: Users },
  { label: 'إعدادات المتجر', path: '/admin/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // إزالة الكوكي لإشعار الميدل وير
    document.cookie = 'kh_admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.refresh();
    router.push('/admin/login');
  };

  return (
    <>
      {/* 1. شريط التنقل الجانبي لنسخة الديسكتوب (Desktop Sidebar) */}
      <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-[#16233F] to-[#101a33] text-white fixed top-0 bottom-0 right-0 z-30 shadow-xl border-l border-[#2E3E63]/15">
        
        {/* اللوجو والهوية */}
        <div className="p-6 border-b border-[#2E3E63]/20 flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-gradient-to-tr from-[#C9862A] to-[#E7A537] rounded-[16px] flex items-center justify-center text-3xl shadow-inner -rotate-4 hover:rotate-0 transition-transform duration-300">
            📖
          </div>
          <div className="text-center">
            <h1 className="font-bold text-lg font-arabic tracking-wide text-white">مكتبة الخضري</h1>
            <p className="text-xs text-[#6B7796] font-arabic mt-0.5">لوحة التحكم الإدارية</p>
          </div>
        </div>

        {/* قائمة الروابط */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1 scrollbar-thin">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-[12px] text-sm font-semibold transition-all duration-200 group font-arabic',
                  {
                    'bg-gradient-to-r from-[#C43F2B] to-[#E4573F] text-white shadow-md border-r-4 border-[#E7A537]': isActive,
                    'text-[#6B7796] hover:text-white hover:bg-white/5': !isActive,
                  }
                )}
              >
                <Icon className={clsx('w-5 h-5 transition-transform duration-200 group-hover:scale-105', {
                  'text-white': isActive,
                  'text-[#6B7796] group-hover:text-white': !isActive
                })} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* زر تسجيل الخروج */}
        <div className="p-4 border-t border-[#2E3E63]/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-coral/10 hover:bg-coral/20 text-coral-light hover:text-white rounded-[12px] text-sm font-semibold transition-all duration-200 font-arabic"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* 2. شريط التنقل السفلي لنسخة الجوال (Mobile Bottom Nav) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-l from-[#16233F] to-[#101a33] text-white z-40 shadow-2xl border-t border-[#2E3E63]/20 flex overflow-x-auto scrollbar-none items-center justify-between px-2 py-1.5 h-16">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={clsx(
                'flex flex-col items-center justify-center min-w-[65px] px-1 py-1 rounded-[8px] text-[10px] font-semibold transition-all duration-150 flex-1 font-arabic',
                {
                  'text-white bg-gradient-to-t from-[#C43F2B] to-[#E4573F] border-t-2 border-[#E7A537]': isActive,
                  'text-[#6B7796] hover:text-white': !isActive,
                }
              )}
            >
              <Icon className="w-4.5 h-4.5 mb-1" />
              <span className="truncate max-w-[60px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
