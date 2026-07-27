// app/admin/login/page.tsx
'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Mail, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let isSuccess = false;
      let loggedUser: any = null;

      // 1. فحص بيانات الدخول عبر Supabase Auth
      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (!authError && data?.session) {
          isSuccess = true;
          loggedUser = {
            id: data.session.user.id,
            email: data.session.user.email,
            name: data.session.user.user_metadata?.name || 'مشرف النظام',
            role: data.session.user.user_metadata?.role || 'full_admin'
          };
        }
      } catch (authErr) {
        console.warn('Supabase auth attempt:', authErr);
      }

      // 2. فحص بيانات المشرفين والمدراء المضافين في قائمة الموظفين (kh_staff / elkhodary_staff)
      if (!isSuccess && typeof window !== 'undefined') {
        const stored1 = localStorage.getItem('elkhodary_staff');
        const stored2 = localStorage.getItem('kh_staff');
        let staffList: any[] = [];
        
        if (stored1) {
          try { staffList = [...staffList, ...JSON.parse(stored1)]; } catch (e) {}
        }
        if (stored2) {
          try { staffList = [...staffList, ...JSON.parse(stored2)]; } catch (e) {}
        }

        // جلب قائمة الموظفين من السيرفر إذا لم تكن موجودة في الـ LocalStorage
        if (staffList.length === 0) {
          try {
            const { data: serverStaff } = await supabase.from('kh_staff').select('*');
            if (serverStaff && Array.isArray(serverStaff)) {
              staffList = serverStaff;
            }
          } catch (e) {}
        }

        // الحسابات المتاحة للاختبار والمدراء
        const defaultAccounts = [
          { email: 'admin@elkhodary.com', password: 'admin123', name: 'أحمد الخضري', role: 'full_admin' },
          { email: 'products@elkhodary.com', password: 'products2025', name: 'محمد علي', role: 'product_manager' },
          { email: 'sales@elkhodary.com', password: 'sales2025', name: 'سارة أحمد', role: 'order_manager' },
        ];

        const inputEmail = email.trim().toLowerCase();
        const inputPass = password.trim();

        const allStaff = [...staffList, ...defaultAccounts];
        const match = allStaff.find(
          s => s.email && s.email.trim().toLowerCase() === inputEmail && s.password && s.password.trim() === inputPass
        );

        if (match) {
          isSuccess = true;
          loggedUser = {
            id: match.id || `staff-${Date.now()}`,
            email: match.email,
            name: match.name || match.email.split('@')[0],
            role: match.role || 'full_admin'
          };
        }
      }

      if (isSuccess && loggedUser) {
        // تعيين الكوكي وتخزين الجلسة النشطة
        document.cookie = `kh_admin_session=true; Path=/; Max-Age=86400; SameSite=Lax;`;
        if (typeof window !== 'undefined') {
          localStorage.setItem('kh_active_staff', JSON.stringify(loggedUser));
        }

        router.refresh();
        setTimeout(() => {
          router.push(redirectTo);
        }, 100);
      } else {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة، يرجى التأكد من البيانات.');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة لاحقاً.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#16233F]/20 via-[#F6F1E4] to-[#E7A537]/15 px-4" dir="rtl">
      
      {/* حاوية الكارت */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-[24px] border border-[#E7DCC2] p-8 shadow-premium flex flex-col gap-6 relative overflow-hidden">
        
        {/* خلفية تزيينية للجمال البصري */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#E4573F]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-[#E7A537]/10 rounded-full blur-2xl pointer-events-none" />

        {/* الهوية البصرية */}
        <div className="text-center flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-[#16233F] rounded-[20px] flex items-center justify-center text-3xl shadow-lg shadow-[#16233F]/20 text-white animate-bounce-slow">
            📖
          </div>
          <div>
            <h1 className="font-bold text-2xl text-ink font-arabic">بوابة المشرف</h1>
            <p className="text-xs text-slate-500 font-arabic mt-1">مكتبة الخضري - لوحة التحكم الإدارية</p>
          </div>
        </div>

        {/* التنبيه بالخطأ */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 rounded-[12px] p-3 text-sm font-arabic font-medium text-center flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* فورم تسجيل الدخول */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-right">
          
          <div className="relative">
            <Input
              label="البريد الإلكتروني"
              type="email"
              placeholder="admin@elkhodary.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10"
            />
            <Mail className="absolute left-3.5 bottom-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <Input
              label="كلمة المرور"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pl-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3.5 bottom-3.5 p-0.5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            <Lock className="absolute left-10 bottom-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>

          <Button
            type="submit"
            isLoading={loading}
            className="w-full mt-2 py-3 rounded-[16px] text-base font-bold shadow-md shadow-amber/20"
          >
            <ShieldCheck className="w-5 h-5 ml-2" />
            <span>دخول آمن</span>
          </Button>

        </form>


      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-arabic" dir="rtl">
        <span className="font-bold text-sm text-ink">جاري تحميل بوابة المشرف...</span>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
