// app/admin/login/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Mail, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
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
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message || 'بيانات الدخول غير صحيحة، يرجى المحاولة مرة أخرى.');
      } else if (data) {
        // تعيين الكوكي للميدل وير لتأمين المسارات
        document.cookie = `kh_admin_session=true; Path=/; Max-Age=86400; SameSite=Lax;`;
        
        router.refresh();
        setTimeout(() => {
          router.push(redirectTo);
        }, 100);
      }
    } catch (err) {
      setError('حدث خطأ أثناء الاتصال بالخادم.');
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

        {/* بيانات الدخول الافتراضية للتجربة */}
        <div className="bg-[#FBEBCB]/30 rounded-[16px] border border-[#E7DCC2] p-4 mt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-ink mb-1.5">
            <KeyRound className="w-4 h-4 text-amber" />
            <span>بيانات الدخول الافتراضية (للمحاكاة):</span>
          </div>
          <div className="space-y-1 text-xs text-slate-600 font-arabic">
            <p>البريد: <code className="bg-white px-1.5 py-0.5 rounded border font-english text-[#C9862A] select-all">admin@elkhodary.com</code></p>
            <p>كلمة المرور: <code className="bg-white px-1.5 py-0.5 rounded border font-english text-[#C9862A] select-all">admin123</code></p>
          </div>
        </div>

      </div>
    </div>
  );
}
