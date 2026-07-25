// app/admin/coupons/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, Ticket, Trash2, Edit2, ToggleLeft, ToggleRight, Sparkles, AlertCircle 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getMockData, Coupon } from '@/lib/mockData';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // فورم التحكم
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<'percentage' | 'fixed'>('percentage');
  const [formValue, setFormValue] = useState<number | ''>('');
  const [formMinOrder, setFormMinOrder] = useState<number | ''>('');
  const [formUsageLimit, setFormUsageLimit] = useState<number | ''>('');
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    let couponsList: Coupon[] = [];

    try {
      const { data, error } = await supabase.from('coupons').select('*');
      if (data && data.length > 0) {
        couponsList = data;
      } else {
        couponsList = getMockData.coupons();
      }
    } catch (err) {
      couponsList = getMockData.coupons();
    }

    setCoupons(couponsList);
    setLoading(false);
  };

  // كتابة كود الكوبون كأحرف كابيتال تلقائياً
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormCode(val.toUpperCase().replace(/\s+/g, ''));
  };

  // فتح التعديل
  const handleEditClick = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormType(coupon.type);
    setFormValue(coupon.value);
    setFormMinOrder(coupon.min_order !== undefined && coupon.min_order !== null ? coupon.min_order : '');
    setFormUsageLimit(coupon.usage_limit !== undefined && coupon.usage_limit !== null ? coupon.usage_limit : '');
    setFormIsActive(coupon.is_active);
  };

  // إلغاء التعديل
  const handleCancelEdit = () => {
    setEditingCoupon(null);
    setFormCode('');
    setFormType('percentage');
    setFormValue('');
    setFormMinOrder('');
    setFormUsageLimit('');
    setFormIsActive(true);
  };

  // حفظ الكوبون (استجابة فورية بدون أي بطء)
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const valNum = Number(formValue);
    if (!formCode || isNaN(valNum) || valNum <= 0) {
      alert('يرجى كتابة رمز الكوبون وقيمة الخصم بشكل صحيح.');
      return;
    }

    const couponPayload: Coupon = {
      code: formCode,
      type: formType,
      value: valNum,
      min_order: formMinOrder === '' ? undefined : Number(formMinOrder),
      usage_limit: formUsageLimit === '' ? undefined : Number(formUsageLimit),
      is_active: formIsActive,
      usage_count: editingCoupon ? editingCoupon.usage_count : 0
    };

    if (editingCoupon) {
      setCoupons(prev => prev.map(c => c.code === editingCoupon.code ? couponPayload : c));
      handleCancelEdit();
      alert('تم تعديل الكوبون بنجاح!');
      try {
        await supabase.from('coupons').update(couponPayload).eq('code', editingCoupon.code);
      } catch (err) {
        console.error(err);
      }
    } else {
      if (coupons.some(c => c.code.toLowerCase() === formCode.toLowerCase())) {
        alert('هذا الكود مسجل بالفعل! يرجى اختيار رمز آخر.');
        return;
      }
      // إضافة فورية للجدول بدون انتظار
      setCoupons(prev => [couponPayload, ...prev]);
      handleCancelEdit();
      alert('تم إنشاء الكوبون بنجاح!');
      try {
        await supabase.from('coupons').insert([couponPayload]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // تبديل حالة الكوبون نشط/معطل
  const toggleActive = async (coupon: Coupon) => {
    const newVal = !coupon.is_active;
    setCoupons(prev => prev.map(c => c.code === coupon.code ? { ...c, is_active: newVal } : c));
    try {
      await supabase.from('coupons').update({ is_active: newVal }).eq('code', coupon.code);
    } catch (err) {
      console.error(err);
    }
  };

  // حذف الكوبون
  const handleDeleteCoupon = async (code: string) => {
    if (!confirm('هل تريد حذف هذا الكوبون نهائياً؟')) return;
    try {
      await supabase.from('coupons').delete().eq('code', code);
      setCoupons(prev => prev.filter(c => c.code !== code));
      alert('تم حذف الكوبون بنجاح.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" dir="rtl">
      
      {/* 1. نموذج الإنشاء والتعديل (Form Panel) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[16px] shadow-sm border border-slate-200 dark:border-slate-800 h-fit space-y-4 lg:col-span-1 transition-colors">
        <div className="space-y-1 text-right">
          <h3 className="text-base font-bold text-ink dark:text-slate-100 font-arabic flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#2E7FD9]" />
            <span>{editingCoupon ? 'تعديل بيانات الكوبون' : 'إنشاء كوبون خصم جديد'}</span>
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-400 font-arabic">أنشئ كوبونات ترويجية لزيادة حجم المبيعات</p>
        </div>

        <form onSubmit={handleSaveCoupon} className="space-y-4 text-right">
          
          <Input
            label="رمز الكوبون (Coupon Code)"
            placeholder="مثال: KHODARY10"
            value={formCode}
            onChange={handleCodeChange}
            required
            className="font-english font-bold tracking-wider placeholder:tracking-normal"
            disabled={!!editingCoupon}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="نوع الخصم"
              options={[
                { value: 'percentage', label: 'نسبة مئوية (%)' },
                { value: 'fixed', label: 'مبلغ ثابت (ج.م)' }
              ]}
              value={formType}
              onChange={(e: any) => setFormType(e.target.value)}
            />
            <Input
              label={formType === 'percentage' ? 'قيمة الخصم (%)' : 'مبلغ الخصم (ج.م)'}
              type="number"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="مثال: 15"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="الحد الأدنى للطلب (ج.م)"
              type="number"
              placeholder="اختياري"
              value={formMinOrder}
              onChange={(e) => setFormMinOrder(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <Input
              label="مرات الاستخدام القصوى"
              type="number"
              placeholder="لا نهائي"
              value={formUsageLimit}
              onChange={(e) => setFormUsageLimit(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>

          {/* تفعيل/تعطيل الكوبون */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink dark:text-slate-200 font-arabic">حالة الكوبون الافتراضية</span>
            <button
              type="button"
              onClick={() => setFormIsActive(!formIsActive)}
              className="flex items-center gap-2 py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-[12px] bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-700 transition-colors justify-between text-slate-700 dark:text-slate-200 w-full"
            >
              <span className="text-xs font-arabic">نشط حالياً للمشترين</span>
              {formIsActive ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
            </button>
          </div>

          {/* أزرار الحفظ */}
          <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            {editingCoupon && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                className="flex-1 font-arabic dark:border-slate-700 dark:text-slate-200"
              >
                إلغاء
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="flex-1 font-arabic bg-[#2E7FD9] hover:bg-[#1B4F8A] text-white"
            >
              {editingCoupon ? 'حفظ التعديلات' : 'إنشاء الكوبون'}
            </Button>
          </div>

        </form>
      </div>

      {/* 2. جدول الكوبونات المتاحة (Table Panel) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[16px] shadow-sm border border-slate-200 dark:border-slate-800 lg:col-span-2 flex flex-col gap-4 transition-colors">
        <div className="space-y-1 text-right">
          <h3 className="text-base font-bold text-ink dark:text-slate-100 font-arabic">أكواد الكوبونات النشطة</h3>
          <p className="text-xs text-slate-400 dark:text-slate-400 font-arabic">مراقبة معدلات استخدام الكوبونات والخصومات الحالية للموقع</p>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-ink dark:text-slate-200">
            <svg className="animate-spin h-8 w-8 text-[#2E7FD9]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-bold font-arabic text-sm">جاري جلب الكوبونات...</span>
          </div>
        ) : coupons.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-arabic">
                  <th className="py-4 px-5 font-bold">الكود الترويجي</th>
                  <th className="py-4 px-5 font-bold">نوع الخصم</th>
                  <th className="py-4 px-5 font-bold">القيمة المخصومة</th>
                  <th className="py-4 px-5 font-bold">الحد الأدنى للطلب</th>
                  <th className="py-4 px-5 font-bold">معدل الاستخدام</th>
                  <th className="py-4 px-5 font-bold text-center">نشط</th>
                  <th className="py-4 px-5 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-slate-200 dark:divide-slate-800">
                {coupons.map((coupon) => (
                  <tr key={coupon.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-5 font-english font-bold text-xs tracking-wider text-[#2E7FD9] dark:text-[#5B9FE6] select-all bg-[#2E7FD9]/10 dark:bg-[#2E7FD9]/20 rounded-[8px]">
                      {coupon.code}
                    </td>
                    <td className="py-3.5 px-5 font-arabic text-slate-600 dark:text-slate-300">
                      {coupon.type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}
                    </td>
                    <td className="py-3.5 px-5 font-english font-semibold text-slate-800 dark:text-slate-100">
                      {coupon.type === 'percentage' ? `${coupon.value}%` : `${coupon.value} ج.م`}
                    </td>
                    <td className="py-3.5 px-5 font-english text-slate-500 dark:text-slate-400">
                      {coupon.min_order ? `${coupon.min_order} ج.م` : 'بدون حد أدنى'}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex flex-col gap-1">
                        <span className="font-english font-bold text-xs text-slate-700 dark:text-slate-300">
                          {coupon.usage_count} {coupon.usage_limit ? `/ ${coupon.usage_limit}` : 'مرات'}
                        </span>
                        {coupon.usage_limit && (
                          <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#2E7FD9] rounded-full" 
                              style={{ width: `${Math.min((coupon.usage_count / coupon.usage_limit) * 100, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <button
                        onClick={() => toggleActive(coupon)}
                        className={`p-1.5 transition-colors ${
                          coupon.is_active ? 'text-emerald-500' : 'text-slate-400'
                        }`}
                      >
                        {coupon.is_active ? (
                          <ToggleRight className="w-7 h-7" />
                        ) : (
                          <ToggleLeft className="w-7 h-7" />
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEditClick(coupon)}
                          className="p-1.5 text-slate-500 bg-slate-50 rounded-[8px] hover:bg-amber/10 hover:text-amber transition-colors"
                          title="تعديل"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon.code)}
                          className="p-1.5 text-slate-500 bg-slate-50 rounded-[8px] hover:bg-rose-50 hover:text-rose-500 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-slate-400 font-arabic text-sm">
            لا توجد كوبونات خصم مضافة حالياً.
          </div>
        )}
      </div>

    </div>
  );
}
