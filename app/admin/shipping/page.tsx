// app/admin/shipping/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, Edit2, Trash2, Truck, Check, ToggleLeft, ToggleRight, Sparkles, MapPin 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getMockData, ShippingRate } from '@/lib/mockData';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function ShippingPage() {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);

  // إعدادات الشحن المجاني العامة
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(true);
  const [freeShippingMin, setFreeShippingMin] = useState(500);
  const [freeShippingLabel, setFreeShippingLabel] = useState('شحن مجاني للطلبات فوق 500 جنيه!');
  const [savingSettings, setSavingSettings] = useState(false);

  // نافذة إضافة/تعديل محافظة
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);
  
  // حقول فورم المحافظة
  const [formGov, setFormGov] = useState('');
  const [formFee, setFormFee] = useState(0);
  const [formTime, setFormTime] = useState('2-3 أيام');
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    let ratesList: ShippingRate[] = [];

    try {
      const { data } = await supabase.from('shipping_rates').select('*');
      if (data) ratesList = data;

      // جلب إعدادات الشحن المجاني من site_settings
      const { data: settings } = await supabase.from('site_settings').select('*');
      if (settings) {
        const enabledObj = settings.find((s: any) => s.key === 'free_shipping_enabled');
        const minObj = settings.find((s: any) => s.key === 'free_shipping_min');
        const labelObj = settings.find((s: any) => s.key === 'free_shipping_label');
        
        if (enabledObj) setFreeShippingEnabled(enabledObj.value === 'true');
        if (minObj) setFreeShippingMin(Number(minObj.value));
        if (labelObj) setFreeShippingLabel(labelObj.value);
      }
    } catch (err) {
      ratesList = getMockData.shippingRates();
      // استيراد قيم الـ LocalStorage الافتراضية
      const settings = getMockData.settings();
      setFreeShippingEnabled(settings.free_shipping_enabled === 'true');
      setFreeShippingMin(Number(settings.free_shipping_min));
      setFreeShippingLabel(settings.free_shipping_label);
    }

    setRates(ratesList);
    setLoading(false);
  };

  // فتح إضافة محافظة
  const handleAddClick = () => {
    setEditingRate(null);
    setFormGov('');
    setFormFee(35);
    setFormTime('2-3 أيام');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  // فتح تعديل محافظة
  const handleEditClick = (rate: ShippingRate) => {
    setEditingRate(rate);
    setFormGov(rate.governorate);
    setFormFee(rate.shipping_fee);
    setFormTime(rate.delivery_time);
    setFormIsActive(rate.is_active);
    setIsModalOpen(true);
  };

  // حفظ المحافظة
  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGov || formFee < 0) return;

    const payload = {
      governorate: formGov,
      shipping_fee: Number(formFee),
      delivery_time: formTime,
      is_active: formIsActive
    };

    try {
      if (editingRate) {
        await supabase.from('shipping_rates').update(payload).eq('governorate', editingRate.governorate);
        setRates(prev => prev.map(r => r.governorate === editingRate.governorate ? { ...r, ...payload } : r));
        alert('تم تعديل تسعيرة المحافظة بنجاح!');
      } else {
        // التحقق من التكرار
        if (rates.some(r => r.governorate === formGov)) {
          alert('هذه المحافظة مسجلة مسبقاً! يرجى اختيار تعديل المحافظة القائمة بدلاً من إضافتها.');
          return;
        }
        await supabase.from('shipping_rates').insert([payload]);
        fetchData();
        alert('تم إضافة المحافظة بنجاح!');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ التعديلات.');
    }
  };

  // حفظ إعدادات الشحن المجاني
  const handleSaveFreeShippingSettings = async () => {
    setSavingSettings(true);
    
    // حفظ التعديلات
    const updates = [
      { key: 'free_shipping_enabled', value: String(freeShippingEnabled) },
      { key: 'free_shipping_min', value: String(freeShippingMin) },
      { key: 'free_shipping_label', value: freeShippingLabel },
    ];

    try {
      await supabase.from('site_settings').upsert(updates);
      
      // حفظ محلي في الموك داتا للتكامل
      const settings = getMockData.settings();
      getMockData.settings = () => ({
        ...settings,
        free_shipping_enabled: String(freeShippingEnabled),
        free_shipping_min: freeShippingMin,
        free_shipping_label: freeShippingLabel
      });
      // إرسال حدث مخصص لتحديث الهيدر
      window.dispatchEvent(new Event('settingsUpdated'));

      alert('تم حفظ إعدادات الشحن المجاني بنجاح!');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ الإعدادات.');
    } finally {
      setSavingSettings(false);
    }
  };

  // تبديل تفعيل المحافظة
  const toggleActive = async (rate: ShippingRate) => {
    const newVal = !rate.is_active;
    setRates(prev => prev.map(r => r.governorate === rate.governorate ? { ...r, is_active: newVal } : r));
    try {
      await supabase.from('shipping_rates').update({ is_active: newVal }).eq('governorate', rate.governorate);
    } catch (err) {
      console.error(err);
    }
  };

  // حذف محافظة
  const handleDeleteRate = async (gov: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف تسعيرة شحن محافظة "${gov}" نهائياً؟`)) return;
    try {
      await supabase.from('shipping_rates').delete().eq('governorate', gov);
      setRates(prev => prev.filter(r => r.governorate !== gov));
      alert('تم إزالة المحافظة.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" dir="rtl">
      
      {/* 1. إعدادات الشحن المجاني (Free Shipping settings Card) */}
      <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] h-fit space-y-4 lg:col-span-1">
        <div className="space-y-1 text-right">
          <h3 className="text-base font-bold text-ink font-arabic flex items-center gap-1.5">
            <Truck className="w-5 h-5 text-amber" />
            <span>عروض الشحن المجاني</span>
          </h3>
          <p className="text-xs text-slate-400 font-arabic">حدد قواعد تفعيل التوصيل المجاني للعملاء</p>
        </div>

        <div className="space-y-4 text-right">
          {/* تفعيل / تعطيل */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-ink font-arabic">تفعيل الشحن المجاني</span>
            <button
              onClick={() => setFreeShippingEnabled(!freeShippingEnabled)}
              className="flex items-center gap-2 mt-1 py-2 px-3 border border-[#E7DCC2] rounded-[12px] bg-slate-50 hover:bg-slate-100/70 transition-colors justify-between text-slate-700 w-full"
            >
              <span className="text-xs font-arabic">الشحن مجاني عند تخطي قيمة شراء معينة</span>
              {freeShippingEnabled ? <ToggleRight className="w-6 h-6 text-sage" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}
            </button>
          </div>

          {/* قيمة الحد الأدنى */}
          {freeShippingEnabled && (
            <div className="animate-in fade-in duration-200">
              <Input
                label="الحد الأدنى للشراء للاستحقاق (ج.م)"
                type="number"
                value={freeShippingMin}
                onChange={(e) => setFreeShippingMin(Number(e.target.value))}
                required
              />
            </div>
          )}

          {/* نص الشعار الدعائي */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-ink font-arabic">نص شعار الشحن المجاني</label>
            <textarea
              rows={2}
              placeholder="شحن مجاني لجميع الطلبيات فوق 500 جنيه!"
              value={freeShippingLabel}
              onChange={(e) => setFreeShippingLabel(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-[#E7DCC2] text-sm rounded-[12px] font-arabic focus:outline-none focus:border-amber"
            />
          </div>

          <Button
            onClick={handleSaveFreeShippingSettings}
            isLoading={savingSettings}
            className="w-full font-arabic"
          >
            <span>حفظ إعدادات العرض</span>
          </Button>

        </div>
      </div>

      {/* 2. جدول أسعار شحن المحافظات (Rates Table Card) */}
      <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] lg:col-span-2 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1 text-right">
            <h3 className="text-base font-bold text-ink font-arabic">أسعار وتواقيت شحن المحافظات</h3>
            <p className="text-xs text-slate-400 font-arabic">قائمة تسعير شحن الطرود وسرعة التوصيل بالأيام لكل محافظة في مصر</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddClick}
            className="font-arabic text-xs py-2 px-4"
          >
            <Plus className="w-4 h-4 ml-1" />
            <span>إضافة تسعيرة</span>
          </Button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-ink">
            <svg className="animate-spin h-8 w-8 text-amber" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-bold font-arabic text-sm">جاري جلب الأسعار...</span>
          </div>
        ) : rates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="bg-[#F6F1E4]/30 border-b border-[#E7DCC2] text-ink-soft font-arabic">
                  <th className="py-4 px-5 font-bold">المحافظة</th>
                  <th className="py-4 px-5 font-bold">سعر الشحن للمحافظة</th>
                  <th className="py-4 px-5 font-bold">فترة التوصيل التقريبية</th>
                  <th className="py-4 px-5 font-bold text-center">نشط للتوصيل</th>
                  <th className="py-4 px-5 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-[#E7DCC2]">
                {rates.map((rate) => (
                  <tr key={rate.governorate} className="hover:bg-[#FBEBCB]/15 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-800 font-arabic">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {rate.governorate}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-english font-black text-slate-800">
                      {rate.shipping_fee} ج.م
                    </td>
                    <td className="py-3.5 px-5 font-arabic text-slate-500">
                      {rate.delivery_time}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <button
                        onClick={() => toggleActive(rate)}
                        className={`p-1.5 transition-colors ${
                          rate.is_active ? 'text-sage' : 'text-slate-300'
                        }`}
                      >
                        {rate.is_active ? (
                          <ToggleRight className="w-7 h-7" />
                        ) : (
                          <ToggleLeft className="w-7 h-7" />
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEditClick(rate)}
                          className="p-1.5 text-slate-500 bg-slate-50 rounded-[8px] hover:bg-amber/10 hover:text-amber transition-colors"
                          title="تعديل"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRate(rate.governorate)}
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
            لا توجد تسعيرات مسجلة. اضغط على الزر بالأعلى لإضافة محافظة.
          </div>
        )}
      </div>

      {/* مودال المحافظة (إضافة/تعديل) */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRate ? `تعديل تسعيرة محافظة "${editingRate.governorate}"` : 'إضافة تسعيرة شحن لمحافظة جديدة'}
        size="md"
      >
        <form onSubmit={handleSaveRate} className="space-y-4 text-right">
          
          <Input
            label="اسم المحافظة بالعربية"
            placeholder="مثال: أسيوط"
            value={formGov}
            onChange={(e) => setFormGov(e.target.value)}
            required
            disabled={!!editingRate} // اسم المحافظة هو المفتاح الأساسي للتعديل
          />

          <Input
            label="سعر الشحن (ج.م)"
            type="number"
            value={formFee}
            onChange={(e) => setFormFee(Number(e.target.value))}
            required
          />

          <Input
            label="فترة التوصيل بالأيام (مثال: 3-5 أيام)"
            placeholder="24-48 ساعة أو 3 أيام"
            value={formTime}
            onChange={(e) => setFormTime(e.target.value)}
            required
          />

          {/* تفعيل / تعطيل */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink font-arabic">حالة التوصيل للمحافظة</span>
            <button
              type="button"
              onClick={() => setFormIsActive(!formIsActive)}
              className="flex items-center gap-2 py-2 px-3 border border-[#E7DCC2] rounded-[12px] bg-slate-50 hover:bg-slate-100/70 transition-colors justify-between text-slate-700 w-full"
            >
              <span className="text-xs font-arabic">متاحة للشحن بالموقع</span>
              {formIsActive ? <ToggleRight className="w-6 h-6 text-sage" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}
            </button>
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="font-arabic"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="font-arabic"
            >
              {editingRate ? 'حفظ التعديلات' : 'إضافة المحافظة'}
            </Button>
          </div>

        </form>
      </Dialog>

    </div>
  );
}
