// app/admin/categories/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Check, ToggleLeft, ToggleRight, Sparkles 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getMockData, Category, Product } from '@/lib/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // فورم التحكم
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formIcon, setFormIcon] = useState('📚');
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    let localCats: Category[] = [];
    let localProds: Product[] = [];

    // Load from LocalStorage first (instant render)
    if (typeof window !== 'undefined') {
      const c = localStorage.getItem('kh_categories');
      if (c) {
        try { localCats = JSON.parse(c); } catch (e) {}
      } else {
        localCats = getMockData.categories();
        localStorage.setItem('kh_categories', JSON.stringify(localCats));
      }

      const p = localStorage.getItem('kh_products');
      if (p) {
        try { localProds = JSON.parse(p); } catch (e) {}
      } else {
        localProds = getMockData.products();
        localStorage.setItem('kh_products', JSON.stringify(localProds));
      }
    }

    setCategories(localCats.length > 0 ? localCats : getMockData.categories());
    setProducts(localProds.length > 0 ? localProds : getMockData.products());
    setLoading(false);

    // Background fetch with 5-second timeout race
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );

      const dbPromise = (async () => {
        const { data: cData, error: cErr } = await supabase.from('categories').select('*');
        if (cErr) throw cErr;
        const { data: pData, error: pErr } = await supabase.from('products').select('*');
        if (pErr) throw pErr;
        return { cData, pData };
      })();

      const { cData, pData } = await Promise.race([dbPromise, timeoutPromise]) as any;

      if (cData && cData.length > 0) {
        setCategories(cData);
        if (typeof window !== 'undefined') {
          localStorage.setItem('kh_categories', JSON.stringify(cData));
        }
      }
      if (pData && pData.length > 0) {
        setProducts(pData);
        if (typeof window !== 'undefined') {
          localStorage.setItem('kh_products', JSON.stringify(pData));
        }
      }
    } catch (err) {
      console.warn('Categories background sync failed or timed out:', err);
    }
  };

  // توليد السلوج تلقائياً عند تغيير الاسم
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormName(val);
    
    // تحويل الاسم إلى سلوج بسيط
    const slugified = val
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\u0621-\u064A]+/g, '-') // دعم الحروف العربية والإنجليزية والأرقام معاً
      .replace(/^-+|-+$/g, '');
    
    setFormSlug(slugified);
  };

  // تعيين بيانات التعديل
  const handleEditClick = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormIcon(cat.icon || '📚');
    setFormIsActive(cat.is_active);
  };

  // إلغاء التعديل
  const handleCancelEdit = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormIcon('📚');
    setFormIsActive(true);
  };

  // حفظ القسم (إضافة / تعديل)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formSlug) return;
    setSubmitting(true);

    const categoryPayload = {
      name: formName,
      slug: formSlug,
      icon: formIcon,
      is_active: formIsActive
    };

    try {
      if (editingCategory) {
        // تعديل
        try {
          const { error: dbError } = await supabase.from('categories').update(categoryPayload).eq('id', editingCategory.id);
          if (dbError) throw dbError;
        } catch (dbErr) {
          console.warn('Database update failed, fallback to local storage:', dbErr);
        }

        // Sync with LocalStorage
        if (typeof window !== 'undefined') {
          const local = localStorage.getItem('kh_categories');
          if (local) {
            try {
              const parsed = JSON.parse(local);
              const updated = parsed.map((c: any) => c.id === editingCategory.id ? { ...c, ...categoryPayload } : c);
              localStorage.setItem('kh_categories', JSON.stringify(updated));

              // مزامنة الملف على الخادم
              fetch('/api/sync-mock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'kh_categories', data: updated })
              }).catch(err => console.error('Failed to sync categories:', err));
            } catch (e) {
              console.error(e);
            }
          }
        }

        setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, ...categoryPayload } : c));
        alert('تم تعديل القسم بنجاح!');
      } else {
        // إضافة
        const newId = `cat-${Date.now()}`;
        const newCategory = { id: newId, ...categoryPayload };

        try {
          const { error: dbError } = await supabase.from('categories').insert([newCategory]);
          if (dbError) throw dbError;
        } catch (dbErr) {
          console.warn('Database insert failed, fallback to local storage:', dbErr);
        }

        // Sync with LocalStorage
        if (typeof window !== 'undefined') {
          const local = localStorage.getItem('kh_categories');
          let allCats = [];
          if (local) {
            try {
              allCats = JSON.parse(local);
            } catch (e) {
              console.error(e);
            }
          } else {
            allCats = getMockData.categories();
          }
          allCats.push(newCategory);
          localStorage.setItem('kh_categories', JSON.stringify(allCats));

          // مزامنة الملف على الخادم
          fetch('/api/sync-mock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'kh_categories', data: allCats })
          }).catch(err => console.error('Failed to sync categories:', err));
        }

        setCategories(prev => [...prev, newCategory]);
        alert('تم إضافة القسم بنجاح!');
      }
      handleCancelEdit();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ القسم.');
    } finally {
      setSubmitting(false);
    }
  };

  // التبديل السريع للنشط (Toggle Active)
  const toggleActive = async (cat: Category) => {
    const newVal = !cat.is_active;
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: newVal } : c));
    try {
      await supabase.from('categories').update({ is_active: newVal }).eq('id', cat.id);
    } catch (err) {
      console.error(err);
    }

    // مزامنة التغييرات محلياً ومع الخادم
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('kh_categories');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          const updated = parsed.map((c: any) => c.id === cat.id ? { ...c, is_active: newVal } : c);
          localStorage.setItem('kh_categories', JSON.stringify(updated));

          fetch('/api/sync-mock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'kh_categories', data: updated })
          }).catch(err => console.error('Failed to sync categories:', err));
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  // حذف قسم
  const handleDeleteCategory = async (catId: string) => {
    const associatedCount = products.filter(p => p.category_id === catId).length;
    if (associatedCount > 0) {
      alert(`لا يمكن حذف هذا القسم لأنه يحتوي على ${associatedCount} من المنتجات المرتبطة به. يرجى نقل المنتجات أولاً.`);
      return;
    }

    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا القسم؟')) return;

    try {
      await supabase.from('categories').delete().eq('id', catId);
      setCategories(prev => prev.filter(c => c.id !== catId));

      // مزامنة التغييرات محلياً ومع الخادم
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem('kh_categories');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            const updated = parsed.filter((c: any) => c.id !== catId);
            localStorage.setItem('kh_categories', JSON.stringify(updated));

            fetch('/api/sync-mock', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key: 'kh_categories', data: updated })
            }).catch(err => console.error('Failed to sync categories:', err));
          } catch (e) {
            console.error(e);
          }
        }
      }

      alert('تم حذف القسم بنجاح.');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الحذف.');
    }
  };

  // خيارات سريعة للأيقونات والرموز التعبيرية
  const emojis = ['📚', '✏️', '📖', '🎨', '🧩', '📐', '🎒', '🧪', '🧭', '🧸', '💻', '📈', '🗒️'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" dir="rtl">
      
      {/* الجزء الأول: نموذج الإضافة / التعديل (Side Form Card) */}
      <div className="bg-[#F7F8FA] p-5 rounded-[16px] border border-slate-300 h-fit space-y-4 lg:col-span-1 shadow-2xs">
        <div className="space-y-1 text-right">
          <h3 className="text-base font-black text-slate-900 font-arabic flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#2E7FD9]" />
            <span>{editingCategory ? 'تعديل بيانات القسم' : 'إنشاء قسم جديد'}</span>
          </h3>
          <p className="text-xs text-slate-500 font-arabic">أضف رمزاً تعبيرياً واسماً مميزاً للقسم</p>
        </div>

        <form onSubmit={handleSaveCategory} className="space-y-4 text-right">
          
          {/* اختيار الأيقونة */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-900 font-arabic">أيقونة القسم (Emoji)</span>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white rounded-[12px] border border-slate-300 flex items-center justify-center text-3xl shadow-xs select-none">
                {formIcon}
              </div>
              
              <div className="flex-1 flex flex-wrap gap-1 bg-white p-2 rounded-[12px] border border-slate-300 max-h-[80px] overflow-y-auto scrollbar-none">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormIcon(emoji)}
                    className={`w-7 h-7 flex items-center justify-center rounded-[6px] text-base hover:bg-[#2E7FD9]/10 transition-colors ${
                      formIcon === emoji ? 'bg-[#2E7FD9]/20 font-bold' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Input
            label="اسم القسم بالعربية"
            placeholder="مثال: مستلزمات الرسم والتلوين"
            value={formName}
            onChange={handleNameChange}
            required
          />

          <Input
            label="الرابط الفرعي (Slug - يولّد تلقائياً)"
            placeholder="drawing-supplies"
            value={formSlug}
            onChange={(e) => setFormSlug(e.target.value)}
            required
            className="font-english"
          />

          {/* مفتاح التفعيل النشط */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-900 font-arabic">الحالة الافتراضية للقسم</span>
            <button
              type="button"
              onClick={() => setFormIsActive(!formIsActive)}
              className="flex items-center gap-2 py-2 px-3 border border-slate-300 rounded-[12px] bg-white hover:bg-slate-100 transition-colors justify-between text-slate-800 w-full font-bold text-xs"
            >
              <span className="text-xs font-arabic">عرض في تصفح الموقع</span>
              {formIsActive ? <ToggleRight className="w-6 h-6 text-emerald-600" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
            </button>
          </div>

          {/* أزرار الحفظ */}
          <div className="flex gap-2 border-t border-slate-200 pt-3">
            {editingCategory && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                className="flex-1 font-arabic border-slate-300 text-slate-700"
              >
                إلغاء
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="flex-1 font-arabic"
              disabled={submitting}
            >
              {submitting ? 'جاري الحفظ...' : (editingCategory ? 'حفظ التعديلات' : 'إضافة القسم')}
            </Button>
          </div>

        </form>
      </div>

      {/* الجزء الثاني: جدول وعرض الأقسام (Main Table) */}
      <div className="bg-[#F7F8FA] p-5 rounded-[16px] border border-slate-300 lg:col-span-2 flex flex-col gap-4 shadow-2xs">
        <div className="space-y-1 text-right">
          <h3 className="text-base font-black text-slate-900 font-arabic">أقسام المتجر المتاحة</h3>
          <p className="text-xs text-slate-500 font-arabic">ترتيب وحصر لأقسام المتجر وحجم المنتجات المرتبطة بها</p>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-800">
            <svg className="animate-spin h-8 w-8 text-[#2E7FD9]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-bold font-arabic text-sm">جاري التحميل...</span>
          </div>
        ) : categories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="bg-slate-200/60 border-b border-slate-300 text-slate-900 font-arabic">
                  <th className="py-4 px-5 font-bold">الأيقونة</th>
                  <th className="py-4 px-5 font-bold">اسم القسم</th>
                  <th className="py-4 px-5 font-bold">الرابط فرعي (Slug)</th>
                  <th className="py-4 px-5 font-bold">عدد المنتجات</th>
                  <th className="py-4 px-5 font-bold text-center">حالة العرض</th>
                  <th className="py-4 px-5 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-slate-300">
                {categories.map((cat) => {
                  const productCount = products.filter(p => p.category_id === cat.id).length;

                  return (
                    <tr key={cat.id} className="hover:bg-slate-100/70 transition-colors">
                      <td className="py-3.5 px-5 text-2xl select-none">
                        {cat.icon || '📚'}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-800 font-arabic">
                        {cat.name}
                      </td>
                      <td className="py-3.5 px-5 font-english text-slate-400 text-xs">
                        /{cat.slug}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2 py-0.5 rounded-[6px] bg-amber-light text-ink-soft font-bold font-english text-xs border border-amber/10">
                          {productCount} منتج
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={() => toggleActive(cat)}
                          className={`p-1.5 transition-colors ${
                            cat.is_active ? 'text-sage' : 'text-slate-300'
                          }`}
                        >
                          {cat.is_active ? (
                            <ToggleRight className="w-7 h-7" />
                          ) : (
                            <ToggleLeft className="w-7 h-7" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEditClick(cat)}
                            className="p-1.5 text-slate-500 bg-slate-50 rounded-[8px] hover:bg-amber/10 hover:text-amber transition-colors"
                            title="تعديل القسم"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 text-slate-500 bg-slate-50 rounded-[8px] hover:bg-rose-50 hover:text-rose-500 transition-colors"
                            title="حذف القسم"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-slate-400 font-arabic text-sm">
            لا توجد أقسام مسجلة في لوحة التحكم بعد.
          </div>
        )}
      </div>

    </div>
  );
}
