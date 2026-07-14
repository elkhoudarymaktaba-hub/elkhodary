// app/admin/settings/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { 
  Settings, Image as ImageIcon, CreditCard, ToggleLeft, ToggleRight, 
  Save, AlertTriangle, ShieldCheck, Link2, MonitorPlay, BookOpen, Layers,
  Star, Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getMockData } from '@/lib/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { showToast } from '@/lib/toast';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. الهوية البصرية والمطورين
  const [storeName, setStoreName] = useState('مكتبة الخضري');
  const [logoUrl, setLogoUrl] = useState('');
  const [devName, setDevName] = useState('حلول الخضري التقنية');
  const [devUrl, setDevUrl] = useState('https://elkhodary-dev.com');
  const [topRibbonText, setTopRibbonText] = useState('عروض العودة للمدارس: شحن مجاني لكافة المحافظات للطلبات بقيمة 500 ج.م أو أكثر!');
  
  // الباقة الترويجية المختارة
  const [boxes, setBoxes] = useState<any[]>([]);
  const [featuredBoxId, setFeaturedBoxId] = useState('');

  // إعدادات كارت البطل بالصفحة الرئيسية
  const [products, setProducts] = useState<any[]>([]);
  const [heroCardType, setHeroCardType] = useState<'box' | 'product'>('box');
  const [heroCardId, setHeroCardId] = useState('');

  // إعدادات بانر صانع الصناديق بالصفحة الرئيسية
  const [boxBuilderTitle, setBoxBuilderTitle] = useState('اصنع باقتك المدرسية المخصصة بنفسك!');
  const [boxBuilderDesc, setBoxBuilderDesc] = useState('لا تتقيد بالباقات الجاهزة. اختر الكشكول، القلم، المسطرة، وكل ما تحتاجه بالكميات التي تناسبك تماماً، ودع الباقي علينا لتعبئته وتوصيله لباب منزلك.');
  const [boxBuilderImage, setBoxBuilderImage] = useState('');
  const [boxBuilderStep1, setBoxBuilderStep1] = useState('اختر المرحلة الدراسية');
  const [boxBuilderStep2, setBoxBuilderStep2] = useState('عدّل وزد الأدوات والكميات');
  const [boxBuilderStep3, setBoxBuilderStep3] = useState('أضف الصندوق للسلة');
  const [boxBuilderImg1, setBoxBuilderImg1] = useState('');
  const [boxBuilderImg2, setBoxBuilderImg2] = useState('');
  const [boxBuilderImg3, setBoxBuilderImg3] = useState('');
  const [boxBuilderImg4, setBoxBuilderImg4] = useState('');
  const [boxBuilderImg5, setBoxBuilderImg5] = useState('');
  const [boxBuilderImg6, setBoxBuilderImg6] = useState('');

  // 2. بوابات الدفع
  const [codActive, setCodActive] = useState(true);

  // 3. وضع الصيانة
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // 4. إدارة التقييمات والآراء
  const [adminReviews, setAdminReviews] = useState<any[]>([]);
  const [selectedReviewProductId, setSelectedReviewProductId] = useState('');
  const [newAdminReviewName, setNewAdminReviewName] = useState('');
  const [newAdminReviewCity, setNewAdminReviewCity] = useState('');
  const [newAdminReviewRating, setNewAdminReviewRating] = useState(5);
  const [newAdminReviewText, setNewAdminReviewText] = useState('');
  const [newAdminReviewVerified, setNewAdminReviewVerified] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // 1. Fetch site settings
      const { data } = await supabase.from('site_settings').select('*');
      if (data && data.length > 0) {
        const nameObj = data.find((s: any) => s.key === 'store_name');
        const logoObj = data.find((s: any) => s.key === 'logo_url');
        const devNameObj = data.find((s: any) => s.key === 'developer_name');
        const devUrlObj = data.find((s: any) => s.key === 'developer_url');
        const maintenanceObj = data.find((s: any) => s.key === 'maintenance_mode');
        const topRibbonObj = data.find((s: any) => s.key === 'top_ribbon_text');
        const featuredBoxObj = data.find((s: any) => s.key === 'featured_box_id');
        const heroTypeObj = data.find((s: any) => s.key === 'hero_card_type');
        const heroIdObj = data.find((s: any) => s.key === 'hero_card_id');
        const boxTitleObj = data.find((s: any) => s.key === 'box_builder_title');
        const boxDescObj = data.find((s: any) => s.key === 'box_builder_desc');
        const boxImageObj = data.find((s: any) => s.key === 'box_builder_image');
        const boxStep1Obj = data.find((s: any) => s.key === 'box_builder_step1');
        const boxStep2Obj = data.find((s: any) => s.key === 'box_builder_step2');
        const boxStep3Obj = data.find((s: any) => s.key === 'box_builder_step3');
        const boxImg1Obj = data.find((s: any) => s.key === 'box_builder_img1');
        const boxImg2Obj = data.find((s: any) => s.key === 'box_builder_img2');
        const boxImg3Obj = data.find((s: any) => s.key === 'box_builder_img3');
        const boxImg4Obj = data.find((s: any) => s.key === 'box_builder_img4');
        const boxImg5Obj = data.find((s: any) => s.key === 'box_builder_img5');
        const boxImg6Obj = data.find((s: any) => s.key === 'box_builder_img6');

        if (nameObj) setStoreName(nameObj.value);
        if (logoObj) setLogoUrl(logoObj.value);
        if (devNameObj) setDevName(devNameObj.value);
        if (devUrlObj) setDevUrl(devUrlObj.value);
        if (maintenanceObj) setMaintenanceMode(maintenanceObj.value === 'true');
        if (topRibbonObj) setTopRibbonText(topRibbonObj.value);
        if (featuredBoxObj) setFeaturedBoxId(featuredBoxObj.value);
        if (heroTypeObj) setHeroCardType(heroTypeObj.value as any);
        if (heroIdObj) setHeroCardId(heroIdObj.value);
        if (boxTitleObj) setBoxBuilderTitle(boxTitleObj.value);
        if (boxDescObj) setBoxBuilderDesc(boxDescObj.value);
        if (boxImageObj) setBoxBuilderImage(boxImageObj.value);
        if (boxStep1Obj) setBoxBuilderStep1(boxStep1Obj.value);
        if (boxStep2Obj) setBoxBuilderStep2(boxStep2Obj.value);
        if (boxStep3Obj) setBoxBuilderStep3(boxStep3Obj.value);
        if (boxImg1Obj) setBoxBuilderImg1(boxImg1Obj.value);
        if (boxImg2Obj) setBoxBuilderImg2(boxImg2Obj.value);
        if (boxImg3Obj) setBoxBuilderImg3(boxImg3Obj.value);
        if (boxImg4Obj) setBoxBuilderImg4(boxImg4Obj.value);
        if (boxImg5Obj) setBoxBuilderImg5(boxImg5Obj.value);
        if (boxImg6Obj) setBoxBuilderImg6(boxImg6Obj.value);
      }

      // 2. Fetch active boxes list
      const { data: boxesData } = await supabase.from('boxes').select('id, name').eq('is_active', true);
      if (boxesData) {
        setBoxes(boxesData);
      } else {
        setBoxes(getMockData.boxes() || []);
      }

      // 3. Fetch active products list
      const { data: productsData } = await supabase.from('products').select('id, name').eq('is_active', true);
      if (productsData) {
        setProducts(productsData);
      } else {
        setProducts(getMockData.products() || []);
      }
    } catch (err) {
      // Fallback للـ LocalStorage
      const settings = getMockData.settings();
      setStoreName(settings.store_name);
      setLogoUrl(settings.logo_url);
      setDevName(settings.developer_name);
      setDevUrl(settings.developer_url);
      setMaintenanceMode(settings.maintenance_mode === 'true');
      setTopRibbonText(settings.top_ribbon_text || 'عروض العودة للمدارس: شحن مجاني لكافة المحافظات للطلبات بقيمة 500 ج.م أو أكثر!');
      setFeaturedBoxId(settings.featured_box_id || '');
      setHeroCardType((settings.hero_card_type || 'box') as any);
      setHeroCardId(settings.hero_card_id || '');
      setBoxes(getMockData.boxes() || []);
      setProducts(getMockData.products() || []);
      setBoxBuilderTitle(settings.box_builder_title || 'اصنع باقتك المدرسية المخصصة بنفسك!');
      setBoxBuilderDesc(settings.box_builder_desc || 'لا تتقيد بالباقات الجاهزة. اختر الكشكول، القلم، المسطرة، وكل ما تحتاجه بالكميات التي تناسبك تماماً، ودع الباقي علينا لتعبئته وتوصيله لباب منزلك.');
      setBoxBuilderImage(settings.box_builder_image || '');
      setBoxBuilderStep1(settings.box_builder_step1 || 'اختر المرحلة الدراسية');
      setBoxBuilderStep2(settings.box_builder_step2 || 'عدّل وزد الأدوات والكميات');
      setBoxBuilderStep3(settings.box_builder_step3 || 'أضف الصندوق للسلة');
      setBoxBuilderImg1(settings.box_builder_img1 || '');
      setBoxBuilderImg2(settings.box_builder_img2 || '');
      setBoxBuilderImg3(settings.box_builder_img3 || '');
      setBoxBuilderImg4(settings.box_builder_img4 || '');
      setBoxBuilderImg5(settings.box_builder_img5 || '');
      setBoxBuilderImg6(settings.box_builder_img6 || '');
    }
    await fetchAdminReviews();
    setLoading(false);
  };

  const fetchAdminReviews = async () => {
    try {
      const { data } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (data) {
        setAdminReviews(data);
        return;
      }
    } catch (e) {
      console.error(e);
    }
    
    // Fallback: LocalStorage
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('kh_reviews');
      if (local) {
        try {
          setAdminReviews(JSON.parse(local));
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const handleAddAdminReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewProductId || !newAdminReviewName.trim() || !newAdminReviewText.trim()) {
      showToast('يرجى تحديد المنتج وكتابة اسم العميل ونص التقييم!', 'error');
      return;
    }

    const prod = products.find(p => p.id === selectedReviewProductId);
    const bx = boxes.find(b => b.id === selectedReviewProductId);
    const prodName = prod ? prod.name : (bx ? bx.name : 'منتج غير معروف');

    const reviewObj = {
      id: `rev-${Date.now()}`,
      product_id: selectedReviewProductId,
      product_name: prodName,
      customer_name: newAdminReviewName,
      city: newAdminReviewCity || 'مصر',
      rating: newAdminReviewRating,
      comment: newAdminReviewText,
      created_at: new Date().toISOString(),
      is_verified: newAdminReviewVerified
    };

    try {
      await supabase.from('reviews').insert([reviewObj]);
    } catch (e) {
      console.error(e);
    }

    // Save to LocalStorage
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('kh_reviews');
      let allReviews = [];
      if (local) {
        try {
          allReviews = JSON.parse(local);
        } catch (e) {
          console.error(e);
        }
      }
      allReviews.unshift(reviewObj);
      localStorage.setItem('kh_reviews', JSON.stringify(allReviews));
      setAdminReviews(allReviews);
    }

    setNewAdminReviewName('');
    setNewAdminReviewCity('');
    setNewAdminReviewText('');
    setNewAdminReviewRating(5);
    setSelectedReviewProductId('');
    showToast('تم إضافة التقييم بنجاح وعرضه على المنتج!', 'success');
  };

  const handleDeleteAdminReview = async (reviewId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;

    try {
      await supabase.from('reviews').delete().eq('id', reviewId);
    } catch (e) {
      console.error(e);
    }

    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('kh_reviews');
      let allReviews = [];
      if (local) {
        try {
          allReviews = JSON.parse(local);
        } catch (e) {
          console.error(e);
        }
      }
      const updated = allReviews.filter((r: any) => r.id !== reviewId);
      localStorage.setItem('kh_reviews', JSON.stringify(updated));
      setAdminReviews(updated);
    }

    showToast('تم حذف التقييم بنجاح!', 'success');
  };

  // لوجو المتجر - رفع صورة وتحويلها إلى base64 لضمان العرض 100%
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const file = e.target.files[0];
      
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setLogoUrl(base64);
      showToast('تم تحديث الشعار بنجاح! يرجى الضغط على زر حفظ التعديلات لحفظه نهائياً.', 'success');
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء قراءة ملف الشعار.', 'error');
    }
  };

  // صورة قسم صانع الصناديق - رفع صورة وتحويلها إلى base64 لضمان العرض 100%
  const handleBoxBuilderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const file = e.target.files[0];
      
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setBoxBuilderImage(base64);
      showToast('تم تحميل صورة بانر صانع الصناديق بنجاح! يرجى حفظ التعديلات لحفظها نهائياً.', 'success');
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء قراءة ملف الصورة.', 'error');
    }
  };

  // صورة للمربعات الستة - رفع صورة وتحويلها إلى base64 لضمان العرض 100%
  const handleSlotImageUpload = (index: number) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const file = e.target.files[0];
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      if (index === 1) setBoxBuilderImg1(base64);
      if (index === 2) setBoxBuilderImg2(base64);
      if (index === 3) setBoxBuilderImg3(base64);
      if (index === 4) setBoxBuilderImg4(base64);
      if (index === 5) setBoxBuilderImg5(base64);
      if (index === 6) setBoxBuilderImg6(base64);
      
      showToast(`تم تحميل صورة المربع ${index} بنجاح!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء تحميل ملف الصورة.', 'error');
    }
  };

  // حفظ جميع الإعدادات العامة
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updates = [
      { key: 'store_name', value: storeName },
      { key: 'logo_url', value: logoUrl },
      { key: 'developer_name', value: devName },
      { key: 'developer_url', value: devUrl },
      { key: 'maintenance_mode', value: String(maintenanceMode) },
      { key: 'top_ribbon_text', value: topRibbonText },
      { key: 'featured_box_id', value: featuredBoxId },
      { key: 'hero_card_type', value: heroCardType },
      { key: 'hero_card_id', value: heroCardId },
      { key: 'box_builder_title', value: boxBuilderTitle },
      { key: 'box_builder_desc', value: boxBuilderDesc },
      { key: 'box_builder_image', value: boxBuilderImage },
      { key: 'box_builder_step1', value: boxBuilderStep1 },
      { key: 'box_builder_step2', value: boxBuilderStep2 },
      { key: 'box_builder_step3', value: boxBuilderStep3 },
      { key: 'box_builder_img1', value: boxBuilderImg1 },
      { key: 'box_builder_img2', value: boxBuilderImg2 },
      { key: 'box_builder_img3', value: boxBuilderImg3 },
      { key: 'box_builder_img4', value: boxBuilderImg4 },
      { key: 'box_builder_img5', value: boxBuilderImg5 },
      { key: 'box_builder_img6', value: boxBuilderImg6 }
    ];

    try {
      await supabase.from('site_settings').upsert(updates);
      
      // مزامنة موك داتا محلياً وتحديث الكوكي لعمل الـ middleware
      const settings = getMockData.settings();
      const updatedSettings = {
        ...settings,
        store_name: storeName,
        logo_url: logoUrl,
        developer_name: devName,
        developer_url: devUrl,
        maintenance_mode: String(maintenanceMode),
        top_ribbon_text: topRibbonText,
        featured_box_id: featuredBoxId,
        hero_card_type: heroCardType,
        hero_card_id: heroCardId,
        box_builder_title: boxBuilderTitle,
        box_builder_desc: boxBuilderDesc,
        box_builder_image: boxBuilderImage,
        box_builder_step1: boxBuilderStep1,
        box_builder_step2: boxBuilderStep2,
        box_builder_step3: boxBuilderStep3,
        box_builder_img1: boxBuilderImg1,
        box_builder_img2: boxBuilderImg2,
        box_builder_img3: boxBuilderImg3,
        box_builder_img4: boxBuilderImg4,
        box_builder_img5: boxBuilderImg5,
        box_builder_img6: boxBuilderImg6
      };
      
      // حفظ الإعدادات في localStorage لضمان التحديث اللحظي للعميل
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('kh_settings', JSON.stringify(updatedSettings));
      }

      // تحديث كوكي وضع الصيانة للميدل وير
      if (maintenanceMode) {
        document.cookie = "kh_maintenance_mode=true; Path=/; Max-Age=31536000; SameSite=Lax;";
      } else {
        document.cookie = "kh_maintenance_mode=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      }

      // حفظ القيم في موك داتا
      getMockData.settings = () => updatedSettings;

      // إرسال حدث مخصص للهيدر ليقوم بالتحديث فورياً
      window.dispatchEvent(new Event('settingsUpdated'));

      showToast('تم حفظ إعدادات المتجر وهوية العلامة التجارية بنجاح!', 'success');
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء حفظ الإعدادات.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-right font-arabic" dir="rtl">
      
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-ink">
          <svg className="animate-spin h-8 w-8 text-amber" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="font-bold text-sm">جاري جلب الإعدادات العامة...</span>
        </div>
      ) : (
        
        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* العمود الأول: الهوية وضع الصيانة (Left Column) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. هوية المتجر (Store Identity Card) */}
            <div className="bg-white rounded-[16px] shadow-premium border border-[#E7DCC2] p-6 space-y-5">
              <h3 className="text-base font-bold text-ink border-r-4 border-amber pr-2">هوية وشعار المتجر</h3>
              
              {/* شعار المتجر رفع ومعاينة */}
              <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-50/50 p-4 border border-slate-100 rounded-[12px]">
                <div className="w-20 h-20 bg-white border rounded-[16px] flex items-center justify-center text-3xl shadow-sm shrink-0 overflow-hidden">
                  {logoUrl && logoUrl !== 'null' && logoUrl !== '' ? (
                    <img src={logoUrl} alt="Store logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <div className="space-y-2 flex-1 text-center sm:text-right">
                  <span className="text-xs font-bold text-slate-700 block">شعار العلامة التجارية (Logo)</span>
                  <p className="text-[10px] text-slate-400">يفضل صورة مربعة بامتداد PNG ذات خلفية شفافة.</p>
                  <label className="inline-flex px-4 py-1.5 bg-white border border-amber/20 hover:bg-amber-light/30 text-xs font-bold text-amber rounded-[8px] cursor-pointer transition-all">
                    <span>تغيير الشعار</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="اسم المتجر بالعربية"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                />
                
                {/* رابط الشعار المباشر */}
                <Input
                  label="رابط الشعار المباشر (URL)"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 border-t border-slate-50 pt-4">
                <Input
                  label="نص شريط الإعلانات العلوي (الشريط الأخضر)"
                  value={topRibbonText}
                  onChange={(e) => setTopRibbonText(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                <Input
                  label="الشركة المطورة للمتجر"
                  value={devName}
                  onChange={(e) => setDevName(e.target.value)}
                />
                <div className="relative">
                  <Input
                    label="رابط موقع المطورين"
                    value={devUrl}
                    onChange={(e) => setDevUrl(e.target.value)}
                    className="pl-10 font-english"
                  />
                  <Link2 className="absolute left-3.5 bottom-3.5 w-4 h-4 text-slate-400" />
                </div>
              </div>

            </div>

            {/* 1.5. الباقة المميزة المروّج لها */}
            <div className="bg-white rounded-[16px] shadow-premium border border-[#E7DCC2] p-6 space-y-4">
              <h3 className="text-base font-bold text-ink border-r-4 border-amber pr-2 flex items-center gap-1.5">
                <BookOpen className="w-5 h-5 text-amber" />
                <span>الباقة المميزة المختارة (في تفاصيل المنتجات)</span>
              </h3>
              
              <p className="text-xs text-slate-500 leading-relaxed font-arabic">
                اختر الباقة أو الحقيبة المدرسية الجاهزة التي ترغب في إظهارها لعملائك أسفل شاشة تفاصيل أي منتج للترويج لها وزيادة المبيعات.
              </p>

              <div className="relative">
                <label className="text-xs font-bold text-slate-700 block mb-2">الباقة الترويجية النشطة</label>
                <select
                  value={featuredBoxId}
                  onChange={(e) => setFeaturedBoxId(e.target.value)}
                  className="w-full rounded-[12px] border border-slate-200 bg-white px-4 py-2.5 text-xs text-right focus:border-amber focus:outline-none"
                >
                  <option value="">-- بدون باقة ترويجية --</option>
                  {boxes.map((box) => (
                    <option key={box.id} value={box.id}>
                      {box.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 1.6. كارت البطل المعروض بالصفحة الرئيسية */}
            <div className="bg-white rounded-[16px] shadow-premium border border-[#E7DCC2] p-6 space-y-4">
              <h3 className="text-base font-bold text-ink border-r-4 border-amber pr-2 flex items-center gap-1.5">
                <MonitorPlay className="w-5 h-5 text-amber" />
                <span>المنتج أو الباقة المميزة في الصفحة الرئيسية (الهيرو)</span>
              </h3>
              
              <p className="text-xs text-slate-500 leading-relaxed font-arabic">
                اختر نوع ومسمى المنتج أو الباقة المدرسية التي ستعرض في الكارت المتحرك يسار قسم البطل (Hero Section) بالصفحة الرئيسية للمتجر.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">نوع الكارت المعروض</label>
                  <select
                    value={heroCardType}
                    onChange={(e) => {
                      setHeroCardType(e.target.value as 'box' | 'product');
                      setHeroCardId('');
                    }}
                    className="w-full rounded-[12px] border border-slate-200 bg-white px-4 py-2.5 text-xs text-right focus:border-amber focus:outline-none"
                  >
                    <option value="box">باقة مدرسية جاهزة (Box)</option>
                    <option value="product">منتج فردي (Product)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">اختر الباقة أو المنتج</label>
                  <select
                    value={heroCardId}
                    onChange={(e) => setHeroCardId(e.target.value)}
                    className="w-full rounded-[12px] border border-slate-200 bg-white px-4 py-2.5 text-xs text-right focus:border-amber focus:outline-none"
                  >
                    <option value="">-- اختر من القائمة --</option>
                    {heroCardType === 'box' ? (
                      boxes.map((box) => (
                        <option key={box.id} value={box.id}>
                          {box.name} (باقة)
                        </option>
                      ))
                    ) : (
                      products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} (منتج)
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>


            {/* 2. وضع الصيانة (Maintenance Mode Card) */}
            <div className={`bg-white rounded-[16px] shadow-premium border p-6 space-y-4 transition-all duration-300 ${
              maintenanceMode ? 'border-amber bg-amber-light/10' : 'border-[#E7DCC2]'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <h3 className="text-base font-bold text-ink border-r-4 border-amber pr-2 flex items-center gap-1.5">
                  <AlertTriangle className={`w-4 h-4 ${maintenanceMode ? 'text-amber animate-pulse' : 'text-slate-400'}`} />
                  <span>وضع الصيانة (Maintenance Mode)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)} // مستعار لتبديل الحالة
                  className="text-slate-400"
                >
                  {maintenanceMode ? (
                    <ToggleRight className="w-8 h-8 text-amber" onClick={() => setMaintenanceMode(false)} />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-300" onClick={() => setMaintenanceMode(true)} />
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed font-arabic">
                عند تفعيل وضع الصيانة، سيتم فوراً حظر جميع الزوار العاديين للموقع وتحويلهم لصفحة الصيانة الثابتة، مع السماح لك كمسؤول بالدخول وتعديل المنتجات وإجراء عمليات التهيئة بحرّية تامة.
              </p>

              {maintenanceMode && (
                <div className="bg-[#FBEBCB] border border-[#E7DCC2] text-amber-deep p-4 rounded-[12px] flex items-start gap-2.5 text-xs animate-pulse">
                  <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>
                    <strong>وضع الصيانة نشط حالياً!</strong> سيتم إظهار شريط تحذيري برتقالي في أعلى هيدر لوحة التحكم لتذكيرك بإعادة فتح المتجر لاحقاً للجمهور.
                  </span>
                </div>
              )}
            </div>

            {/* ⭐ إدارة التقييمات والآراء (Reviews Management Card) */}
            <div className="bg-white rounded-[16px] shadow-premium border border-[#E7DCC2] p-6 space-y-6">
              <h3 className="text-base font-bold text-ink border-r-4 border-amber pr-2 flex items-center gap-1.5">
                <Star className="w-5 h-5 text-amber fill-amber" />
                <span>إدارة وإضافة تقييمات العملاء</span>
              </h3>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-[12px] space-y-4">
                <h4 className="text-xs font-bold text-slate-700 font-arabic">إضافة تقييم جديد يدويًا (كتقييم موثق)</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">اختر المنتج/الباقة</label>
                    <select
                      value={selectedReviewProductId}
                      onChange={(e) => setSelectedReviewProductId(e.target.value)}
                      className="w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-xs text-right focus:border-amber focus:outline-none"
                    >
                      <option value="">-- اختر المنتج/الباقة --</option>
                      <optgroup label="الباقات الجاهزة">
                        {boxes.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="المنتجات الفردية">
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">اسم العميل</label>
                    <input
                      type="text"
                      placeholder="مثال: يوسف أحمد"
                      value={newAdminReviewName}
                      onChange={(e) => setNewAdminReviewName(e.target.value)}
                      className="w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-xs text-right focus:border-amber focus:outline-none font-arabic"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">المحافظة / المدينة</label>
                    <input
                      type="text"
                      placeholder="مثال: القاهرة"
                      value={newAdminReviewCity}
                      onChange={(e) => setNewAdminReviewCity(e.target.value)}
                      className="w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-xs text-right focus:border-amber focus:outline-none font-arabic"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">التقييم (النجوم)</label>
                    <select
                      value={newAdminReviewRating}
                      onChange={(e) => setNewAdminReviewRating(Number(e.target.value))}
                      className="w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-xs text-right focus:border-amber focus:outline-none"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (5 نجوم)</option>
                      <option value="4">⭐⭐⭐⭐ (4 نجوم)</option>
                      <option value="3">⭐⭐⭐ (3 نجوم)</option>
                      <option value="2">⭐⭐ (نجمتان)</option>
                      <option value="1">⭐ (نجمة واحدة)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-3 h-[58px]">
                    <span className="text-xs font-bold text-slate-700">مشتري مؤكد وعميل حقيقي</span>
                    <button
                      type="button"
                      onClick={() => setNewAdminReviewVerified(!newAdminReviewVerified)}
                    >
                      {newAdminReviewVerified ? (
                        <ToggleRight className="w-8 h-8 text-sage" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-slate-300" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">نص التعليق / التقييم</label>
                  <textarea
                    rows={2}
                    placeholder="اكتب تعليق التقييم هنا..."
                    value={newAdminReviewText}
                    onChange={(e) => setNewAdminReviewText(e.target.value)}
                    className="w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-xs text-right focus:border-amber focus:outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddAdminReview}
                    className="px-5 py-2 bg-amber hover:bg-amber-deep text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    إضافة التقييم المعروض
                  </button>
                </div>
              </div>

              {/* قائمة التقييمات الحالية */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 font-arabic">الآراء والتقييمات الحالية ({adminReviews.length})</h4>
                
                {adminReviews.length > 0 ? (
                  <div className="border border-slate-100 rounded-xl overflow-hidden max-h-64 overflow-y-auto no-scrollbar">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                        <tr>
                          <th className="p-3 font-bold">المنتج</th>
                          <th className="p-3 font-bold">العميل</th>
                          <th className="p-3 font-bold text-center">التقييم</th>
                          <th className="p-3 font-bold">التعليق</th>
                          <th className="p-3 font-bold text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {adminReviews.map((rev) => (
                          <tr key={rev.id} className="hover:bg-slate-50/40">
                            <td className="p-3 font-bold truncate max-w-[120px]">{rev.product_name}</td>
                            <td className="p-3 truncate max-w-[100px]">
                              <div>
                                <span className="block font-bold">{rev.customer_name}</span>
                                {rev.city && <span className="block text-[9.5px] text-slate-400 font-bold">{rev.city}</span>}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <span className="font-bold text-amber font-numbers">{rev.rating}</span>
                              <span className="text-[9px] text-slate-400">/5</span>
                            </td>
                            <td className="p-3 text-slate-500 truncate max-w-[200px]" title={rev.comment}>
                              {rev.comment}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteAdminReview(rev.id)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    لا توجد تقييمات مضافة للمتجر حالياً.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* العمود الثاني: بوابات الدفع وحفظ التغييرات (Right Column) */}
          <div className="space-y-6">
            
            {/* 3. بوابات الدفع (Payment Gateways Card) */}
            <div className="bg-white rounded-[16px] shadow-premium border border-[#E7DCC2] p-6 space-y-4">
              <h3 className="text-base font-bold text-ink border-r-4 border-amber pr-2 flex items-center gap-1.5">
                <CreditCard className="w-5 h-5 text-amber" />
                <span>بوابات الدفع المتاحة</span>
              </h3>
              
              <div className="space-y-3.5">
                {/* الدفع عند الاستلام */}
                <div className="flex items-center justify-between p-3 border border-[#E7DCC2] rounded-[12px] bg-[#FBEBCB]/10">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800 block">الدفع عند الاستلام (COD)</span>
                    <span className="text-[10px] text-slate-400">تفعيل خيار الدفع كاش للمندوب</span>
                  </div>
                  <button type="button" onClick={() => setCodActive(!codActive)}>
                    {codActive ? <ToggleRight className="w-8 h-8 text-sage" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
                  </button>
                </div>

                {/* بوابات دفع مستقبلية (Greyed Out) */}
                <div className="p-3 border border-slate-100 rounded-[12px] bg-slate-50 flex items-center justify-between opacity-55 cursor-not-allowed select-none">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 block">الدفع بالبطاقات الائتمانية (فيزا/ماستركارد)</span>
                    <span className="text-[10px] text-slate-400">ربط بوابة دفع إلكترونية (Paymob / Stripe)</span>
                  </div>
                  <span className="bg-slate-200 text-slate-500 text-[9px] px-2 py-0.5 rounded font-bold">قريباً</span>
                </div>

                <div className="p-3 border border-slate-100 rounded-[12px] bg-slate-50 flex items-center justify-between opacity-55 cursor-not-allowed select-none">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 block">المحافظ الإلكترونية (فودافون كاش)</span>
                    <span className="text-[10px] text-slate-400">سداد الفواتير عبر رقم كاش للمتجر</span>
                  </div>
                  <span className="bg-slate-200 text-slate-500 text-[9px] px-2 py-0.5 rounded font-bold">قريباً</span>
                </div>
              </div>
            </div>

            {/* 4. كرت الحفظ النهائي */}
            <div className="bg-white rounded-[16px] shadow-premium border border-[#E7DCC2] p-5 space-y-4">
              <Button
                type="submit"
                isLoading={saving}
                className="w-full font-arabic text-base font-bold shadow-md shadow-amber/20 py-3"
              >
                <Save className="w-5 h-5 ml-2" />
                <span>حفظ التعديلات العامة</span>
              </Button>
              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                عند حفظ التغييرات سيتم تحديث ملفات تعريف الموقع، وتنعكس التحديثات على الهيدر وشاشة الزوار فوراً.
              </p>
            </div>

          </div>

        </form>
      )}

    </div>
  );
}
