// app/admin/pages/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { 
  FileText, Plus, Trash2, ArrowUp, ArrowDown, Eye, Save, 
  Sparkles, Layers, AlignLeft, Image as ImageIcon, LayoutGrid, AlertCircle,
  Star, Heart
} from 'lucide-react';
import { supabase, clearFetchCache } from '@/lib/supabase';
import { getMockData, saveMockData, PageData, PageBlock } from '@/lib/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';

export default function PageBuilderPage() {
  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState(true);

  // الصفحة المفتوحة للتعديل حالياً
  const [selectedPage, setSelectedPage] = useState<PageData | null>(null);

  // حقول تعديل الصفحة
  const [pageTitle, setPageTitle] = useState('');
  const [blocks, setBlocks] = useState<PageBlock[]>([]);

  // حالة المعاينة (Preview Modal)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [savingPage, setSavingPage] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [editorMode, setEditorMode] = useState<'visual' | 'forms'>('visual');
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
  const [draggedBoxIndex, setDraggedBoxIndex] = useState<number | null>(null);

  const getAllPageImages = () => {
    const imagesSet = new Set<string>();
    imagesSet.add('https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=60');
    imagesSet.add('https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=60');
    imagesSet.add('https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=60');
    imagesSet.add('https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&auto=format&fit=crop&q=60');
    imagesSet.add('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&auto=format&fit=crop&q=60');

    pages.forEach(p => {
      if (Array.isArray(p.blocks)) {
        p.blocks.forEach(b => {
          if (b.content?.imageUrl) {
            imagesSet.add(b.content.imageUrl);
          }
        });
      }
    });
    return Array.from(imagesSet);
  };

  const renderSharedGallery = (blockId: string, currentUrl: string) => {
    const sharedImages = getAllPageImages();
    return (
      <div className="mt-2.5 text-right space-y-1 bg-slate-50 p-2 rounded-[10px] border border-slate-100">
        <span className="text-[9px] text-slate-400 font-arabic block font-bold">🖼️ معرض الصور المشترك للربط السريع:</span>
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin select-none max-w-full">
          {sharedImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => updateBlockContent(blockId, 'imageUrl', img)}
              className={`relative w-10 h-10 rounded-[6px] overflow-hidden border-2 shrink-0 transition-all ${
                currentUrl === img ? 'border-[#2E7FD9] scale-95 shadow-sm' : 'border-slate-100 hover:border-slate-300'
              }`}
              title="تطبيق هذه الصورة للكتلة الحالية"
            >
              <img src={img} alt="Shared page pic" className="w-full h-full object-cover pointer-events-none" />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm('هل ترغب في تطبيق هذه الصورة على كافة حقول الصور في الكتل المتوفرة في هذه الصفحة؟')) {
              setBlocks(prev => prev.map(b => {
                if (b.content && 'imageUrl' in b.content) {
                  return { ...b, content: { ...b.content, imageUrl: currentUrl } };
                }
                return b;
              }));
            }
          }}
          disabled={!currentUrl}
          className="text-[8px] text-[#2E7FD9] hover:text-[#1B4F8A] font-bold hover:underline font-arabic block"
        >
          ⚙️ تطبيق الصورة على جميع حقول صور الصفحة الحالية
        </button>
      </div>
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    let pagesList: PageData[] = [];
    let categoriesList: any[] = [];

    try {
      const { data } = await supabase.from('pages').select('*');
      const dbPages = data || [];
      const uniqueDbPages: PageData[] = [];
      const seenSlugs = new Set<string>();
      dbPages.forEach((p: PageData) => {
        if (p && p.slug && p.slug !== 'products' && p.slug !== 'box-builder' && !seenSlugs.has(p.slug)) {
          seenSlugs.add(p.slug);
          if (typeof p.blocks === 'string') {
            try {
              p.blocks = JSON.parse(p.blocks);
            } catch (e) {
              p.blocks = [];
            }
          }
          uniqueDbPages.push(p);
        }
      });
      pagesList = uniqueDbPages;
      const defaultPagesList = getMockData.pages();
      const requiredSlugs = ['home', 'about', 'packages', 'contact'];
      
      // Merge in any required default pages that are missing in Supabase
      requiredSlugs.forEach(slug => {
        const dbPageIdx = pagesList.findIndex(p => p.slug === slug);
        const defaultPage = defaultPagesList.find(dp => dp.slug === slug);
        
        if (defaultPage) {
          if (dbPageIdx === -1) {
            pagesList.push(JSON.parse(JSON.stringify(defaultPage)));
          } else {
            const dbPage = pagesList[dbPageIdx];
            if (!dbPage.blocks || dbPage.blocks.length === 0) {
              pagesList[dbPageIdx] = JSON.parse(JSON.stringify(defaultPage));
            }
          }
        }
      });
      
      // Sort pages by a logical order for the editor list
      const slugOrder = ['home', 'packages', 'about', 'contact'];
      pagesList.sort((a, b) => {
        const indexA = slugOrder.indexOf(a.slug);
        const indexB = slugOrder.indexOf(b.slug);
        return (indexA !== -1 ? indexA : 99) - (indexB !== -1 ? indexB : 99);
      });
    } catch (err) {
      pagesList = getMockData.pages();
    }

    try {
      const { data: catData } = await supabase.from('categories').select('id, name');
      if (catData && catData.length > 0) {
        categoriesList = catData;
      } else {
        categoriesList = getMockData.categories() || [];
      }
    } catch (err) {
      categoriesList = getMockData.categories() || [];
    }

    setPages(pagesList);
    setCategories(categoriesList);

    let boxesList: any[] = [];
    try {
      const { data: boxData } = await supabase.from('boxes').select('*').eq('is_active', true);
      if (boxData && boxData.length > 0) {
        boxesList = boxData;
      } else {
        boxesList = getMockData.boxes() || [];
      }
    } catch (err) {
      boxesList = getMockData.boxes() || [];
    }
    setBoxes(boxesList);

    let productsList: any[] = [];
    try {
      const { data: prodData } = await supabase.from('products').select('*').eq('is_active', true);
      if (prodData && prodData.length > 0) {
        productsList = prodData;
      } else {
        productsList = getMockData.products() || [];
      }
    } catch (err) {
      productsList = getMockData.products() || [];
    }
    setProducts(productsList);

    if (pagesList.length > 0) {
      // فتح الصفحة الأولى افتراضياً
      handlePageSelect(pagesList[0]);
    }
    setLoading(false);
  };

  const handlePageSelect = (page: PageData) => {
    setSelectedPage(page);
    setPageTitle(page.title);
    
    let currentBlocks = page.blocks ? [...page.blocks].filter(b => b.type !== 'box_builder_section') : [];

    // لصفحة الباقات المدرسية: إذا كانت الصفحة فارغة، تفعيل قسم الباقات المدرسية الجاهزة تلقائياً
    if (page.slug === 'packages' && currentBlocks.length === 0) {
      currentBlocks.push({
        id: `block-pkg-${Date.now()}`,
        type: 'packages_section',
        order: 1,
        content: {
          title: 'الباقات المتاحة للطلب',
          subtitle: 'اختر الباقة المناسبة لمرحلة طفلك ووفر عناء شراء كل قطعة بمفردها',
          ctaText: 'عرض كل الباقات'
        }
      });
    }

    setBlocks(currentBlocks.sort((a, b) => a.order - b.order));
  };

  // إضافة كتلة جديدة من أي نوع
  const addBlock = (type: 'text' | 'image' | 'mixed' | 'hero' | 'stats' | 'packages_section' | 'box_builder_section' | 'contact_section' | 'products_row' | 'about_header' | 'about_story' | 'about_values' | 'box_builder_stages' | 'testimonials') => {
    const newBlock: PageBlock = {
      id: `block-${Math.random().toString(36).substring(2, 9)}`,
      type,
      order: blocks.length + 1,
      content: {
        text: type === 'text' || type === 'mixed' ? 'اكتب المحتوى الخاص بك هنا...' : '',
        imageUrl: type === 'image' || type === 'mixed' || type === 'hero' ? 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&auto=format&fit=crop&q=80' : '',
        caption: type === 'image' ? 'تعليق توضيحي أسفل الصورة' : '',
        title: type === 'packages_section' ? 'باقات المراحل الدراسية الجاهزة' : type === 'box_builder_section' ? 'اصنع صندوق مستلزماتك الدراسية بنفسك' : type === 'hero' ? 'عنوان واجهة البطل الترحيبية' : type === 'products_row' ? 'قسم المنتجات المخصصة' : type === 'box_builder_stages' ? 'اختر المرحلة الدراسية للبدء' : type === 'testimonials' ? 'آراء عائلتنا الدافئة 🎓' : '',
        subtitle: type === 'packages_section' ? 'اختر الباقة المناسبة لمرحلة طفلك ووفر عناء شراء كل قطعة بمفردها' : type === 'box_builder_section' ? 'صمم بوكس أدواتك المدرسية بنفسك واختر الكتب والقرطاسية التي تناسبك واستمتع بخصم إجمالي فوري!' : type === 'hero' ? 'عنوان فرعي يوضح أهداف الصفحة بالتفصيل' : type === 'box_builder_stages' ? 'سنقوم بتحميل باقة مقترحة مسبقاً لتسهيل عملية التخصيص عليك.' : type === 'testimonials' ? 'قالوا عن مكتبة الخضري' : '',
        ctaText: type === 'packages_section' ? 'عرض كل الباقات' : type === 'box_builder_section' ? 'ابدأ تصميم صندوقك الآن' : type === 'contact_section' ? 'تواصل معنا واتساب' : type === 'hero' ? 'تصفح الآن' : type === 'testimonials' ? 'شاركينا تقييمك وتجربتك معنا ✍️' : '',
        ctaLink: type === 'contact_section' ? 'https://wa.me/201000000000' : type === 'hero' ? '#categories' : '',
        align: type === 'mixed' ? 'right' : undefined,
        // Dynamic products row settings
        categoryId: type === 'products_row' ? 'all' : undefined,
        limit: type === 'products_row' ? 8 : undefined,
        layout: type === 'products_row' ? 'grid' : undefined,
        // إعدادات الاتصال والزر للتفاصيل
        phone: type === 'contact_section' ? '19000' : undefined,
        email: type === 'contact_section' ? 'info@alkhodary.eg' : undefined,
        address: type === 'contact_section' ? 'القاهرة، جمهورية مصر العربية' : undefined,
        work_hours: type === 'contact_section' ? 'يومياً من 9:00 ص إلى 10:00 م' : undefined,
        phone_subtext: type === 'contact_section' ? 'متاح طوال ساعات العمل للمكالمات السريعة.' : undefined,
        email_subtext: type === 'contact_section' ? 'للمراسلات العامة والاستفسارات التجارية.' : undefined,
        address_subtext: type === 'contact_section' ? 'يخدم المقر كافة عمليات الشحن والتعبئة.' : undefined,
        work_hours_subtext: type === 'contact_section' ? 'ما عدا يوم الجمعة والعطلات الرسمية.' : undefined,
        // إعدادات الإحصائيات الافتراضية
        stat1_emoji: type === 'stats' ? '🎓' : undefined,
        stat1_number: type === 'stats' ? '2000+' : undefined,
        stat1_label: type === 'stats' ? 'طالب سعيد' : undefined,
        stat2_emoji: type === 'stats' ? '📦' : undefined,
        stat2_number: type === 'stats' ? '1500+' : undefined,
        stat2_label: type === 'stats' ? 'بوكس تم تسليمه' : undefined,
        stat3_emoji: type === 'stats' ? '⭐' : undefined,
        stat3_number: type === 'stats' ? '4.9' : undefined,
        stat3_label: type === 'stats' ? 'تقييم العملاء' : undefined,
        // إعدادات مراحل صانع الصناديق
        kg_title: type === 'box_builder_stages' ? 'رياض الأطفال (KG)' : undefined,
        kg_desc: type === 'box_builder_stages' ? 'باقة تحتوي على كراسات رسم، ألوان خشب، صلصال وأقلام تلوين تناسب سن الروضة.' : undefined,
        kg_price: type === 'box_builder_stages' ? '320' : undefined,
        primary_title: type === 'box_builder_stages' ? 'المرحلة الابتدائية' : undefined,
        primary_desc: type === 'box_builder_stages' ? 'باقة تحتوي على كشاكيل كتابة عادية، أقلام رصاص، جوم ومستلزمات الحساب.' : undefined,
        primary_price: type === 'box_builder_stages' ? '480' : undefined,
        middle_title: type === 'box_builder_stages' ? 'المرحلة الإعدادية' : undefined,
        middle_desc: type === 'box_builder_stages' ? 'باقة مجهزة بأدوات الهندسة، مقلمة، كشاكيل سلك وأقلام حبر متعددة.' : undefined,
        middle_price: type === 'box_builder_stages' ? '620' : undefined,
        high_title: type === 'box_builder_stages' ? 'المرحلة الثانوية' : undefined,
        high_desc: type === 'box_builder_stages' ? 'باقة متكاملة تحوي كشاكيل جامعية كبيرة، أوراق فلوسكاب وأقلام حبر فاخرة.' : undefined,
        high_price: type === 'box_builder_stages' ? '780' : undefined,
        cta_text: type === 'box_builder_stages' ? 'تخصيص الباقة' : undefined,
        // Testimonials custom reviews defaults
        rev1_name: type === 'testimonials' ? 'ندى أحمد' : undefined,
        rev1_city: type === 'testimonials' ? 'دمياط' : undefined,
        rev1_comment: type === 'testimonials' ? 'الهدية كانت لابني في أول يوم دراسي، ملامحه وهو بيفتح العلبة وتفاصيل الأدوات لا تُقدر بثمن، متشكرة جداً.' : undefined,
        rev1_rating: type === 'testimonials' ? 5 : undefined,
        rev2_name: type === 'testimonials' ? 'سارة محمد' : undefined,
        rev2_city: type === 'testimonials' ? 'القاهرة' : undefined,
        rev2_comment: type === 'testimonials' ? 'طلبت الكتب المدرسية والمستلزمات، خامات ممتازة وتغليف فاخر ومنسق جداً، والتوصيل سريع لباب البيت.' : undefined,
        rev2_rating: type === 'testimonials' ? 5 : undefined,
        rev3_name: type === 'testimonials' ? 'مريم محمود' : undefined,
        rev3_city: type === 'testimonials' ? 'الإسكندرية' : undefined,
        rev3_comment: type === 'testimonials' ? 'الباقة المدرسية تجنن والتفاصيل والفرز نظيفة جداً. الأدوات جودتها عالية والشغل يستاهل كل قرش بجد.' : undefined,
        rev3_rating: type === 'testimonials' ? 5 : undefined,
      }
    };
    setBlocks(prev => [...prev, newBlock]);
  };

  // حذف كتلة
  const removeBlock = (id: string) => {
    if (typeof window !== 'undefined' && !window.confirm('هل أنت متأكد من رغبتك في حذف هذا القسم من الصفحة؟')) {
      return;
    }
    const filtered = blocks.filter(b => b.id !== id);
    // إعادة ترتيب قيم order
    const reordered = filtered.map((b, idx) => ({ ...b, order: idx + 1 }));
    setBlocks(reordered);
  };

  // تحريك كتلة للأعلى
  const moveBlockUp = (index: number) => {
    if (index === 0) return; // بالفعل في البداية
    const newBlocks = [...blocks];
    // تبديل الأماكن
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index - 1];
    newBlocks[index - 1] = temp;
    
    // تحديث قيم order
    const updated = newBlocks.map((b, idx) => ({ ...b, order: idx + 1 }));
    setBlocks(updated);
  };

  // تحريك كتلة للأسفل
  const moveBlockDown = (index: number) => {
    if (index === blocks.length - 1) return; // بالفعل في النهاية
    const newBlocks = [...blocks];
    // تبديل الأماكن
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index + 1];
    newBlocks[index + 1] = temp;

    // تحديث قيم order
    const updated = newBlocks.map((b, idx) => ({ ...b, order: idx + 1 }));
    setBlocks(updated);
  };

  // تعديل محتويات الكتلة
  const updateBlockContent = (id: string, key: string, val: any) => {
    setBlocks(prev => prev.map(b => {
      if (b.id === id) {
        return {
          ...b,
          content: {
            ...b.content,
            [key]: val
          }
        };
      }
      return b;
    }));
  };

  // رفع صور الكتل ودعم الـ base64 fallback
  const handleBlockImageUpload = async (blockId: string, file: File) => {
    setUploadingBlockId(blockId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `pages/${fileName}`;

      const { error } = await supabase.storage
        .from('products')
        .upload(filePath, file, { upsert: true });

      if (error) {
        throw error;
      }

      const { data: publicData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      if (publicData?.publicUrl && publicData.publicUrl.startsWith('http')) {
        updateBlockContent(blockId, 'imageUrl', publicData.publicUrl);
      }
    } catch (err) {
      console.warn('Fallback to base64 for page block image upload');
      try {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        updateBlockContent(blockId, 'imageUrl', base64);
      } catch (readErr) {
        console.error(readErr);
        alert('حدث خطأ أثناء قراءة الصورة.');
      }
    } finally {
      setUploadingBlockId(null);
    }
  };
  // رفع صور الصندوق التفاعلي (الصور الستة)
  const handleBlockSlotImageUpload = async (blockId: string, idx: number, file: File, currentImages: string[]) => {
    setUploadingBlockId(`${blockId}-slot-${idx}`);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `pages/${fileName}`;

      const { error } = await supabase.storage
        .from('products')
        .upload(filePath, file, { upsert: true });

      if (error) {
        throw error;
      }

      const { data: publicData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      if (publicData?.publicUrl && publicData.publicUrl.startsWith('http')) {
        const updatedImages = [...currentImages];
        while (updatedImages.length < 6) updatedImages.push('');
        updatedImages[idx] = publicData.publicUrl;
        updateBlockContent(blockId, 'images', updatedImages);
      }
    } catch (err) {
      console.warn('Fallback to base64 for page block slot image upload');
      try {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const updatedImages = [...currentImages];
        while (updatedImages.length < 6) updatedImages.push('');
        updatedImages[idx] = base64;
        updateBlockContent(blockId, 'images', updatedImages);
      } catch (readErr) {
        console.error(readErr);
        alert('حدث خطأ أثناء قراءة الصورة.');
      }
    } finally {
      setUploadingBlockId(null);
    }
  };
  // حذف صفحة بالكامل من قاعدة البيانات والذاكرة المحلية
  const handleDeletePage = async (slug: string, e: React.MouseEvent) => {
    e.stopPropagation(); // منع انتقال الحدث لتفادي فتح الصفحة عند الحذف
    
    // منع حذف الصفحة الرئيسية والصفحات الأساسية المهمة بدون تنبيه صارم
    const isCore = ['home', 'products', 'packages', 'box-builder', 'about', 'contact'].includes(slug);
    const message = isCore 
      ? `🚨 تنبيه هام: صفحة "${slug}" هي من الصفحات الأساسية للموقع وحذفها قد يعطل بعض الروابط الأساسية. هل أنت متأكد تماماً من رغبتك في حذفها نهائياً؟`
      : `هل أنت متأكد من رغبتك في حذف صفحة "${pages.find(p => p.slug === slug)?.title || slug}" نهائياً من الموقع وقاعدة البيانات؟`;

    if (!confirm(message)) {
      return;
    }

    try {
      const { error: dbError } = await supabase.from('pages').delete().eq('slug', slug);
      if (dbError) {
        console.warn('Supabase page delete error (RLS):', dbError.message);
      }

      // التحديث في مصفوفة الصفحات بالواجهة
      setPages(prev => prev.filter(p => p.slug !== slug));
      
      // التحديث في الذاكرة المحلية كخيار بديل
      const mockPages = getMockData.pages();
      const updatedMock = mockPages.filter(p => p.slug !== slug);
      saveMockData.pages(updatedMock);

      // إذا كانت الصفحة المفتوحة هي التي تم حذفها، نقوم بإلغاء تحديدها
      if (selectedPage?.slug === slug) {
        setSelectedPage(null);
      }

      alert('تم حذف الصفحة وتحديث الموقع بنجاح!');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء محاولة حذف الصفحة.');
    }
  };

  // حفظ الصفحة في سوبابيس
  const handleSavePage = async () => {
    if (!selectedPage) return;

    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setSavingPage(true);

    const payload = {
      slug: selectedPage.slug,
      title: pageTitle,
      blocks: blocks,
      content: (selectedPage as any).content || {},
      updated_at: new Date().toISOString()
    };

    try {
      const { error: dbError } = await supabase.from('pages').upsert(payload, { onConflict: 'slug' });
      clearFetchCache();
      if (dbError) {
        console.warn('Supabase page save error (RLS):', dbError.message);
      }
      
      // التعديل في مصفوفة الصفحات في الواجهة
      setPages(prev => prev.map(p => p.slug === selectedPage.slug ? { ...p, ...payload } : p));
      
      // حفظ في موك داتا كخطة بديلة
      const mockPages = getMockData.pages();
      const updatedMock = mockPages.map(p => p.slug === selectedPage.slug ? { ...p, ...payload } : p);
      saveMockData.pages(updatedMock);

      if (dbError) {
        alert(`تم حفظ التغييرات محلياً بنجاح! ⚠️ (تنبيه: لم يتم التحديث في قاعدة البيانات السحابية بسبب صلاحيات RLS: ${dbError.message})`);
      } else {
        alert(`تم حفظ التغييرات وتحديث صفحة "${pageTitle}" بنجاح في قاعدة البيانات!`);
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ الصفحة.');
    } finally {
      setSavingPage(false);
    }
  };

  // إنشاء صفحة جديدة فارغة
  const handleCreateNewPage = () => {
    const slug = prompt('ادخل معرف الصفحة بالإنجليزية (مثال: privacy):');
    if (!slug) return;
    const title = prompt('ادخل عنوان الصفحة بالعربية (مثال: سياسة الخصوصية):');
    if (!title) return;

    const newPage: PageData = {
      slug: slug.toLowerCase().trim().replace(/\s+/g, '-'),
      title,
      blocks: [],
      updated_at: new Date().toISOString()
    };

    setPages(prev => [...prev, newPage]);
    handlePageSelect(newPage);
  };

  const renderBlockVisual = (block: PageBlock) => {
    switch (block.type) {
      case 'hero': {
        const heroMediaType = block.content.media_type || 'image';
        const heroSelectedId = block.content.selected_id || '';
        const heroImageUrl = block.content.imageUrl || '';
        const selectedBox = heroMediaType === 'box' ? (boxes.find(b => b.id === heroSelectedId) || boxes[0]) : null;
        const selectedProd = heroMediaType === 'product' ? (products.find(p => p.id === heroSelectedId) || products[0]) : null;

        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-8 px-6 bg-slate-50 rounded-[16px] border border-paper-line text-right items-center" dir="rtl">
            {/* Right side: Text Content */}
            <div className="lg:col-span-8 space-y-4">
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200" dir="rtl">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">الشريط العلوي الصغير للكتلة:</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={block.content.badge_text ?? ''}
                    onChange={(e) => updateBlockContent(block.id, 'badge_text', e.target.value)}
                    placeholder="عرض العودة للمدارس"
                    className="w-full px-3 py-1.5 border rounded-md text-xs bg-slate-50 focus:bg-white focus:border-amber outline-none font-bold text-ink"
                  />
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">العنوان الرئيسي للبطل:</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={block.content.title ?? ''}
                    onChange={(e) => updateBlockContent(block.id, 'title', e.target.value)}
                    placeholder="مكتبة الخضري"
                    className="w-full px-3 py-1.5 border rounded-md text-sm font-black text-ink bg-slate-50 focus:bg-white focus:border-amber outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">الوصف الترحيبي:</label>
                  <textarea
                    rows={2}
                    dir="rtl"
                    value={block.content.subtitle ?? ''}
                    onChange={(e) => updateBlockContent(block.id, 'subtitle', e.target.value)}
                    placeholder="اكتشف باقات الأدوات المدرسية المخصصة لكل مرحلة."
                    className="w-full px-3 py-1.5 border rounded-md text-xs text-ink-soft bg-slate-50 focus:bg-white focus:border-amber outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">نص الزر الرئيسي:</label>
                    <input
                      type="text"
                      dir="rtl"
                      value={block.content.ctaText ?? ''}
                      onChange={(e) => updateBlockContent(block.id, 'ctaText', e.target.value)}
                      placeholder="تصفح الكتب والبوكسات"
                      className="w-full px-3 py-1.5 border rounded-md text-xs font-bold text-coral bg-slate-50 focus:bg-white focus:border-amber outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">نص الزر الثانوي:</label>
                    <input
                      type="text"
                      dir="rtl"
                      value={block.content.cta2Text ?? ''}
                      onChange={(e) => updateBlockContent(block.id, 'cta2Text', e.target.value)}
                      placeholder="الباقات المدرسية"
                      className="w-full px-3 py-1.5 border rounded-md text-xs font-bold text-ink-soft bg-slate-50 focus:bg-white focus:border-amber outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">🔗 رابط الزر الرئيسي:</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={block.content.ctaLink ?? ''}
                      onChange={(e) => updateBlockContent(block.id, 'ctaLink', e.target.value)}
                      placeholder="/boxes"
                      className="w-full px-3 py-1 border rounded-md text-[11px] font-english bg-slate-50 focus:bg-white focus:border-amber outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">🔗 رابط الزر الثانوي:</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={block.content.cta2Link ?? ''}
                      onChange={(e) => updateBlockContent(block.id, 'cta2Link', e.target.value)}
                      placeholder="/products"
                      className="w-full px-3 py-1 border rounded-md text-[11px] font-english bg-slate-50 focus:bg-white focus:border-amber outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Left Content Selector */}
              <div className="bg-amber/5 p-3 rounded-xl border border-amber/10 text-right space-y-2 mt-2">
                <span className="block text-[10px] font-bold text-ink-soft">🖥️ نوع المحتوى المعروض على اليسار في الصفحة الرئيسية:</span>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <label className="block text-slate-400 mb-1">النوع:</label>
                    <select
                      value={heroMediaType}
                      onChange={(e) => {
                        updateBlockContent(block.id, 'media_type', e.target.value);
                        updateBlockContent(block.id, 'selected_id', ''); 
                      }}
                      className="px-2 py-1 border rounded w-full bg-white text-[10px]"
                    >
                      <option value="image">🖼️ صورة مخصصة (Custom Image)</option>
                      <option value="box">📦 باقة جاهزة (Ready Box)</option>
                      <option value="product">📚 منتج مميز (Featured Product)</option>
                    </select>
                  </div>

                  {heroMediaType !== 'image' && (
                    <div>
                      <label className="block text-slate-400 mb-1">اختر العنصر:</label>
                      <select
                        value={heroSelectedId}
                        onChange={(e) => updateBlockContent(block.id, 'selected_id', e.target.value)}
                        className="px-2 py-1 border rounded w-full bg-white text-[10px]"
                      >
                        <option value="">-- اختر من القائمة --</option>
                        {heroMediaType === 'box' ? (
                          boxes.map(b => (
                            <option key={b.id} value={b.id}>📦 {b.name} ({b.base_price} ج.م)</option>
                          ))
                        ) : (
                          products.map(p => (
                            <option key={p.id} value={p.id}>📚 {p.name} ({p.price_unit} ج.م)</option>
                          ))
                        )}
                      </select>
                    </div>
                  )}
                </div>

                {heroMediaType === 'image' && (
                  <div className="text-[10px]">
                    <label className="block text-slate-400 mb-1">رابط الصورة المخصصة على اليسار:</label>
                    <input
                      type="text"
                      className="px-2 py-1 border rounded w-full font-english bg-white text-[10px]"
                      placeholder="رابط الصورة مخصصة..."
                      value={heroImageUrl}
                      onChange={(e) => updateBlockContent(block.id, 'imageUrl', e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Left side: Media Visualizer Preview */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-2 border-r border-slate-200/50">
              <span className="text-[9px] text-slate-400 mb-1 font-bold">👀 معاينة المحتوى الأيسر:</span>
              {heroMediaType === 'image' ? (
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border shadow-sm group cursor-pointer">
                  <img 
                    src={heroImageUrl || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600'} 
                    className="w-full h-full object-cover" 
                    onClick={() => document.getElementById(`file-input-${block.id}`)?.click()}
                  />
                  <input
                    id={`file-input-${block.id}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleBlockImageUpload(block.id, file);
                    }}
                  />
                  <div 
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-white text-xs font-bold font-arabic pointer-events-none"
                  >
                    <span>📷 {uploadingBlockId === block.id ? 'جاري رفع الصورة...' : 'اضغط لتغيير الصورة'}</span>
                  </div>
                  <div className="absolute bottom-1.5 right-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-auto">
                    <input 
                      type="text" 
                      placeholder="رابط الصورة الجديد..." 
                      className="px-2 py-1 text-[10px] rounded border w-full text-center font-english text-black bg-white"
                      value={heroImageUrl} 
                      onChange={(e) => updateBlockContent(block.id, 'imageUrl', e.target.value)} 
                    />
                  </div>
                </div>
              ) : heroMediaType === 'box' && selectedBox ? (
                <div className="w-full border border-paper-line bg-white rounded-notebook p-4 shadow-sm text-right space-y-2.5">
                  <div className="aspect-[16/10] bg-slate-50 rounded-lg overflow-hidden relative border border-slate-100">
                    {selectedBox.image || selectedBox.image_url ? (
                      <img src={selectedBox.image || selectedBox.image_url} className="w-full h-full object-cover animate-fade-in" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xl">📦</div>
                    )}
                    <span className="absolute top-2 right-2 bg-coral text-white text-[8px] font-bold px-2 py-0.5 rounded-full font-numbers">
                      {selectedBox.base_price} ج.م
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-coral font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
                      باقة جاهزة للتوصيل الفوري
                    </span>
                    <h4 className="font-extrabold text-xs text-ink truncate">{selectedBox.name}</h4>
                    <p className="text-[9px] text-ink-soft/60 line-clamp-1">{selectedBox.description}</p>
                  </div>
                </div>
              ) : heroMediaType === 'product' && selectedProd ? (
                <div className="w-full border border-paper-line bg-white rounded-notebook p-4 shadow-sm text-right space-y-2.5">
                  <div className="aspect-[16/10] bg-slate-50 rounded-lg overflow-hidden relative border border-slate-100">
                    {selectedProd.images?.[0] ? (
                      <img src={selectedProd.images[0]} className="w-full h-full object-cover animate-fade-in" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xl">📚</div>
                    )}
                    <span className="absolute top-2 right-2 bg-sage-deep text-white text-[8px] font-bold px-2 py-0.5 rounded-full font-numbers">
                      {selectedProd.price_unit} ج.م
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-sage-deep font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sage-deep animate-pulse" />
                      منتج مميز متوفر بالمتجر
                    </span>
                    <h4 className="font-extrabold text-xs text-ink truncate">{selectedProd.name}</h4>
                    <p className="text-[9px] text-ink-soft/60 line-clamp-1">{selectedProd.description}</p>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-xs border border-dashed rounded-lg p-6 w-full text-center">لا يوجد محتوى محدد.</div>
              )}
            </div>
          </div>
        );
      }

      case 'stats':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6 px-4 bg-white rounded-[16px] border border-paper-line text-center">
            {[1, 2, 3].map((num) => {
              const keyEmoji = `stat${num}_emoji`;
              const keyNumber = `stat${num}_number`;
              const keyLabel = `stat${num}_label`;
              
              return (
                <div key={num} className="bg-slate-50 p-4 rounded-xl space-y-2 border border-dashed border-slate-200">
                  <div className="flex justify-center items-center gap-1.5">
                    <span 
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateBlockContent(block.id, keyEmoji, e.currentTarget.innerText)}
                      className="text-lg outline-none focus:bg-amber/10 px-1 rounded cursor-pointer animate-pulse"
                    >
                      {block.content[keyEmoji] || '⭐'}
                    </span>
                    <span 
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateBlockContent(block.id, keyNumber, e.currentTarget.innerText)}
                      className="text-lg font-black text-ink font-numbers outline-none focus:bg-amber/10 px-1 rounded"
                    >
                      {block.content[keyNumber] || '0'}
                    </span>
                  </div>
                  <p 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateBlockContent(block.id, keyLabel, e.currentTarget.innerText)}
                    className="text-xs text-ink-soft/70 outline-none focus:bg-amber/10 px-1 rounded"
                  >
                    {block.content[keyLabel] || 'إحصائية'}
                  </p>
                </div>
              );
            })}
          </div>
        );

      case 'about_header':
        return (
          <div className="text-center border-b border-dashed border-paper-line pb-6 bg-white p-6 rounded-[16px] border border-paper-line">
            <div className="w-12 h-12 bg-coral/10 rounded-full flex items-center justify-center text-coral-deep mx-auto mb-4 border border-coral/10 text-xl select-none">
              📖
            </div>
            <h1 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => updateBlockContent(block.id, 'title', e.currentTarget.innerText)}
              className="text-xl sm:text-2xl font-black text-ink outline-none focus:bg-amber/10 px-2 py-0.5 rounded border border-dashed border-slate-200 hover:border-coral inline-block"
            >
              {block.content.title || 'من نحن'}
            </h1>
            <p 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => updateBlockContent(block.id, 'subtitle', e.currentTarget.innerText)}
              className="text-xs text-ink-soft/60 mt-2 font-bold outline-none focus:bg-amber/10 px-2 py-0.5 rounded border border-dashed border-slate-200 hover:border-coral max-w-md mx-auto"
            >
              {block.content.subtitle || 'عقدان من خدمة التعليم ونشر المعرفة'}
            </p>
          </div>
        );

      case 'about_story':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 bg-white rounded-[16px] border border-paper-line items-center text-right" dir="rtl">
            <div className="lg:col-span-7 space-y-4">
              <h2 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateBlockContent(block.id, 'title', e.currentTarget.innerText)}
                className="text-lg font-black text-ink outline-none focus:bg-amber/10 px-2 py-0.5 rounded border border-dashed border-slate-200 hover:border-coral inline-block"
              >
                {block.content.title || 'قصة نجاح مكتبة الخضري'}
              </h2>
              <p 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateBlockContent(block.id, 'text1', e.currentTarget.innerText)}
                className="text-xs text-ink-soft/75 leading-relaxed outline-none focus:bg-amber/10 p-2 rounded border border-dashed border-slate-200 hover:border-coral"
              >
                {block.content.text1 || 'تأسست مكتبة الخضري...'}
              </p>
              <p 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateBlockContent(block.id, 'text2', e.currentTarget.innerText)}
                className="text-xs text-ink-soft/75 leading-relaxed outline-none focus:bg-amber/10 p-2 rounded border border-dashed border-slate-200 hover:border-coral"
              >
                {block.content.text2 || 'نهدف إلى تسهيل...'}
              </p>
            </div>
            
            <div className="lg:col-span-5 relative aspect-video sm:aspect-square rounded-2xl overflow-hidden bg-paper border border-paper-line shadow-card group cursor-pointer">
              <img 
                src={block.content.imageUrl || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80"} 
                className="w-full h-full object-cover" 
                onClick={() => document.getElementById(`file-input-${block.id}`)?.click()}
              />
              <input
                id={`file-input-${block.id}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleBlockImageUpload(block.id, file);
                }}
              />
              <div 
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-white text-xs font-bold font-arabic pointer-events-none"
              >
                <span>📷 {uploadingBlockId === block.id ? 'جاري رفع الصورة...' : 'اضغط لتغيير الصورة'}</span>
              </div>
              <div className="absolute bottom-1.5 right-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-auto">
                <input 
                  type="text" 
                  placeholder="رابط الصورة الجانبية..." 
                  className="px-2 py-1 text-[10px] rounded border w-full text-center font-english text-black bg-white"
                  value={block.content.imageUrl || ''} 
                  onChange={(e) => updateBlockContent(block.id, 'imageUrl', e.target.value)} 
                />
              </div>
            </div>
          </div>
        );

      case 'about_values':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-right" dir="rtl">
            {[1, 2, 3].map((num) => {
              const keyEmoji = `card${num}_emoji`;
              const keyTitle = `card${num}_title`;
              const keyText = `card${num}_text`;
              const bgColors = ['bg-sage/10', 'bg-coral/10', 'bg-amber/10'];
              const textColors = ['text-sage-deep', 'text-coral-deep', 'text-amber-deep'];
              const borderColors = ['border-sage/20', 'border-coral/20', 'border-amber/20'];
              
              return (
                <div key={num} className="bg-paper-dark/40 p-5 rounded-card border border-paper-line space-y-3">
                  <div className={`w-8 h-8 rounded-full ${bgColors[num-1]} ${borderColors[num-1]} flex items-center justify-center ${textColors[num-1]} text-base border`}>
                    <span 
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateBlockContent(block.id, keyEmoji, e.currentTarget.innerText)}
                      className="outline-none focus:bg-amber/10 px-1 rounded cursor-pointer"
                    >
                      {block.content[keyEmoji] || '🎯'}
                    </span>
                  </div>
                  <h3 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateBlockContent(block.id, keyTitle, e.currentTarget.innerText)}
                    className="font-extrabold text-ink text-xs sm:text-sm outline-none focus:bg-amber/10 px-1.5 py-0.5 rounded border border-dashed border-slate-200"
                  >
                    {block.content[keyTitle] || 'شعار الكرت'}
                  </h3>
                  <p 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateBlockContent(block.id, keyText, e.currentTarget.innerText)}
                    className="text-[11px] text-ink-soft/70 leading-relaxed outline-none focus:bg-amber/10 p-1.5 rounded border border-dashed border-slate-200"
                  >
                    {block.content[keyText] || 'تفاصيل الكرت ومحتواه...'}
                  </p>
                </div>
              );
            })}
          </div>
        );

      case 'contact_section':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50 p-6 rounded-[16px] border border-paper-line text-right" dir="rtl">
            {/* Left: Message form preview */}
            <div className="lg:col-span-7 bg-white p-5 rounded-card border border-paper-line shadow-card space-y-4">
              <h3 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateBlockContent(block.id, 'form_title', e.currentTarget.innerText)}
                className="font-extrabold text-sm sm:text-base text-ink pr-2 border-r-4 border-coral leading-none outline-none focus:bg-amber/10 rounded"
              >
                {block.content.form_title || 'أرسل لنا رسالة'}
              </h3>
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateBlockContent(block.id, 'name_label', e.currentTarget.innerText)}
                    className="text-[10px] font-bold text-ink outline-none focus:bg-amber/10 rounded block"
                  >
                    {block.content.name_label || 'الاسم بالكامل *'}
                  </label>
                  <div className="px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-400">اكتب اسمك هنا...</div>
                </div>
                <div className="space-y-1">
                  <label 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateBlockContent(block.id, 'phone_label', e.currentTarget.innerText)}
                    className="text-[10px] font-bold text-ink outline-none focus:bg-amber/10 rounded block"
                  >
                    {block.content.phone_label || 'رقم التليفون للتواصل *'}
                  </label>
                  <div className="px-3 py-2 bg-slate-50 border rounded-md text-xs text-slate-400">مثال: 01012345678</div>
                </div>
                <div className="space-y-1">
                  <label 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateBlockContent(block.id, 'message_label', e.currentTarget.innerText)}
                    className="text-[10px] font-bold text-ink outline-none focus:bg-amber/10 rounded block"
                  >
                    {block.content.message_label || 'الرسالة *'}
                  </label>
                  <div className="px-3 py-4 bg-slate-50 border rounded-md text-xs text-slate-400">اكتب استفسارك هنا...</div>
                </div>
                <button 
                  type="button" 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateBlockContent(block.id, 'submit_label', e.currentTarget.innerText)}
                  className="w-full py-2 bg-coral text-white text-xs font-bold rounded-cta opacity-85 outline-none focus:bg-coral-deep"
                >
                  {block.content.submit_label || 'إرسال الرسالة الآن ✉️'}
                </button>
              </div>
            </div>
            
            {/* Right: Info Cards */}
            <div className="lg:col-span-5 space-y-4">
              {/* Phone Card */}
              <div className="bg-white p-4 rounded-card border border-paper-line shadow-card flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-amber/15 text-amber-deep flex items-center justify-center font-bold text-sm">📞</span>
                <div className="flex-grow">
                  <span className="block text-[9px] text-ink-soft/40 font-bold">الخط الساخن</span>
                  <span 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateBlockContent(block.id, 'phone', e.currentTarget.innerText)}
                    className="text-sm font-black text-ink font-numbers outline-none focus:bg-amber/10 px-1 rounded border border-dashed border-slate-200 block"
                  >
                    {block.content.phone || '19000'}
                  </span>
                  <span 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateBlockContent(block.id, 'phone_subtext', e.currentTarget.innerText)}
                    className="text-[9px] text-slate-400 font-arabic outline-none focus:bg-amber/10 px-1 rounded border border-dashed border-slate-200 block mt-0.5"
                  >
                    {block.content.phone_subtext || 'متاح طوال ساعات العمل للمكالمات السريعة.'}
                  </span>
                </div>
              </div>

              {/* Email Card */}
              <div className="bg-white p-4 rounded-card border border-paper-line shadow-card flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-coral/15 text-coral-deep flex items-center justify-center font-bold text-sm">✉️</span>
                <div className="flex-grow">
                  <span className="block text-[9px] text-ink-soft/40 font-bold">البريد الإلكتروني</span>
                  <span 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateBlockContent(block.id, 'email', e.currentTarget.innerText)}
                    className="text-xs font-bold text-ink outline-none focus:bg-amber/10 px-1 rounded border border-dashed border-slate-200 block"
                  >
                    {block.content.email || 'info@alkhodary.eg'}
                  </span>
                  <span 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateBlockContent(block.id, 'email_subtext', e.currentTarget.innerText)}
                    className="text-[9px] text-slate-400 font-arabic outline-none focus:bg-amber/10 px-1 rounded border border-dashed border-slate-200 block mt-0.5"
                  >
                    {block.content.email_subtext || 'للمراسلات العامة والاستفسارات التجارية.'}
                  </span>
                </div>
              </div>

              {/* Address Card */}
              <div className="bg-white p-4 rounded-card border border-paper-line shadow-card flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-sage/15 text-sage-deep flex items-center justify-center font-bold text-sm">📍</span>
                <div className="flex-grow">
                  <span className="block text-[9px] text-ink-soft/40 font-bold">المقر الرئيسي</span>
                  <span 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateBlockContent(block.id, 'address', e.currentTarget.innerText)}
                    className="text-xs font-bold text-ink outline-none focus:bg-amber/10 px-1 rounded border border-dashed border-slate-200 block"
                  >
                    {block.content.address || 'القاهرة، جمهورية مصر العربية'}
                  </span>
                  <span 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateBlockContent(block.id, 'address_subtext', e.currentTarget.innerText)}
                    className="text-xs text-slate-400 font-arabic outline-none focus:bg-amber/10 px-1 rounded border border-dashed border-slate-200 block mt-0.5"
                  >
                    {block.content.address_subtext || 'يخدم المقر كافة عمليات الشحن والتعبئة.'}
                  </span>
                </div>
              </div>

              {/* Work Hours Card */}
              <div className="bg-white p-4 rounded-card border border-paper-line shadow-card flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-sm">⏰</span>
                <div className="flex-grow">
                  <span className="block text-[9px] text-ink-soft/40 font-bold">مواعيد العمل الرسمية</span>
                  <span 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateBlockContent(block.id, 'work_hours', e.currentTarget.innerText)}
                    className="text-[11px] font-bold text-indigo-500 outline-none focus:bg-amber/10 px-1 rounded border border-dashed border-slate-200 block"
                  >
                    {block.content.work_hours || 'يومياً من 9:00 ص إلى 10:00 م'}
                  </span>
                  <span 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateBlockContent(block.id, 'work_hours_subtext', e.currentTarget.innerText)}
                    className="text-[9px] text-slate-400 font-arabic outline-none focus:bg-amber/10 px-1 rounded border border-dashed border-slate-200 block mt-0.5"
                  >
                    {block.content.work_hours_subtext || 'ما عدا يوم الجمعة والعطلات الرسمية.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'packages_section': {
        const currentBoxIds = Array.isArray(block.content.boxIds) ? block.content.boxIds : [];
        
        // Find boxes in their specific order
        const activeBoxes = currentBoxIds
          .map(id => boxes.find(b => b.id === id))
          .filter((b): b is any => !!b);
          
        // Find boxes that are not checked
        const inactiveBoxes = boxes.filter(b => !currentBoxIds.includes(b.id));

        const handleBoxDragStart = (e: React.DragEvent, index: number) => {
          setDraggedBoxIndex(index);
          e.dataTransfer.effectAllowed = 'move';
        };

        const handleBoxDragOver = (e: React.DragEvent) => {
          e.preventDefault();
        };

        const handleBoxDrop = (e: React.DragEvent, targetIndex: number) => {
          e.preventDefault();
          if (draggedBoxIndex === null || draggedBoxIndex === targetIndex) return;

          const boxIdsList = currentBoxIds.length > 0 ? [...currentBoxIds] : boxes.map(b => b.id);
          const draggedId = boxIdsList[draggedBoxIndex];
          boxIdsList.splice(draggedBoxIndex, 1);
          boxIdsList.splice(targetIndex, 0, draggedId);

          updateBlockContent(block.id, 'boxIds', boxIdsList);
          setDraggedBoxIndex(null);
        };

        const moveBoxInBlock = (idx: number, direction: 'up' | 'down') => {
          const newIds = [...currentBoxIds];
          if (direction === 'up' && idx > 0) {
            const temp = newIds[idx];
            newIds[idx] = newIds[idx - 1];
            newIds[idx - 1] = temp;
          } else if (direction === 'down' && idx < newIds.length - 1) {
            const temp = newIds[idx];
            newIds[idx] = newIds[idx + 1];
            newIds[idx + 1] = temp;
          }
          updateBlockContent(block.id, 'boxIds', newIds);
        };

        const removeBoxFromBlock = (boxId: string) => {
          const newIds = currentBoxIds.filter(id => id !== boxId);
          updateBlockContent(block.id, 'boxIds', newIds);
        };

        const addBoxToBlock = (boxId: string) => {
          if (!boxId) return;
          const newIds = [...currentBoxIds, boxId];
          updateBlockContent(block.id, 'boxIds', newIds);
        };

        return (
          <div className="bg-white p-6 rounded-card border border-paper-line text-right" dir="rtl">
            <div className="space-y-1 mb-4">
              <h3 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateBlockContent(block.id, 'title', e.currentTarget.innerText)}
                className="font-black text-sm sm:text-base text-ink outline-none focus:bg-amber/10 px-1 py-0.5 rounded border border-dashed border-slate-200 hover:border-amber inline-block"
              >
                {block.content.title || 'الصناديق المدرسية الجاهزة'}
              </h3>
              <p 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateBlockContent(block.id, 'subtitle', e.currentTarget.innerText)}
                className="text-[11px] text-ink-soft/70 outline-none focus:bg-amber/10 px-1 py-0.5 rounded border border-dashed border-slate-200 hover:border-amber"
              >
                {block.content.subtitle || 'اختر الصندوق المناسب لمرحلة طفلك ووفر عناء شراء كل قطعة بمفردها'}
              </p>
            </div>
            
            {/* Control area for sorting & adding */}
            <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 mb-6 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 gap-2">
                <span className="text-xs font-bold text-slate-700">التحكم في الصناديق المعروضة وترتيبها:</span>
                {inactiveBoxes.length > 0 && (
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <span className="text-[10px] text-slate-500 font-bold">➕ إضافة صندوق للعرض:</span>
                    <select 
                      onChange={(e) => {
                        addBoxToBlock(e.target.value);
                        e.target.value = '';
                      }}
                      className="px-2 py-1 text-[10px] border rounded bg-white font-arabic text-ink cursor-pointer focus:ring-amber focus:border-amber outline-none"
                      defaultValue=""
                    >
                      <option value="" disabled>-- اختر صندوقاً دراسياً --</option>
                      {inactiveBoxes.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {activeBoxes.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {activeBoxes.map((box, idx) => (
                    <div key={box.id} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border text-xs font-bold shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-english text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                        <span className="text-ink">{box.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveBoxInBlock(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-amber disabled:opacity-30 disabled:hover:bg-transparent"
                          title="تحريك للأعلى"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveBoxInBlock(idx, 'down')}
                          disabled={idx === activeBoxes.length - 1}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-amber disabled:opacity-30 disabled:hover:bg-transparent"
                          title="تحريك للأسفل"
                        >
                          ↓
                        </button>
                        <div className="w-px h-3 bg-slate-200 mx-1" />
                        <button
                          type="button"
                          onClick={() => removeBoxFromBlock(box.id)}
                          className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[10px] hover:bg-rose-500 hover:text-white transition-colors"
                          title="إزالة من العرض"
                        >
                          إزالة
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 text-center py-2">لا توجد باقات مضافة للعرض حالياً. اختر من القائمة بالأعلى للإضافة.</p>
              )}
            </div>

            {/* Visual Cards Display */}
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {(activeBoxes.length > 0 ? activeBoxes : boxes).map((box, index) => {
                const spineColors = ['bg-sage', 'bg-coral', 'bg-amber', 'bg-ink-soft'];
                const spineColor = spineColors[index % spineColors.length];

                return (
                  <div
                    key={box.id}
                    draggable
                    onDragStart={(e) => handleBoxDragStart(e, index)}
                    onDragOver={handleBoxDragOver}
                    onDrop={(e) => handleBoxDrop(e, index)}
                    className="min-w-[200px] max-w-[220px] bg-slate-50 rounded-xl overflow-hidden border border-paper-line flex flex-col justify-between relative shadow-sm cursor-grab active:cursor-grabbing hover:border-amber transition-all select-none"
                    title="اسحب الباقة لإعادة ترتيبها"
                  >
                    <div className="relative h-28 bg-paper-dark/20">
                      {box.image || box.image_url ? (
                        <img src={box.image || box.image_url} alt={box.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          📦
                        </div>
                      )}
                      <span className="absolute top-2 right-2 bg-ink/80 text-white text-[8px] font-bold px-2 py-0.5 rounded-full">
                        {box.stage === 'kg' ? 'رياض الأطفال'
                         : box.stage === 'primary' ? 'ابتدائي'
                         : box.stage === 'middle' ? 'إعدادي'
                         : 'ثانوي'}
                      </span>
                    </div>

                    <div className="p-3 text-right">
                      <h4 className="font-extrabold text-xs text-ink mb-1 truncate">{box.name}</h4>
                      <p className="text-[9px] text-ink-soft/60 truncate mb-2">{box.description}</p>
                      <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2">
                        <span className="text-[10px] font-black text-coral">{box.base_price} ج.م</span>
                        <span className="text-[8px] bg-amber/10 px-2 py-0.5 rounded text-amber-deep font-bold">معروضة</span>
                      </div>
                    </div>
                    <div className={`absolute top-0 left-0 w-1 h-full ${spineColor}`} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'box_builder_section': {
        const currentImages = Array.isArray(block.content.images) ? block.content.images : [];

        return (
          <div className="bg-slate-900 text-white p-6 rounded-card border border-slate-800 text-right space-y-6 animate-fade-in" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-amber">⚙️ لوحة تحكم صانع الصناديق التفاعلي</span>
              <span className="text-[10px] text-slate-400">تعديل حي يظهر في الموقع مباشرة</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">العنوان الرئيسي للقسم:</label>
                <h3 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateBlockContent(block.id, 'title', e.currentTarget.innerText)}
                  className="font-black text-sm sm:text-base text-white outline-none focus:bg-white/10 px-2 py-1 rounded border border-dashed border-slate-700 hover:border-amber w-full"
                >
                  {block.content.title || 'اصنع باقتك المدرسية المخصصة بنفسك!'}
                </h3>
              </div>
              
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">الوصف الفرعي للقسم:</label>
                <p 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateBlockContent(block.id, 'subtitle', e.currentTarget.innerText)}
                  className="text-xs text-slate-300 leading-relaxed outline-none focus:bg-white/10 px-2 py-1 rounded border border-dashed border-slate-700 hover:border-amber w-full"
                >
                  {block.content.subtitle || block.content.desc || 'لا تتقيد بالباقات الجاهزة. اختر الكشكول والقلم والمسطرة وكل ما تحتاجه بالكميات التي تناسبك تماماً.'}
                </p>
              </div>
            </div>

            {/* Editable 3 Steps */}
            <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
              <label className="block text-[10px] text-slate-400 font-bold mb-1">🚶 خطوات التجهيز الثلاثة (اضغط للتعديل مباشرة):</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber text-slate-900 font-bold flex items-center justify-center font-numbers text-[10px] shrink-0">1</span>
                  <span 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateBlockContent(block.id, 'step1', e.currentTarget.innerText)}
                    className="font-bold text-white outline-none focus:bg-white/10 px-1 py-0.5 rounded border border-dashed border-slate-700 hover:border-amber"
                  >
                    {block.content.step1 || 'اختر المرحلة الدراسية'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber text-slate-900 font-bold flex items-center justify-center font-numbers text-[10px] shrink-0">2</span>
                  <span 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateBlockContent(block.id, 'step2', e.currentTarget.innerText)}
                    className="font-bold text-white outline-none focus:bg-white/10 px-1 py-0.5 rounded border border-dashed border-slate-700 hover:border-amber"
                  >
                    {block.content.step2 || 'عدّل وزد الأدوات والكميات'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber text-slate-900 font-bold flex items-center justify-center font-numbers text-[10px] shrink-0">3</span>
                  <span 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateBlockContent(block.id, 'step3', e.currentTarget.innerText)}
                    className="font-bold text-white outline-none focus:bg-white/10 px-1 py-0.5 rounded border border-dashed border-slate-700 hover:border-amber"
                  >
                    {block.content.step3 || 'أضف الصندوق للسلة'}
                  </span>
                </div>
              </div>
            </div>

            {/* Editable 6 slot images */}
            <div className="space-y-2 bg-white/5 p-4 rounded-xl border border-white/10">
              <label className="block text-[10px] text-slate-400 font-bold mb-1">🖼️ الصور الستة المعروضة بالصندوق التفاعلي (الصق رابط الصورة أو اتركها لعرض الصور الافتراضية):</label>
              <div className="grid grid-cols-6 gap-2">
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const imgUrl = currentImages[idx] || '';
                  return (
                    <div 
                      key={idx} 
                      className="relative group aspect-square border border-slate-700 rounded-lg overflow-hidden bg-slate-800 cursor-pointer"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'BUTTON') {
                          document.getElementById(`slot-input-${block.id}-${idx}`)?.click();
                        }
                      }}
                    >
                      {imgUrl ? (
                        <img src={imgUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-slate-500 gap-1">
                          <span>🧸 {idx + 1}</span>
                          <span className="text-[8px]">صورة افتراضية</span>
                        </div>
                      )}
                      
                      <input
                        id={`slot-input-${block.id}-${idx}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleBlockSlotImageUpload(block.id, idx, file, currentImages);
                        }}
                      />

                      <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1 gap-1">
                        <span className="text-[8px] text-white font-bold text-center pointer-events-none">
                          {uploadingBlockId === `${block.id}-slot-${idx}` ? 'جاري الرفع...' : '📷 اضغط لرفع صورة'}
                        </span>
                        <input 
                          type="text" 
                          placeholder="رابط الصورة..." 
                          className="w-full text-[8px] px-1 py-0.5 rounded text-black bg-white text-center font-english outline-none"
                          value={imgUrl}
                          onChange={(e) => {
                            const updatedImages = [...currentImages];
                            while (updatedImages.length < 6) updatedImages.push('');
                            updatedImages[idx] = e.target.value;
                            updateBlockContent(block.id, 'images', updatedImages);
                          }}
                        />
                        {imgUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              const updatedImages = [...currentImages];
                              updatedImages[idx] = '';
                              updateBlockContent(block.id, 'images', updatedImages);
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[8px] font-bold px-1.5 py-0.5 rounded"
                          >
                            حذف
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      case 'box_builder_stages': {
        return (
          <div className="bg-slate-900 text-white p-6 rounded-card border border-slate-800 text-right space-y-6 animate-fade-in" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-amber">⚙️ لوحة تحكم مراحل صانع الصناديق التفاعلي</span>
              <span className="text-[10px] text-slate-400">تعديل حي يظهر في صفحة صانع الصناديق مباشرة</span>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">العنوان الرئيسي للقسم (اضغط للتعديل):</label>
                <h3 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateBlockContent(block.id, 'title', e.currentTarget.innerText)}
                  className="font-black text-sm sm:text-base text-white outline-none focus:bg-white/10 px-2 py-1 rounded border border-dashed border-slate-700 hover:border-amber w-full"
                >
                  {block.content.title || 'اختر المرحلة الدراسية للبدء'}
                </h3>
              </div>
              
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">الوصف الفرعي للقسم (اضغط للتعديل):</label>
                <p 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateBlockContent(block.id, 'subtitle', e.currentTarget.innerText)}
                  className="text-xs text-slate-300 leading-relaxed outline-none focus:bg-white/10 px-2 py-1 rounded border border-dashed border-slate-700 hover:border-amber w-full"
                >
                  {block.content.subtitle || 'سنقوم بتحميل باقة مقترحة مسبقاً لتسهيل عملية التخصيص عليك.'}
                </p>
              </div>
            </div>

            {/* The 4 Stages Cards Editor */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <label className="block text-[10px] text-slate-400 font-bold">📋 تخصيص كروت المراحل الأربعة بالتفصيل (اضغط على أي كلمة للتعديل مباشرة):</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Stage 1: KG */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-bold text-amber">1. رياض الأطفال (KG)</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[8px] text-slate-500">اسم المرحلة:</label>
                      <span 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateBlockContent(block.id, 'kg_title', e.currentTarget.innerText)}
                        className="font-bold text-xs outline-none focus:bg-white/15 px-1 py-0.5 rounded border border-dashed border-slate-700 block"
                      >
                        {block.content.kg_title || 'رياض الأطفال (KG)'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-[8px] text-slate-500">سعر البداية:</label>
                      <span 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateBlockContent(block.id, 'kg_price', e.currentTarget.innerText)}
                        className="font-bold text-xs text-coral outline-none focus:bg-white/15 px-1 py-0.5 rounded border border-dashed border-slate-700 block font-numbers"
                      >
                        {block.content.kg_price || '320'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-[8px] text-slate-500">وصف المرحلة:</label>
                      <p 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateBlockContent(block.id, 'kg_desc', e.currentTarget.innerText)}
                        className="text-[10px] text-slate-300 leading-relaxed outline-none focus:bg-white/15 px-1 py-0.5 rounded border border-dashed border-slate-700 block"
                      >
                        {block.content.kg_desc || 'باقة تحتوي على كراسات رسم، ألوان خشب، صلصال وأقلام تلوين تناسب سن الروضة.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stage 2: Primary */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-bold text-emerald-400">2. المرحلة الابتدائية</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[8px] text-slate-500">اسم المرحلة:</label>
                      <span 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateBlockContent(block.id, 'primary_title', e.currentTarget.innerText)}
                        className="font-bold text-xs outline-none focus:bg-white/15 px-1 py-0.5 rounded border border-dashed border-slate-700 block"
                      >
                        {block.content.primary_title || 'المرحلة الابتدائية'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-[8px] text-slate-500">سعر البداية:</label>
                      <span 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateBlockContent(block.id, 'primary_price', e.currentTarget.innerText)}
                        className="font-bold text-xs text-coral outline-none focus:bg-white/15 px-1 py-0.5 rounded border border-dashed border-slate-700 block font-numbers"
                      >
                        {block.content.primary_price || '480'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-[8px] text-slate-500">وصف المرحلة:</label>
                      <p 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateBlockContent(block.id, 'primary_desc', e.currentTarget.innerText)}
                        className="text-[10px] text-slate-300 leading-relaxed outline-none focus:bg-white/15 px-1 py-0.5 rounded border border-dashed border-slate-700 block"
                      >
                        {block.content.primary_desc || 'باقة تحتوي على كشاكيل كتابة عادية، أقلام رصاص، جوم ومستلزمات الحساب.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stage 3: Middle */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-bold text-teal-400">3. المرحلة الإعدادية</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[8px] text-slate-500">اسم المرحلة:</label>
                      <span 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateBlockContent(block.id, 'middle_title', e.currentTarget.innerText)}
                        className="font-bold text-xs outline-none focus:bg-white/15 px-1 py-0.5 rounded border border-dashed border-slate-700 block"
                      >
                        {block.content.middle_title || 'المرحلة الإعدادية'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-[8px] text-slate-500">سعر البداية:</label>
                      <span 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateBlockContent(block.id, 'middle_price', e.currentTarget.innerText)}
                        className="font-bold text-xs text-coral outline-none focus:bg-white/15 px-1 py-0.5 rounded border border-dashed border-slate-700 block font-numbers"
                      >
                        {block.content.middle_price || '620'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-[8px] text-slate-500">وصف المرحلة:</label>
                      <p 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateBlockContent(block.id, 'middle_desc', e.currentTarget.innerText)}
                        className="text-[10px] text-slate-300 leading-relaxed outline-none focus:bg-white/15 px-1 py-0.5 rounded border border-dashed border-slate-700 block"
                      >
                        {block.content.middle_desc || 'باقة مجهزة بأدوات الهندسة، مقلمة، كشاكيل سلك وأقلام حبر متعددة.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stage 4: High */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-bold text-rose-400">4. المرحلة الثانوية</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[8px] text-slate-500">اسم المرحلة:</label>
                      <span 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateBlockContent(block.id, 'high_title', e.currentTarget.innerText)}
                        className="font-bold text-xs outline-none focus:bg-white/15 px-1 py-0.5 rounded border border-dashed border-slate-700 block"
                      >
                        {block.content.high_title || 'المرحلة الثانوية'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-[8px] text-slate-500">سعر البداية:</label>
                      <span 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateBlockContent(block.id, 'high_price', e.currentTarget.innerText)}
                        className="font-bold text-xs text-coral outline-none focus:bg-white/15 px-1 py-0.5 rounded border border-dashed border-slate-700 block font-numbers"
                      >
                        {block.content.high_price || '780'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-[8px] text-slate-500">وصف المرحلة:</label>
                      <p 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateBlockContent(block.id, 'high_desc', e.currentTarget.innerText)}
                        className="text-[10px] text-slate-300 leading-relaxed outline-none focus:bg-white/15 px-1 py-0.5 rounded border border-dashed border-slate-700 block"
                      >
                        {block.content.high_desc || 'باقة متكاملة تحوي كشاكيل جامعية كبيرة، أوراق فلوسكاب وأقلام حبر فاخرة.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button Text */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <label className="block text-[10px] text-slate-400 mb-1">نص زر تخصيص الباقة (اضغط للتعديل):</label>
              <span 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateBlockContent(block.id, 'cta_text', e.currentTarget.innerText)}
                className="inline-block px-4 py-2 bg-amber hover:bg-amber-deep text-ink text-xs font-black rounded-cta outline-none focus:bg-white/20 border border-dashed border-transparent hover:border-white transition-colors cursor-text"
              >
                {block.content.cta_text || 'تخصيص الباقة'}
              </span>
            </div>
          </div>
        );
      }

      case 'products_row':
        return (
          <div className="bg-white p-6 rounded-card border border-paper-line text-right" dir="rtl">
            <div className="space-y-1 mb-4">
              <h3 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateBlockContent(block.id, 'title', e.currentTarget.innerText)}
                className="font-black text-sm sm:text-base text-ink outline-none focus:bg-amber/10 px-1 py-0.5 rounded border border-dashed border-slate-200 hover:border-amber inline-block"
              >
                {block.content.title || 'المنتجات الأكثر طلباً'}
              </h3>
              <p 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateBlockContent(block.id, 'subtitle', e.currentTarget.innerText)}
                className="text-[11px] text-ink-soft/70 outline-none focus:bg-amber/10 px-1 py-0.5 rounded border border-dashed border-slate-200 hover:border-amber"
              >
                {block.content.subtitle || 'أفضل الأدوات المكتبية والقرطاسية المدرسية بأفضل الأسعار'}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-dashed border-slate-100 text-[10px]">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-ink">التصنيف لعرض منتجاته:</label>
                <select
                  value={block.content.categoryId || 'all'}
                  onChange={(e) => updateBlockContent(block.id, 'categoryId', e.target.value)}
                  className="px-2 py-1 border rounded"
                >
                  <option value="all">⭐ المنتجات الأكثر طلباً (Featured)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>📁 {cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-ink">الحد الأقصى للعرض:</label>
                <input
                  type="number"
                  value={block.content.limit || 8}
                  onChange={(e) => updateBlockContent(block.id, 'limit', parseInt(e.target.value))}
                  className="px-2 py-1 border rounded w-full text-center"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-ink">طريقة العرض:</label>
                <select
                  value={block.content.layout || 'scroll'}
                  onChange={(e) => updateBlockContent(block.id, 'layout', e.target.value)}
                  className="px-2 py-1 border rounded cursor-pointer"
                >
                  <option value="scroll">⬅️ أفقي (تمرير جانبي Scroll)</option>
                  <option value="grid">⬇️ عمودي (شبكة Grid)</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="bg-white p-6 rounded-card border border-paper-line text-right">
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => updateBlockContent(block.id, 'text', e.currentTarget.innerText)}
              className="text-xs text-slate-700 font-arabic leading-relaxed outline-none focus:bg-amber/10 p-2 rounded border border-dashed border-slate-200 hover:border-amber"
            >
              {block.content.text || 'اكتب هنا...'}
            </div>
          </div>
        );

      case 'mixed':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white rounded-[16px] border border-paper-line items-center text-right" dir="rtl">
            <div className="space-y-2">
              <h3 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateBlockContent(block.id, 'title', e.currentTarget.innerText)}
                className="font-black text-sm text-ink outline-none focus:bg-amber/10 p-1 rounded border border-dashed border-slate-200 hover:border-amber inline-block"
              >
                {block.content.title || 'عنوان الـ block'}
              </h3>
              <p 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateBlockContent(block.id, 'text', e.currentTarget.innerText)}
                className="text-[11px] text-ink-soft/80 leading-relaxed outline-none focus:bg-amber/10 p-1.5 rounded border border-dashed border-slate-200 hover:border-amber"
              >
                {block.content.text || 'محتوى نصي للكتلة المزدوجة...'}
              </p>
            </div>
            <div className="relative aspect-video rounded-xl overflow-hidden border group cursor-pointer">
              <img 
                src={block.content.imageUrl || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600'} 
                className="w-full h-full object-cover" 
                onClick={() => document.getElementById(`file-input-${block.id}`)?.click()}
              />
              <input
                id={`file-input-${block.id}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleBlockImageUpload(block.id, file);
                }}
              />
              <div 
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-white text-xs font-bold font-arabic pointer-events-none"
              >
                <span>📷 {uploadingBlockId === block.id ? 'جاري رفع الصورة...' : 'اضغط لتغيير الصورة'}</span>
              </div>
              <div className="absolute bottom-1.5 right-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-auto">
                <input 
                  type="text" 
                  placeholder="رابط الصورة..." 
                  className="px-2 py-1 text-[10px] rounded border w-full text-center font-english text-black bg-white"
                  value={block.content.imageUrl || ''} 
                  onChange={(e) => updateBlockContent(block.id, 'imageUrl', e.target.value)} 
                />
              </div>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="bg-white p-6 rounded-card border border-paper-line text-center space-y-2">
            <div className="relative max-w-md mx-auto aspect-video rounded-xl overflow-hidden border group cursor-pointer">
              <img 
                src={block.content.imageUrl || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600'} 
                className="w-full h-full object-cover" 
                onClick={() => document.getElementById(`file-input-${block.id}`)?.click()}
              />
              <input
                id={`file-input-${block.id}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleBlockImageUpload(block.id, file);
                }}
              />
              <div 
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-white text-xs font-bold font-arabic pointer-events-none"
              >
                <span>📷 {uploadingBlockId === block.id ? 'جاري رفع الصورة...' : 'اضغط لتغيير الصورة'}</span>
              </div>
              <div className="absolute bottom-1.5 right-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-auto">
                <input 
                  type="text" 
                  placeholder="رابط الصورة..." 
                  className="px-2 py-1 text-[10px] rounded border w-full text-center font-english text-black bg-white"
                  value={block.content.imageUrl || ''} 
                  onChange={(e) => updateBlockContent(block.id, 'imageUrl', e.target.value)} 
                />
              </div>
            </div>
            {block.content.caption && <p className="text-[10px] text-slate-400">{block.content.caption}</p>}
          </div>
        );

      case 'testimonials': {
        const reviewsList: any[] = Array.isArray(block.content.reviewsList)
          ? block.content.reviewsList
          : [
              { id: '1', customer_name: block.content.rev1_name ?? 'ندى أحمد', city: block.content.rev1_city ?? 'دمياط', comment: block.content.rev1_comment ?? 'الهدية كانت لابني في أول يوم دراسي، ملامحه وهو بيفتح العلبة وتفاصيل الأدوات لا تُقدر بثمن، متشكرة جداً.', rating: Number(block.content.rev1_rating ?? 5) },
              { id: '2', customer_name: block.content.rev2_name ?? 'سارة محمد', city: block.content.rev2_city ?? 'القاهرة', comment: block.content.rev2_comment ?? 'طلبت الكتب المدرسية والمستلزمات، خامات ممتازة وتغليف فاخر ومنسق جداً، والتوصيل سريع لباب البيت.', rating: Number(block.content.rev2_rating ?? 5) },
              { id: '3', customer_name: block.content.rev3_name ?? 'مريم محمود', city: block.content.rev3_city ?? 'الإسكندرية', comment: block.content.rev3_comment ?? 'الباقة المدرسية تجنن والتفاصيل والفرز نظيفة جداً. الأدوات جودتها عالية والشغل يستاهل كل قرش بجد.', rating: Number(block.content.rev3_rating ?? 5) }
            ];

        const handleUpdateReview = (idxToUpdate: number, field: string, val: any) => {
          const newList = [...reviewsList];
          newList[idxToUpdate] = { ...newList[idxToUpdate], [field]: val };
          updateBlockContent(block.id, 'reviewsList', newList);
        };

        const handleAddReview = () => {
          const newList = [...reviewsList, {
            id: `rev-${Date.now()}`,
            customer_name: '',
            city: '',
            comment: '',
            rating: 5
          }];
          updateBlockContent(block.id, 'reviewsList', newList);
        };

        const handleDeleteReview = (idxToDelete: number) => {
          const newList = reviewsList.filter((_, i) => i !== idxToDelete);
          updateBlockContent(block.id, 'reviewsList', newList);
        };

        return (
          <div className="p-6 bg-white rounded-card border border-paper-line shadow-card text-center space-y-6" dir="rtl">
            {/* Header edit */}
            <div className="max-w-xl mx-auto space-y-3">
              <span className="inline-block bg-amber-light/20 text-amber-deep text-xs font-bold px-3 py-1 rounded-full border border-amber/20">
                <input
                  type="text"
                  dir="rtl"
                  value={block.content.subtitle ?? ''}
                  onChange={(e) => updateBlockContent(block.id, 'subtitle', e.target.value)}
                  className="bg-transparent text-center border-b border-dashed border-amber outline-none focus:bg-amber-light/30 px-2 py-0.5 font-bold text-amber-deep"
                  placeholder="قالوا عن مكتبة الخضري"
                />
              </span>

              <div>
                <input
                  type="text"
                  dir="rtl"
                  value={block.content.title ?? ''}
                  onChange={(e) => updateBlockContent(block.id, 'title', e.target.value)}
                  className="w-full text-center text-xl sm:text-2xl font-black text-ink bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-amber"
                  placeholder="آراء عائلتنا الدافئة 🎓"
                />
              </div>

              <div>
                <input
                  type="text"
                  dir="rtl"
                  value={block.content.ctaText ?? ''}
                  onChange={(e) => updateBlockContent(block.id, 'ctaText', e.target.value)}
                  className="inline-block text-center text-xs font-bold text-coral bg-coral-light/30 border border-coral/30 rounded-full px-4 py-1.5 outline-none focus:bg-white"
                  placeholder="شاركينا تقييمك وتجربتك معنا ✍️"
                />
              </div>
            </div>

            {/* Header Toolbar: Add new review button */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-xs font-extrabold text-ink font-arabic">
                تقييمات وآراء العملاء المعروضة في الشريط ({reviewsList.length}):
              </span>
              <button
                type="button"
                onClick={handleAddReview}
                className="px-3.5 py-1.5 bg-amber hover:bg-amber-deep text-white text-xs font-bold rounded-full transition-all shadow-sm flex items-center gap-1 font-arabic"
              >
                <span>+ إضافة رأي عميل جديد</span>
              </button>
            </div>

            {/* Dynamic Review Cards Visual Editing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {reviewsList.map((rev, revIdx) => {
                const ratingVal = Number(rev.rating || 5);

                return (
                  <div
                    key={rev.id || revIdx}
                    className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-right relative flex flex-col justify-between hover:border-amber/50 transition-all space-y-3"
                  >
                    {/* Header bar: Stars & Delete button */}
                    <div className="flex items-center justify-between">
                      {/* Stars */}
                      <div className="flex gap-1 justify-start">
                        {Array.from({ length: 5 }).map((_, idx) => {
                          const val = idx + 1;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleUpdateReview(revIdx, 'rating', val)}
                              className="hover:scale-110 transition-transform"
                            >
                              <Star className={`w-4 h-4 ${val <= ratingVal ? 'text-amber fill-amber' : 'text-slate-300'}`} />
                            </button>
                          );
                        })}
                      </div>

                      {/* Delete review button */}
                      {reviewsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(revIdx)}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded-md transition-colors text-[10px] font-bold flex items-center gap-0.5"
                          title="حذف هذا الرأي"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>حذف</span>
                        </button>
                      )}
                    </div>

                    {/* Comment text area */}
                    <textarea
                      rows={3}
                      dir="rtl"
                      value={rev.comment ?? ''}
                      onChange={(e) => handleUpdateReview(revIdx, 'comment', e.target.value)}
                      placeholder={`رأي العميل ${revIdx + 1}...`}
                      className="w-full text-xs text-ink bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-amber resize-none leading-relaxed"
                    />

                    {/* Reviewer name & city */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-0.5">اسم العميل:</label>
                        <input
                          type="text"
                          dir="rtl"
                          value={rev.customer_name ?? ''}
                          onChange={(e) => handleUpdateReview(revIdx, 'customer_name', e.target.value)}
                          placeholder="الاسم"
                          className="w-full text-xs font-bold text-ink bg-white border border-slate-200 rounded-md px-2 py-1 focus:border-amber outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-0.5">المحافظة:</label>
                        <input
                          type="text"
                          dir="rtl"
                          value={rev.city ?? ''}
                          onChange={(e) => handleUpdateReview(revIdx, 'city', e.target.value)}
                          placeholder="المدينة"
                          className="w-full text-xs text-slate-500 bg-white border border-slate-200 rounded-md px-2 py-1 focus:border-amber outline-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const renderMobileSimulator = (maxWidthClass = "max-w-[375px]") => {
    return (
      <div className={`w-full ${maxWidthClass} bg-white rounded-[32px] border-8 border-slate-800 shadow-2xl overflow-hidden aspect-[9/16] flex flex-col`}>
        {/* كاميرا محاكاة للهاتف */}
        <div className="h-6 bg-slate-800 w-full flex items-center justify-center relative shrink-0">
          <div className="w-16 h-4 bg-black rounded-b-[10px]" />
        </div>

        {/* محتوى الصفحة داخل الهاتف */}
        <div className="flex-1 overflow-y-auto scrollbar-thin text-right bg-paper" dir="rtl">
          
          {/* هيدر المتجر الافتراضي */}
          <div className="bg-ink text-white p-3.5 flex justify-between items-center text-xs font-bold shrink-0">
            <span>مكتبة الخضري</span>
            <span>☰</span>
          </div>

          {/* رندرة الكتل */}
          <div className="space-y-4">
            {blocks.map((block) => {
              if (block.type === 'hero') {
                const heroMediaType = block.content.media_type || 'image';
                const heroSelectedId = block.content.selected_id || '';
                const heroImageUrl = block.content.imageUrl || '';
                const heroBox = heroMediaType === 'box' ? (boxes.find(b => b.id === heroSelectedId) || boxes[0]) : null;
                const heroProd = heroMediaType === 'product' ? (products.find(p => p.id === heroSelectedId) || products[0]) : null;

                return (
                  <div key={block.id} className="p-4 bg-notebook-lines border-b border-paper-line space-y-4 text-right bg-amber/5 relative animate-fade-in" dir="rtl">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-1.5 bg-white border border-paper-line text-[8px] font-bold px-2 py-0.5 rounded-full text-slate-500 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-sage animate-ping" />
                        <span>{block.content.badge_text || 'عرض العودة للمدارس'}</span>
                      </div>
                      <h5 className="font-black text-sm text-ink leading-tight">
                        {block.content.title || 'سهّلنا عليك التجهيز للمدرسة'}
                      </h5>
                      <p className="text-[10px] text-ink-soft/70 leading-relaxed">
                        {block.content.subtitle || 'اكتشف باقات الأدوات المدرسية المخصصة لكل مرحلة.'}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {block.content.ctaText && (
                          <span className="inline-block bg-coral text-white text-[8px] px-3 py-1 rounded-full font-bold shadow-sm">
                            {block.content.ctaText}
                          </span>
                        )}
                        {block.content.cta2Text && (
                          <span className="inline-block bg-white border border-paper-line text-ink-soft text-[8px] px-3 py-1 rounded-full font-bold shadow-sm">
                            {block.content.cta2Text}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-dashed border-slate-200">
                      {heroMediaType === 'image' && (
                        <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-50 border shadow-sm">
                          <img src={heroImageUrl || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600'} className="w-full h-full object-cover" />
                        </div>
                      )}

                      {heroMediaType === 'box' && heroBox && (
                        <div className="w-full bg-white rounded-lg border p-2 shadow-sm flex items-center gap-2.5">
                          <img src={heroBox.image_url || heroBox.image || 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600'} className="w-12 h-12 rounded object-cover border shrink-0" />
                          <div className="text-[9px] min-w-0 flex-1">
                            <span className="text-[7px] text-coral font-bold block">باقة جاهزة للتوصيل</span>
                            <h6 className="font-extrabold text-ink truncate leading-tight">{heroBox.name}</h6>
                            <span className="text-coral font-black">{heroBox.base_price} ج.م</span>
                          </div>
                        </div>
                      )}

                      {heroMediaType === 'product' && heroProd && (
                        <div className="w-full bg-white rounded-lg border p-2 shadow-sm flex items-center gap-2.5">
                          <img src={heroProd.images?.[0] || 'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=800'} className="w-12 h-12 rounded object-cover border shrink-0" />
                          <div className="text-[9px] min-w-0 flex-1">
                            <span className="text-[7px] text-sage font-bold block">منتج مميز متوفر بالمتجر</span>
                            <h6 className="font-extrabold text-ink truncate leading-tight">{heroProd.name}</h6>
                            <span className="text-coral font-black">{heroProd.price_unit} ج.م</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              
              if (block.type === 'text') {
                return (
                  <div key={block.id} className="p-4 text-xs text-slate-700 leading-relaxed font-arabic bg-white border-b" dir="rtl">
                    {block.content.text}
                  </div>
                );
              }

              if (block.type === 'image') {
                return (
                  <div key={block.id} className="p-4 bg-white space-y-1 border-b">
                    <img src={block.content.imageUrl} alt="preview" className="w-full rounded-[8px]" />
                    {block.content.caption && (
                      <p className="text-[10px] text-slate-400 text-center font-arabic">{block.content.caption}</p>
                    )}
                  </div>
                );
              }

              if (block.type === 'mixed') {
                const isImgRight = block.content.align === 'right';
                return (
                  <div key={block.id} className={`p-4 bg-white flex ${isImgRight ? 'flex-row' : 'flex-row-reverse'} gap-3 items-center text-right border-b`} dir="rtl">
                    <img src={block.content.imageUrl} alt="preview" className="w-16 h-16 object-cover rounded-[8px] shrink-0" />
                    <p className="text-[10px] text-slate-600 leading-relaxed font-arabic flex-1">{block.content.text}</p>
                  </div>
                );
              }

              if (block.type === 'stats') {
                return (
                  <div key={block.id} className="bg-ink text-white py-6 px-4 grid grid-cols-3 gap-2 text-center border-b">
                    {[1, 2, 3].map((num) => {
                      const number = block.content[`stat${num}_number`] || '0';
                      const label = block.content[`stat${num}_label`] || '';
                      const emoji = block.content[`stat${num}_emoji`] || '📈';
                      return (
                        <div key={num} className="space-y-1">
                          <span className="text-base block">{emoji}</span>
                          <span className="font-english font-black block text-amber text-xs">{number}</span>
                          <span className="opacity-80 block text-[8px] font-arabic leading-none">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              }

              if (block.type === 'testimonials') {
                return (
                  <div key={block.id} className="p-5 bg-white border-b border-paper-line text-center space-y-3 font-arabic" dir="rtl">
                    <span className="text-amber font-bold text-[10px] block">{block.content.subtitle || 'قالوا عن مكتبة الخضري'}</span>
                    <h5 className="font-black text-xs text-ink">{block.content.title || 'آراء عائلتنا الدافئة 🎓'}</h5>
                    <div className="flex gap-2 justify-center">
                      <span className="text-[10px] text-slate-400 border border-slate-100 bg-slate-50 px-2.5 py-0.5 rounded-full">
                        ✨ عرض تقييمات العملاء ذات الـ 5 نجوم
                      </span>
                    </div>
                  </div>
                );
              }

              if (block.type === 'packages_section') {
                const displayedBoxes = Array.isArray(block.content.boxIds) && block.content.boxIds.length > 0
                  ? block.content.boxIds.map(id => boxes.find(b => b.id === id)).filter(Boolean)
                  : boxes;

                return (
                  <div key={block.id} className="p-4 bg-transparent border-b border-paper-line text-right space-y-3" dir="rtl">
                    <div>
                      <h5 className="font-black text-xs text-ink mb-0.5">{block.content.title || 'الصناديق المدرسية الجاهزة'}</h5>
                      <p className="text-[9px] text-slate-400 font-arabic leading-snug">{block.content.subtitle}</p>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                      {displayedBoxes.map((box: any, idx: number) => (
                        <div key={box.id || idx} className="min-w-[130px] max-w-[130px] bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col justify-between relative p-2 shadow-sm shrink-0">
                          <div className="aspect-[4/3] rounded bg-slate-100 overflow-hidden relative">
                            {box.image_url || box.image ? (
                              <img src={box.image_url || box.image} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px]">📦</div>
                            )}
                            <span className="absolute top-1 right-1 bg-ink/85 text-white text-[6px] font-bold px-1.5 py-0.5 rounded-md font-arabic shadow-sm">
                              {box.stage === 'kg' ? 'روضة'
                               : box.stage === 'primary' ? 'ابتدائي'
                               : box.stage === 'middle' ? 'إعدادي'
                               : 'ثانوي'}
                            </span>
                          </div>
                          <div className="mt-1 text-[8px] space-y-0.5">
                            <h6 className="font-bold text-ink truncate leading-none">{box.name}</h6>
                            <span className="text-coral font-black block">{box.base_price} ج.م</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (block.type === 'box_builder_section') {
                const defaultDolls = [
                  'https://images.unsplash.com/photo-1559251606-c623743a6d76?w=150',
                  'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=150',
                  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150',
                  'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=150',
                  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=150',
                  'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=150'
                ];
                const displayImages = [0, 1, 2, 3, 4, 5].map(idx => 
                  (Array.isArray(block.content.images) && block.content.images[idx]) || 
                  defaultDolls[idx]
                );

                return (
                  <div key={block.id} className="p-4 bg-[#16233F] text-white text-right space-y-3.5 border-b relative overflow-hidden" dir="rtl">
                    <div className="absolute top-0 left-1/4 w-32 h-32 bg-amber/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="space-y-1">
                      <h5 className="font-black text-xs text-white leading-tight">{block.content.title || 'اصنع باقتك المدرسية بنفسك!'}</h5>
                      <p className="text-[8px] text-white/70 leading-relaxed">
                        {block.content.subtitle || block.content.desc || 'لا تتقيد بالباقات الجاهزة. اختر الكشكول والقلم والمسطرة وكل ما تحتاجه.'}
                      </p>
                    </div>

                    {/* Step Indicators */}
                    <div className="grid grid-cols-1 gap-1.5 bg-white/5 p-2 rounded-lg border border-white/5 text-[8px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-full bg-amber text-slate-900 font-bold flex items-center justify-center font-numbers text-[7px] shrink-0">1</span>
                        <span className="font-bold text-white/90 truncate">{block.content.step1 || 'اختر المرحلة الدراسية'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-full bg-amber text-slate-900 font-bold flex items-center justify-center font-numbers text-[7px] shrink-0">2</span>
                        <span className="font-bold text-white/90 truncate">{block.content.step2 || 'عدّل وزد الأدوات والكميات'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-full bg-amber text-slate-900 font-bold flex items-center justify-center font-numbers text-[7px] shrink-0">3</span>
                        <span className="font-bold text-white/90 truncate">{block.content.step3 || 'أضف الصندوق للسلة'}</span>
                      </div>
                    </div>

                    {/* 6 Grid Images */}
                    <div className="grid grid-cols-3 gap-1.5 bg-white/5 p-2 rounded-lg border border-white/5">
                      {displayImages.map((imgUrl, idx) => (
                        <div key={idx} className="aspect-square bg-white/5 rounded border border-white/10 overflow-hidden p-0.5 relative">
                          <img src={imgUrl} className="w-full h-full object-cover rounded" />
                          <span className="absolute bottom-0.5 left-0.5 bg-amber text-ink text-[5px] font-bold w-2.5 h-2.5 rounded-full flex items-center justify-center font-numbers">{idx + 1}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <div className="pt-0.5">
                      <div className="w-full py-1.5 bg-amber text-slate-950 font-black text-[9px] rounded-md flex items-center justify-center gap-1 shadow-sm select-none">
                        <span>{block.content.ctaText || 'ابدأ تصميم صندوقك الآن'}</span>
                        <span className="text-[10px]">←</span>
                      </div>
                    </div>
                  </div>
                );
              }

              if (block.type === 'box_builder_stages') {
                return (
                  <div key={block.id} className="p-4 bg-paper-dark/20 text-right space-y-3.5 border-b" dir="rtl">
                    <div className="text-center space-y-0.5">
                      <h5 className="font-black text-xs text-ink">{block.content.title || 'اختر المرحلة الدراسية للبدء'}</h5>
                      <p className="text-[7px] text-slate-400 font-arabic leading-snug">{block.content.subtitle}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'kg', title: block.content.kg_title || 'رياض الأطفال (KG)', price: block.content.kg_price || '320', color: 'bg-amber' },
                        { key: 'primary', title: block.content.primary_title || 'المرحلة الابتدائية', price: block.content.primary_price || '480', color: 'bg-emerald-500' },
                        { key: 'middle', title: block.content.middle_title || 'المرحلة الإعدادية', price: block.content.middle_price || '620', color: 'bg-sage' },
                        { key: 'high', title: block.content.high_title || 'المرحلة الثانوية', price: block.content.high_price || '780', color: 'bg-coral' },
                      ].map((stage) => (
                        <div key={stage.key} className="bg-white rounded-lg p-2 border border-slate-200 shadow-sm relative pr-4 flex flex-col justify-between h-20">
                          {/* Spine */}
                          <div className={`w-1 h-full absolute right-0 top-0 bottom-0 ${stage.color} rounded-r-lg`} />
                          
                          <div className="space-y-0.5">
                            <h6 className="font-black text-[8px] text-ink truncate leading-tight">{stage.title}</h6>
                            <span className="text-[6px] text-coral font-bold font-numbers block">تبدأ من {stage.price} ج.م</span>
                          </div>
                          
                          <div className="text-[6px] text-slate-400 font-arabic border-t border-dashed border-slate-100 pt-1 text-left">
                            {block.content.cta_text || 'تخصيص الباقة'} ←
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (block.type === 'products_row') {
                let rowProducts = products;
                if (block.content.categoryId && block.content.categoryId !== 'all') {
                  rowProducts = products.filter(p => p.category_id === block.content.categoryId);
                }
                const displayLimit = block.content.limit || 4;
                const productsToDisplay = rowProducts.slice(0, displayLimit);

                return (
                  <div key={block.id} className="p-4 bg-white border-b text-right space-y-3" dir="rtl">
                    <div>
                      <h5 className="font-black text-xs text-ink mb-0.5">{block.content.title || 'المنتجات المميزة'}</h5>
                      {block.content.subtitle && <p className="text-[9px] text-slate-400 font-arabic">{block.content.subtitle}</p>}
                    </div>
                    {block.content.layout === 'grid' ? (
                      <div className="grid grid-cols-2 gap-2">
                        {productsToDisplay.map((prod: any, idx: number) => (
                          <div key={prod.id || idx} className="bg-slate-50 border rounded-lg p-2 flex flex-col justify-between shadow-sm">
                            <div className="aspect-square bg-white rounded overflow-hidden relative border">
                              {prod.images?.[0] ? (
                                <img src={prod.images[0]} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">📚</div>
                              )}
                            </div>
                            <div className="mt-1 text-[8px] space-y-0.5">
                              <h6 className="font-bold text-ink truncate leading-none">{prod.name}</h6>
                              <span className="text-coral font-black block">{prod.price_unit} ج.م</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                        {productsToDisplay.map((prod: any, idx: number) => (
                          <div key={prod.id || idx} className="min-w-[110px] max-w-[110px] bg-slate-50 border rounded-lg p-2 flex flex-col justify-between shadow-sm shrink-0">
                            <div className="aspect-square bg-white rounded overflow-hidden relative border">
                              {prod.images?.[0] ? (
                                <img src={prod.images[0]} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">📚</div>
                              )}
                            </div>
                            <div className="mt-1 text-[8px] space-y-0.5">
                              <h6 className="font-bold text-ink truncate leading-none">{prod.name}</h6>
                              <span className="text-coral font-black block">{prod.price_unit} ج.م</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              if (block.type === 'about_header') {
                return (
                  <div key={block.id} className="text-center p-6 border-b border-dashed border-slate-100 bg-white">
                    <div className="w-8 h-8 bg-coral/10 rounded-full flex items-center justify-center text-coral mx-auto mb-2 text-sm">
                      📖
                    </div>
                    <h5 className="font-black text-sm text-ink">{block.content.title || 'من نحن'}</h5>
                    <p className="text-[9px] text-slate-400 mt-1">{block.content.subtitle}</p>
                  </div>
                );
              }

              if (block.type === 'about_story') {
                return (
                  <div key={block.id} className="p-4 bg-white space-y-3 border-b border-dashed text-right" dir="rtl">
                    <h5 className="font-black text-xs text-ink">{block.content.title || 'قصة نجاح مكتبة الخضري'}</h5>
                    <p className="text-[9px] text-slate-600 leading-relaxed font-medium">{block.content.text1}</p>
                    <p className="text-[9px] text-slate-600 leading-relaxed font-medium">{block.content.text2}</p>
                    {block.content.imageUrl && (
                      <img src={block.content.imageUrl} className="w-full aspect-video rounded-lg object-cover border" />
                    )}
                  </div>
                );
              }

              if (block.type === 'about_values') {
                return (
                  <div key={block.id} className="p-4 bg-white grid grid-cols-3 gap-2 border-b border-dashed text-right" dir="rtl">
                    {[1, 2, 3].map((num) => (
                      <div key={num} className="bg-slate-50 p-2 rounded border border-slate-100 space-y-1">
                        <span className="text-xs">{block.content[`card${num}_emoji`] || '🎯'}</span>
                        <h6 className="font-bold text-[9px] text-ink">{block.content[`card${num}_title`]}</h6>
                        <p className="text-[8px] text-slate-500 leading-tight">{block.content[`card${num}_text`]}</p>
                      </div>
                    ))}
                  </div>
                );
              }

              if (block.type === 'contact_section') {
                return (
                  <div key={block.id} className="p-4 bg-white text-center space-y-2.5 border-b" dir="rtl">
                    <div className="text-[9px] text-slate-600 space-y-1 font-arabic text-right">
                      <p><strong>📞 الخط الساخن:</strong> {block.content.phone}</p>
                      <p><strong>✉️ البريد الإلكتروني:</strong> {block.content.email}</p>
                      <p><strong>📍 العنوان:</strong> {block.content.address}</p>
                      <p><strong>⏰ مواعيد العمل:</strong> {block.content.work_hours || 'يومياً من 9:00 ص إلى 10:00 م'}</p>
                    </div>
                    {block.content.ctaText && (
                      <span className="inline-block bg-emerald-600 text-white text-[8px] px-3 py-1 rounded-full font-bold">
                        💬 {block.content.ctaText}
                      </span>
                    )}
                  </div>
                );
              }

              return null;
            })}
          </div>

          {/* فوتر المتجر الافتراضي */}
          <div className="bg-slate-100 p-4 text-[9px] text-center text-slate-400 border-t border-slate-200 mt-6 font-arabic shrink-0">
            جميع الحقوق محفوظة © مكتبة الخضري
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-right" dir="rtl">
      
      {/* العمود الأول: قائمة الصفحات (Pages List Sidebar) */}
      <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] h-fit space-y-4 lg:col-span-1">
        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
          <h3 className="text-base font-bold text-ink font-arabic flex items-center gap-1.5">
            <Layers className="w-5 h-5 text-amber" />
            <span>صفحات المتجر</span>
          </h3>
          <button
            onClick={handleCreateNewPage}
            className="p-1 text-amber bg-[#FBEBCB]/30 rounded-full hover:bg-amber hover:text-white transition-colors"
            title="إضافة صفحة جديدة"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* الروابط */}
        <div className="space-y-1.5">
          {pages.map((p) => {
            const isSelected = selectedPage?.slug === p.slug;
            return (
              <div
                key={p.slug}
                onClick={() => handlePageSelect(p)}
                className={`w-full text-right px-4 py-2.5 rounded-[12px] text-sm font-semibold transition-all duration-150 flex items-center justify-between font-arabic cursor-pointer border group ${
                  isSelected
                    ? 'bg-[#FBEBCB]/15 text-ink border-amber border-r-4'
                    : 'text-slate-500 hover:bg-slate-50 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <FileText className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className="truncate">{p.title}</span>
                  <span className="text-[10px] text-slate-400 font-english truncate">/{p.slug}</span>
                </div>
                
                <button
                  type="button"
                  onClick={(e) => handleDeletePage(p.slug, e)}
                  className="p-1.5 rounded-lg text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 transition-all shrink-0 ml-1 border border-red-100"
                  title="حذف هذه الصفحة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* العمود الثاني والـ 3: محرر كتل المحتوى + محاكي المعاينة */}
      {selectedPage ? (
        <div className="lg:col-span-3 grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* محرر الكتل والترويسة */}
          <div className="xl:col-span-2 space-y-6">
          
          {/* هيدر الصفحة الحالية */}
          <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex-1 max-w-sm">
              <Input
                label="عنوان الصفحة في الموقع"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              {/* زر المعاينة */}
              <Button
                variant="outline"
                size="sm"
                className="font-arabic text-xs py-2"
                onClick={() => setIsPreviewOpen(true)}
              >
                <Eye className="w-4 h-4 ml-1.5" />
                <span>معاينة حية للمحتوى</span>
              </Button>

              {/* زر الحفظ */}
              <Button
                variant="primary"
                size="sm"
                className="font-arabic text-xs py-2 shadow-md shadow-amber/10"
                onClick={handleSavePage}
                isLoading={savingPage}
              >
                <Save className="w-4 h-4 ml-1.5" />
                <span>حفظ التعديلات</span>
              </Button>
            </div>

          </div>

          {/* محرر الكتل (Blocks Editor) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2 border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-ink font-arabic pr-2 border-r-4 border-amber">كتل المحتوى المكوّنة للصفحة</span>
                {selectedPage?.slug === 'packages' && (
                  <button
                    type="button"
                    onClick={() => addBlock('packages_section')}
                    className="px-3.5 py-1.5 bg-amber hover:bg-amber-deep text-white text-xs font-bold rounded-full transition-all font-arabic shadow-sm flex items-center gap-1.5"
                    title="إضافة قسم الباقات المدرسية الجاهزة"
                  >
                    <span>🎒 + إضافة قسم الباقات الجاهزة</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => addBlock('products_row')}
                  className="px-3.5 py-1.5 bg-[#2E7FD9] hover:bg-[#1B4F8A] text-white text-xs font-bold rounded-full transition-all font-arabic shadow-sm flex items-center gap-1.5"
                  title="إضافة قسم جديد لعرض منتجات تصنيف مخصص"
                >
                  <span>📦 + إضافة قسم منتجات مخصص</span>
                </button>
              </div>
              
              {/* تبديل وضع التعديل (Editor Mode Toggle) */}
              <div className="flex items-center gap-1.5 bg-[#FBEBCB]/30 border border-[#E7DCC2]/60 p-1 rounded-full shadow-sm">
                <button
                  type="button"
                  onClick={() => setEditorMode('visual')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold font-arabic transition-all duration-200 flex items-center gap-1 ${
                    editorMode === 'visual'
                      ? 'bg-amber text-ink shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>✨ تعديل مرئي مباشر</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('forms')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold font-arabic transition-all duration-200 flex items-center gap-1 ${
                    editorMode === 'forms'
                      ? 'bg-[#2E7FD9] text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>📝 تعديل بالنماذج</span>
                </button>
              </div>
            </div>

            {blocks.length > 0 ? (
              <div className="space-y-6">
                {editorMode === 'visual' ? (
                  // وضع التعديل المرئي المباشر
                  <div className="space-y-6 max-w-4xl mx-auto">
                    {blocks.map((block, index) => (
                      <div 
                        key={block.id} 
                        className="relative group border-2 border-dashed border-slate-200 hover:border-amber rounded-[20px] p-4 transition-all duration-200 bg-white"
                      >
                        {/* Floating Controls Bar */}
                        <div className="flex items-center justify-between border-b border-dashed border-slate-100 pb-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber/10 text-amber-deep flex items-center justify-center font-english text-[10px] font-bold">
                              {index + 1}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full font-arabic">
                              {block.type === 'hero' ? 'واجهة البطل'
                               : block.type === 'stats' ? 'شريط الإحصائيات'
                               : block.type === 'testimonials' ? 'آراء وتقييمات العملاء'
                               : block.type === 'packages_section' ? 'قسم الباقات الجاهزة'
                               : block.type === 'box_builder_section' ? 'صانع الصناديق'
                               : block.type === 'products_row' ? 'قسم المنتجات'
                               : block.type === 'about_header' ? 'ترويسة من نحن'
                               : block.type === 'about_story' ? 'قصة نجاح من نحن'
                               : block.type === 'about_values' ? 'كروت الرؤية والرسالة'
                               : block.type === 'contact_section' ? 'بيانات الاتصال وخريطة المقر'
                               : block.type === 'text' ? 'كتلة نصوص'
                               : block.type === 'mixed' ? 'صورة ونصوص'
                               : 'كتلة صورة'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveBlockUp(index)}
                              disabled={index === 0}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-amber disabled:opacity-30"
                              title="تحريك للأعلى"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveBlockDown(index)}
                              disabled={index === blocks.length - 1}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-amber disabled:opacity-30"
                              title="تحريك للأسفل"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <div className="w-px h-3 bg-slate-200 mx-1" />
                            <button
                              type="button"
                              onClick={() => removeBlock(block.id)}
                              className="flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-md transition-all"
                              title="حذف هذا القسم"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>حذف</span>
                            </button>
                          </div>
                        </div>
                        
                        {/* Actual Visual Render */}
                        {renderBlockVisual(block)}
                      </div>
                    ))}
                  </div>
                ) : (
                  // وضع التعديل بالنماذج (التقليدي)
                  <div className="space-y-5">
                    {blocks.map((block, index) => (
                      <div 
                        key={block.id} 
                        className="bg-white border border-[#E7DCC2] rounded-[16px] p-5 shadow-premium space-y-4 hover:border-amber/20 transition-all animate-in slide-in-from-bottom-3 duration-250 text-right"
                      >
                    {/* رأس الكتلة (Block Header) */}
                    <div className="flex items-center justify-between border-b border-[#E7DCC2] pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-amber-light/10 text-ink flex items-center justify-center font-english text-xs font-bold">
                          {index + 1}
                        </span>
                        
                        <span className="text-xs font-bold text-ink bg-[#FBEBCB]/30 px-3 py-1 rounded-[8px] font-arabic">
                          {block.type === 'hero' ? 'كتلة البطل (Hero)' 
                           : block.type === 'text' ? 'كتلة نصوص (Rich Text)' 
                           : block.type === 'image' ? 'كتلة صورة منفردة' 
                           : block.type === 'mixed' ? 'كتلة مزدوجة (نص + صورة)' 
                           : block.type === 'stats' ? 'شريط الإحصائيات (Stats)'
                           : block.type === 'testimonials' ? 'قسم آراء وتقييمات العملاء'
                           : block.type === 'packages_section' ? 'قسم الباقات المدرسية الجاهزة'
                           : block.type === 'box_builder_section' ? 'قسم صانع الصناديق والبوكسات'
                           : block.type === 'products_row' ? 'قسم منتجات من تصنيف مخصص'
                           : 'تفاصيل وزر اتصال (Contact Details)'}
                        </span>
                      </div>

                      {/* أدوات الترتيب والحذف */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveBlockUp(index)}
                          disabled={index === 0}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-[#1B4F8A] disabled:opacity-30"
                          title="تحريك للأعلى"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveBlockDown(index)}
                          disabled={index === blocks.length - 1}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-[#1B4F8A] disabled:opacity-30"
                          title="تحريك للأسفل"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-slate-200 mx-1" />
                        <button
                          type="button"
                          onClick={() => removeBlock(block.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-[8px] transition-all"
                          title="حذف هذا القسم"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>

                    {/* محتوى الكتلة حسب النوع */}
                    
                    {/* 1. كتلة البلط (Hero) */}
                    {block.type === 'hero' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <Input
                            label="العنوان الترحيبي الكبير"
                            value={block.content.title || ''}
                            onChange={(e) => updateBlockContent(block.id, 'title', e.target.value)}
                          />
                          <Input
                            label="الترجمة الفرعية للموقع"
                            value={block.content.subtitle || ''}
                            onChange={(e) => updateBlockContent(block.id, 'subtitle', e.target.value)}
                          />
                        </div>
                        <div className="space-y-4">
                          <div className="border-r-4 border-[#2E7FD9] pr-2 mb-2 text-right">
                            <span className="text-xs font-bold text-ink">الزر الأول (الرئيسي):</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              label="نص الزر الأول"
                              value={block.content.ctaText || ''}
                              onChange={(e) => updateBlockContent(block.id, 'ctaText', e.target.value)}
                            />
                            <Input
                              label="رابط الزر الأول"
                              value={block.content.ctaLink || ''}
                              onChange={(e) => updateBlockContent(block.id, 'ctaLink', e.target.value)}
                            />
                          </div>

                          <div className="border-r-4 border-amber pr-2 mt-4 mb-2 text-right">
                            <span className="text-xs font-bold text-ink">الزر الثاني (صانع الصناديق):</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              label="نص الزر الثاني"
                              value={block.content.cta2Text || ''}
                              onChange={(e) => updateBlockContent(block.id, 'cta2Text', e.target.value)}
                            />
                            <Input
                              label="رابط الزر الثاني"
                              value={block.content.cta2Link || ''}
                              onChange={(e) => updateBlockContent(block.id, 'cta2Link', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. كتلة النصوص (Text) */}
                    {block.type === 'text' && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-ink">محرر النصوص (TipTap Style HTML)</label>
                        <textarea
                          rows={4}
                          value={block.content.text || ''}
                          onChange={(e) => updateBlockContent(block.id, 'text', e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-[#E7DCC2] text-sm rounded-[12px] font-arabic focus:outline-none focus:border-amber"
                          placeholder="اكتب المحتوى بتنسيق فقرات..."
                        />
                      </div>
                    )}

                    {/* 3. كتلة صورة منفردة (Image Block Editor) */}
                    {block.type === 'image' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <Input
                            label="رابط الصورة (URL)"
                            value={block.content.imageUrl || ''}
                            onChange={(e) => updateBlockContent(block.id, 'imageUrl', e.target.value)}
                          />
                          {renderSharedGallery(block.id, block.content.imageUrl || '')}
                          <Input
                            label="تعليق توضيحي أو شرح أسفل الصورة (Caption)"
                            value={block.content.caption || ''}
                            onChange={(e) => updateBlockContent(block.id, 'caption', e.target.value)}
                          />
                        </div>
                        <div className="w-full aspect-[16/9] border border-[#E7DCC2] rounded-[12px] bg-slate-50 overflow-hidden flex items-center justify-center">
                          {block.content.imageUrl ? (
                            <img src={block.content.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-slate-300" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* 4. كتلة النص والصورة المتجاورين (Mixed Block Editor) */}
                    {block.type === 'mixed' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-ink">موقع الصورة للمحاذاة</label>
                          <Select
                            options={[
                              { value: 'right', label: 'الصورة على اليمين والنص على اليسار' },
                              { value: 'left', label: 'الصورة على اليسار والنص على اليمين' }
                            ]}
                            value={block.content.align || 'right'}
                            onChange={(e) => updateBlockContent(block.id, 'align', e.target.value)}
                          />
                          
                          <div className="flex flex-col gap-1 mt-2">
                            <label className="text-xs font-bold text-ink">النص المرافق</label>
                            <textarea
                              rows={4}
                              value={block.content.text || ''}
                              onChange={(e) => updateBlockContent(block.id, 'text', e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-[#E7DCC2] text-xs rounded-[12px] font-arabic focus:outline-none focus:border-amber"
                              placeholder="اكتب المحتوى بتنسيق فقرات..."
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Input
                            label="رابط الصورة (URL)"
                            value={block.content.imageUrl || ''}
                            onChange={(e) => updateBlockContent(block.id, 'imageUrl', e.target.value)}
                          />
                          {renderSharedGallery(block.id, block.content.imageUrl || '')}
                          <div className="w-full aspect-[16/10] border border-[#E7DCC2] rounded-[12px] bg-slate-50 overflow-hidden flex items-center justify-center">
                            {block.content.imageUrl ? (
                              <img src={block.content.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-slate-300" />
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. شريط الإحصائيات (Stats Block Editor) */}
                    {block.type === 'stats' && (
                      <div className="space-y-4 text-right">
                        <h5 className="text-xs font-bold text-ink font-arabic pr-1 border-r-2 border-amber">إعدادات شريط الأرقام والإحصائيات التفاعلي:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[1, 2, 3].map((num) => {
                            const keyEmoji = `stat${num}_emoji`;
                            const keyNumber = `stat${num}_number`;
                            const keyLabel = `stat${num}_label`;
                            return (
                              <div key={num} className="bg-slate-50/70 p-3.5 border border-[#E7DCC2] rounded-[16px] space-y-2.5 flex flex-col justify-between">
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 font-arabic block mb-1">الإحصائية رقم {num}</span>
                                  <Input
                                    label="الرمز أو الأيقونة (Emoji)"
                                    placeholder="🎓"
                                    value={block.content[keyEmoji] || ''}
                                    onChange={(e) => updateBlockContent(block.id, keyEmoji, e.target.value)}
                                  />
                                  
                                  {/* لوحة الاختيار السريع للرموز التعبيرية */}
                                  <div className="flex flex-wrap gap-1 mt-1 bg-white p-1.5 border border-[#E7DCC2] rounded-[10px] justify-start">
                                    {['🎓', '🏫', '🎒', '🚚', '📦', '🛡️', '⭐', '📚', '✏️', '📖', '🎨', '🧩', '🖍️', '📝', '📎', '✂️', '📏', '🏆', '🥇', '🎯', '✨', '🔥', '⚡', '💡', '⏰', '⏳', '📞', '✉️'].map((emoji) => (
                                      <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => updateBlockContent(block.id, keyEmoji, emoji)}
                                        className="w-6.5 h-6.5 flex items-center justify-center text-xs rounded hover:bg-[#FBEBCB]/40 transition-colors"
                                        title="اختر هذا الرمز"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="space-y-2.5 mt-2">
                                  <Input
                                    label="الرقم / الإنجاز (مثال: 2000+)"
                                    placeholder="2000+"
                                    value={block.content[keyNumber] || ''}
                                    onChange={(e) => updateBlockContent(block.id, keyNumber, e.target.value)}
                                  />
                                  <Input
                                    label="الوصف (مثال: طالب سعيد)"
                                    placeholder="طالب سعيد"
                                    value={block.content[keyLabel] || ''}
                                    onChange={(e) => updateBlockContent(block.id, keyLabel, e.target.value)}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 5.5. قسم التقييمات والآراء (Testimonials Block Editor) */}
                    {block.type === 'testimonials' && (
                      <div className="space-y-4 text-right">
                        <h5 className="text-xs font-bold text-ink font-arabic pr-1 border-r-2 border-amber mb-3">محرر كتلة آراء وتقييمات العملاء المخصصة:</h5>
                        
                        <div className="p-5 bg-white border border-[#E7DCC2] rounded-[16px] shadow-premium space-y-8 text-center" dir="rtl">
                          {/* Header Editor */}
                          <div className="space-y-2.5 max-w-xl mx-auto text-right">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block mb-1">العنوان الفرعي للقسم:</span>
                                <input
                                  type="text"
                                  value={block.content.subtitle || ''}
                                  onChange={(e) => updateBlockContent(block.id, 'subtitle', e.target.value)}
                                  className="w-full text-right text-amber font-extrabold text-xs bg-slate-50 border border-slate-200 rounded-[12px] px-3.5 py-2.5 focus:bg-white outline-none focus:border-amber font-arabic"
                                  placeholder="مثال: قالوا عن مكتبة الخضري"
                                />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block mb-1">العنوان الرئيسي للقسم:</span>
                                <input
                                  type="text"
                                  value={block.content.title || ''}
                                  onChange={(e) => updateBlockContent(block.id, 'title', e.target.value)}
                                  className="w-full text-right text-xs font-black text-ink bg-slate-50 border border-slate-200 rounded-[12px] px-3.5 py-2.5 focus:bg-white outline-none focus:border-amber font-arabic"
                                  placeholder="مثال: آراء عائلتنا الدافئة 🎓"
                                />
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block mb-1">نص زر المشاركة والتقييم:</span>
                              <input
                                type="text"
                                value={block.content.ctaText || ''}
                                onChange={(e) => updateBlockContent(block.id, 'ctaText', e.target.value)}
                                className="w-full text-right text-xs font-bold bg-slate-50 text-slate-800 border border-slate-200 rounded-[12px] px-3.5 py-2.5 focus:bg-white outline-none focus:border-amber font-arabic"
                                placeholder="مثال: شاركينا تقييمك وتجربتك معنا ✍️"
                              />
                            </div>
                          </div>

                          {/* Testimonials Cards Editor */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
                            {[1, 2, 3].map((num) => {
                              const keyName = `rev${num}_name`;
                              const keyCity = `rev${num}_city`;
                              const keyComment = `rev${num}_comment`;
                              const keyRating = `rev${num}_rating`;
                              const ratingVal = Number(block.content[keyRating] || 5);

                              return (
                                <div
                                  key={num}
                                  className="bg-slate-50/40 rounded-[16px] border border-paper-line p-5 shadow-card text-right relative overflow-hidden flex flex-col justify-between hover:border-amber/40 transition-colors"
                                >
                                  {/* Quote Watermark */}
                                  <span className="absolute -top-3 -right-2 text-paper-line/30 font-serif text-[90px] select-none pointer-events-none leading-none">
                                    “
                                  </span>

                                  <div className="space-y-3.5 relative z-10">
                                    {/* Rating stars selector */}
                                    <div className="flex gap-0.5 justify-start">
                                      {Array.from({ length: 5 }).map((_, idx) => {
                                        const val = idx + 1;
                                        return (
                                          <button
                                            key={idx}
                                            type="button"
                                            onClick={() => updateBlockContent(block.id, keyRating, val)}
                                            className="p-0.5 hover:scale-120 transition-transform"
                                            title={`تقييم ${val} نجوم`}
                                          >
                                            <Star 
                                              className={`w-4 h-4 ${val <= ratingVal ? 'text-amber fill-amber' : 'text-slate-200'}`} 
                                            />
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {/* Comment text area */}
                                    <div>
                                      <span className="text-[9px] font-bold text-slate-400 block mb-1">التعليق والتقييم:</span>
                                      <textarea
                                        rows={3}
                                        value={block.content[keyComment] || ''}
                                        onChange={(e) => updateBlockContent(block.id, keyComment, e.target.value)}
                                        className="w-full text-xs text-ink-soft/90 leading-relaxed font-tajawal font-medium bg-white border border-slate-200 rounded-[10px] p-2.5 focus:outline-none focus:border-amber resize-none font-tajawal"
                                        placeholder="اكتب تعليق العميل هنا..."
                                      />
                                    </div>
                                  </div>

                                  {/* Footer Fields */}
                                  <div className="border-t border-paper-line pt-3 mt-4 flex items-center justify-between z-10 relative">
                                    <div className="text-right space-y-2 flex-grow pl-3">
                                      <div>
                                        <span className="text-[8px] font-bold text-slate-400 block mb-0.5">اسم العميل:</span>
                                        <input
                                          type="text"
                                          value={block.content[keyName] || ''}
                                          onChange={(e) => updateBlockContent(block.id, keyName, e.target.value)}
                                          className="w-full font-extrabold text-xs text-ink bg-white border border-slate-200 rounded-[8px] px-2 py-1 focus:outline-none focus:border-amber font-arabic"
                                          placeholder="مثال: ندى أحمد"
                                        />
                                      </div>
                                      <div>
                                        <span className="text-[8px] font-bold text-slate-400 block mb-0.5">المحافظة / المدينة:</span>
                                        <input
                                          type="text"
                                          value={block.content[keyCity] || ''}
                                          onChange={(e) => updateBlockContent(block.id, keyCity, e.target.value)}
                                          className="w-full text-[10px] text-ink/50 block font-tajawal font-bold bg-white border border-slate-200 rounded-[8px] px-2 py-1 focus:outline-none focus:border-amber font-tajawal"
                                          placeholder="مثال: دمياط"
                                        />
                                      </div>
                                    </div>
                                    
                                    <span className="text-amber shrink-0 self-end mb-1">
                                      <Heart className="w-4.5 h-4.5 fill-current" />
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 6. قسم الباقات المدرسية (Packages Section Block Editor) */}
                    {block.type === 'packages_section' && (
                      <div className="space-y-4 text-right">
                        <h5 className="text-xs font-bold text-ink font-arabic pr-1 border-r-2 border-amber">إعدادات قسم الباقات المدرسية الجاهزة:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="عنوان القسم الرئيسي"
                            value={block.content.title || ''}
                            onChange={(e) => updateBlockContent(block.id, 'title', e.target.value)}
                          />
                          <Input
                            label="الوصف الفرعي للقسم"
                            value={block.content.subtitle || ''}
                            onChange={(e) => updateBlockContent(block.id, 'subtitle', e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="نص زر الانتقال (مثال: عرض كل الباقات)"
                            value={block.content.ctaText || ''}
                            onChange={(e) => updateBlockContent(block.id, 'ctaText', e.target.value)}
                          />
                          <Input
                            label="رابط زر الانتقال (URL)"
                            value={block.content.ctaLink || ''}
                            onChange={(e) => updateBlockContent(block.id, 'ctaLink', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-ink block">الباقات المدرسية الجاهزة المعروضة في هذا القسم:</label>
                          <p className="text-[10px] text-slate-400 font-arabic">حدد الباقات التي ترغب في عرضها بالترتيب. إذا لم تحدد أي باقة، فسيتم عرض كافة الباقات النشطة تلقائياً.</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 bg-slate-50 p-3.5 rounded-[10px] border border-slate-100 max-h-48 overflow-y-auto">
                            {boxes.map((box) => {
                              const isChecked = Array.isArray(block.content.boxIds) 
                                ? block.content.boxIds.includes(box.id)
                                : false;
                              return (
                                <label key={box.id} className="flex items-center gap-2 text-xs font-medium text-ink cursor-pointer hover:bg-slate-100 p-1.5 rounded-md transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const currentIds = Array.isArray(block.content.boxIds) ? [...block.content.boxIds] : [];
                                      if (e.target.checked) {
                                        if (!currentIds.includes(box.id)) {
                                          currentIds.push(box.id);
                                        }
                                      } else {
                                        const idx = currentIds.indexOf(box.id);
                                        if (idx > -1) {
                                          currentIds.splice(idx, 1);
                                        }
                                      }
                                      updateBlockContent(block.id, 'boxIds', currentIds);
                                    }}
                                    className="rounded border-[#E7DCC2] text-amber focus:ring-amber w-3.5 h-3.5"
                                  />
                                  <span className="font-arabic text-[11px] text-ink">{box.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 7. قسم صانع البوكسات (Box Builder Section Block Editor) */}
                    {block.type === 'box_builder_section' && (
                      <div className="space-y-4 text-right">
                        <h5 className="text-xs font-bold text-ink font-arabic pr-1 border-r-2 border-amber">إعدادات قسم صانع البوكسات التعليمية المخصصة:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Input
                            label="عنوان القسم الرئيسي"
                            value={block.content.title || ''}
                            onChange={(e) => updateBlockContent(block.id, 'title', e.target.value)}
                          />
                          <Input
                            label="الوصف الفرعي للقسم"
                            value={block.content.subtitle || ''}
                            onChange={(e) => updateBlockContent(block.id, 'subtitle', e.target.value)}
                          />
                          <Input
                            label="نص زر البدء بالتصميم"
                            value={block.content.ctaText || ''}
                            onChange={(e) => updateBlockContent(block.id, 'ctaText', e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* 10. ترويسة صفحة من نحن (About Header Editor) */}
                    {block.type === 'about_header' && (
                      <div className="space-y-4 text-right">
                        <h5 className="text-xs font-bold text-coral font-arabic pr-1 border-r-2 border-coral">إعدادات ترويسة صفحة من نحن:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="عنوان الصفحة الرئيسي"
                            value={block.content.title || ''}
                            onChange={(e) => updateBlockContent(block.id, 'title', e.target.value)}
                          />
                          <Input
                            label="الوصف الفرعي (شعار الصفحة)"
                            value={block.content.subtitle || ''}
                            onChange={(e) => updateBlockContent(block.id, 'subtitle', e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* 11. قصة نجاح من نحن (About Story Editor) */}
                    {block.type === 'about_story' && (
                      <div className="space-y-4 text-right">
                        <h5 className="text-xs font-bold text-coral font-arabic pr-1 border-r-2 border-coral">إعدادات قصة النجاح والمحتوى التعريفي:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="عنوان الفقرة الرئيسي"
                            value={block.content.title || ''}
                            onChange={(e) => updateBlockContent(block.id, 'title', e.target.value)}
                          />
                          <Input
                            label="رابط الصورة الجانبية"
                            value={block.content.imageUrl || ''}
                            onChange={(e) => updateBlockContent(block.id, 'imageUrl', e.target.value)}
                          />
                        </div>
                        {renderSharedGallery(block.id, block.content.imageUrl || '')}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-ink">الفقرة الأولى</label>
                          <textarea
                            value={block.content.text1 || ''}
                            onChange={(e) => updateBlockContent(block.id, 'text1', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-[#E7DCC2] rounded-[10px] text-xs font-arabic focus:outline-none focus:border-amber"
                            placeholder="اكتب الفقرة الأولى هنا..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-ink">الفقرة الثانية (اختياري)</label>
                          <textarea
                            value={block.content.text2 || ''}
                            onChange={(e) => updateBlockContent(block.id, 'text2', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-[#E7DCC2] rounded-[10px] text-xs font-arabic focus:outline-none focus:border-amber"
                            placeholder="اكتب الفقرة الثانية هنا..."
                          />
                        </div>
                      </div>
                    )}

                    {/* 12. قيم ورسالة من نحن (About Values Editor) */}
                    {block.type === 'about_values' && (
                      <div className="space-y-4 text-right">
                        <h5 className="text-xs font-bold text-coral font-arabic pr-1 border-r-2 border-coral">إعدادات كروت الرؤية والرسالة والتاريخ (3 أعمدة):</h5>
                        
                        {/* Card 1 */}
                        <div className="bg-slate-50 p-4 rounded-[10px] border border-slate-100 space-y-3">
                          <span className="text-xs font-bold text-ink font-arabic block border-b pb-1">الكرت الأول (اليمين):</span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Input
                              label="أيقونة / إيموجي"
                              placeholder="🎯"
                              value={block.content.card1_emoji || ''}
                              onChange={(e) => updateBlockContent(block.id, 'card1_emoji', e.target.value)}
                            />
                            <Input
                              label="العنوان"
                              value={block.content.card1_title || ''}
                              onChange={(e) => updateBlockContent(block.id, 'card1_title', e.target.value)}
                            />
                            <Input
                              label="النص الوصفي"
                              value={block.content.card1_text || ''}
                              onChange={(e) => updateBlockContent(block.id, 'card1_text', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-slate-50 p-4 rounded-[10px] border border-slate-100 space-y-3">
                          <span className="text-xs font-bold text-ink font-arabic block border-b pb-1">الكرت الثاني (الوسط):</span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Input
                              label="أيقونة / إيموجي"
                              placeholder="🏆"
                              value={block.content.card2_emoji || ''}
                              onChange={(e) => updateBlockContent(block.id, 'card2_emoji', e.target.value)}
                            />
                            <Input
                              label="العنوان"
                              value={block.content.card2_title || ''}
                              onChange={(e) => updateBlockContent(block.id, 'card2_title', e.target.value)}
                            />
                            <Input
                              label="النص الوصفي"
                              value={block.content.card2_text || ''}
                              onChange={(e) => updateBlockContent(block.id, 'card2_text', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-slate-50 p-4 rounded-[10px] border border-slate-100 space-y-3">
                          <span className="text-xs font-bold text-ink font-arabic block border-b pb-1">الكرت الثالث (اليسار):</span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Input
                              label="أيقونة / إيموجي"
                              placeholder="⏳"
                              value={block.content.card3_emoji || ''}
                              onChange={(e) => updateBlockContent(block.id, 'card3_emoji', e.target.value)}
                            />
                            <Input
                              label="العنوان"
                              value={block.content.card3_title || ''}
                              onChange={(e) => updateBlockContent(block.id, 'card3_title', e.target.value)}
                            />
                            <Input
                              label="النص الوصفي"
                              value={block.content.card3_text || ''}
                              onChange={(e) => updateBlockContent(block.id, 'card3_text', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 9. قسم عرض منتجات تصنيف معين (Products Row Editor) */}
                    {block.type === 'products_row' && (
                      <div className="space-y-4 text-right">
                        <h5 className="text-xs font-bold text-[#2E7FD9] font-arabic pr-1 border-r-2 border-[#2E7FD9]">إعدادات قسم عرض المنتجات التفاعلي:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="عنوان قسم المنتجات (مثال: أحدث المستلزمات المكتبية)"
                            value={block.content.title || ''}
                            onChange={(e) => updateBlockContent(block.id, 'title', e.target.value)}
                          />
                          <Input
                            label="وصف فرعي للقسم (اختياري)"
                            value={block.content.subtitle || ''}
                            onChange={(e) => updateBlockContent(block.id, 'subtitle', e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-ink">التصنيف لعرض منتجاته</label>
                            <select
                              value={block.content.categoryId || 'all'}
                              onChange={(e) => updateBlockContent(block.id, 'categoryId', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-[#E7DCC2] text-xs rounded-[10px] font-arabic focus:outline-none focus:border-amber h-[36px]"
                            >
                              <option value="all">⭐ المنتجات الأكثر طلباً (Featured)</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  📁 {cat.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-ink">عدد المنتجات المعروضة</label>
                            <select
                              value={block.content.limit || 8}
                              onChange={(e) => updateBlockContent(block.id, 'limit', Number(e.target.value))}
                              className="w-full px-3 py-2 bg-white border border-[#E7DCC2] text-xs rounded-[10px] font-arabic focus:outline-none focus:border-amber h-[36px]"
                            >
                              <option value={4}>4 منتجات</option>
                              <option value={6}>6 منتجات</option>
                              <option value={8}>8 منتجات</option>
                              <option value={12}>12 منتج</option>
                              <option value={16}>16 منتج</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-ink">تنسيق وطريقة عرض المنتجات</label>
                            <select
                              value={block.content.layout || 'scroll'}
                              onChange={(e) => updateBlockContent(block.id, 'layout', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-[#E7DCC2] text-xs rounded-[10px] font-arabic focus:outline-none focus:border-amber h-[36px]"
                            >
                              <option value="scroll">⬅️ أفقي (تمرير جانبي Scroll)</option>
                              <option value="grid">⬇️ عمودي (شبكة Grid تحت بعضها)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 8. قسم الاتصال وتفاصيل التواصل والزر (Contact Section Block Editor) */}
                    {block.type === 'contact_section' && (
                      <div className="space-y-4 text-right">
                        <h5 className="text-xs font-bold text-ink font-arabic pr-1 border-r-2 border-amber">إعدادات تفاصيل الاتصال والزر للتواصل:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <Input
                            label="رقم الهاتف الساخن"
                            value={block.content.phone || ''}
                            onChange={(e) => updateBlockContent(block.id, 'phone', e.target.value)}
                          />
                          <Input
                            label="البريد الإلكتروني الرسمي"
                            value={block.content.email || ''}
                            onChange={(e) => updateBlockContent(block.id, 'email', e.target.value)}
                          />
                          <Input
                            label="العنوان الجغرافي للمقر"
                            value={block.content.address || ''}
                            onChange={(e) => updateBlockContent(block.id, 'address', e.target.value)}
                          />
                          <Input
                            label="مواعيد العمل الرسمية"
                            value={block.content.work_hours || ''}
                            onChange={(e) => updateBlockContent(block.id, 'work_hours', e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <Input
                            label="وصف الخط الساخن الفرعي"
                            value={block.content.phone_subtext || ''}
                            onChange={(e) => updateBlockContent(block.id, 'phone_subtext', e.target.value)}
                          />
                          <Input
                            label="وصف البريد الإلكتروني الفرعي"
                            value={block.content.email_subtext || ''}
                            onChange={(e) => updateBlockContent(block.id, 'email_subtext', e.target.value)}
                          />
                          <Input
                            label="وصف المقر الرئيسي الفرعي"
                            value={block.content.address_subtext || ''}
                            onChange={(e) => updateBlockContent(block.id, 'address_subtext', e.target.value)}
                          />
                          <Input
                            label="وصف مواعيد العمل الفرعي"
                            value={block.content.work_hours_subtext || ''}
                            onChange={(e) => updateBlockContent(block.id, 'work_hours_subtext', e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="نص زر الاتصال والتواصل الرئيسي"
                            value={block.content.ctaText || ''}
                            onChange={(e) => updateBlockContent(block.id, 'ctaText', e.target.value)}
                          />
                          <Input
                            label="رابط زر الاتصال (واتساب أو رابط tel:)"
                            value={block.content.ctaLink || ''}
                            onChange={(e) => updateBlockContent(block.id, 'ctaLink', e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
              <div className="bg-white py-14 text-center text-slate-400 font-arabic text-xs border border-dashed border-[#E7DCC2] rounded-[16px] flex flex-col items-center justify-center gap-3">
                <LayoutGrid className="w-8 h-8 text-slate-300" />
                <span>الصفحة فارغة! لم تقم بإضافة أي كتل محتوى. اختر نوع الكتلة لإدراجها بالأسفل.</span>
              </div>
            )}



          </div>
        </div>

          {/* المعاينة الحية الجانبية Sticky (Desktop Only) */}
          <div className="hidden xl:block xl:col-span-1 h-full">
            <div className="sticky top-24 space-y-3">
              <div className="bg-white p-3.5 rounded-[16px] border border-[#E7DCC2] shadow-sm text-center">
                <span className="text-xs font-black text-ink font-arabic flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  شاشة معاينة تفاعلية حية
                </span>
                <p className="text-[9px] text-slate-400 mt-0.5 font-arabic">تتحدث تلقائياً مع كل حرف تقوم بتعديله</p>
              </div>
              {renderMobileSimulator("max-w-[320px] shadow-lg")}
            </div>
          </div>
        </div>
      ) : (
        <div className="lg:col-span-3 bg-white py-20 text-center text-slate-400 font-arabic text-sm rounded-[16px] shadow-premium">
          يرجى اختيار صفحة من شريط التصفح الجانبي للأقسام للبدء في تعديل كتلها.
        </div>
      )}

      {/* مودال المعاينة الحية للمتصفح المكتبي/الجوال */}
      <Dialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={`معاينة حية وتفاعلية لصفحة: ${pageTitle}`}
        size="xl"
      >
        <div className="w-full flex justify-center bg-slate-100 p-4 rounded-[12px] overflow-hidden">
          {renderMobileSimulator("max-w-[375px]")}
        </div>
        
        <div className="flex justify-end mt-4">
          <Button variant="primary" size="sm" onClick={() => setIsPreviewOpen(false)} className="font-arabic">
            إغلاق المعاينة
          </Button>
        </div>
      </Dialog>

    </div>
  );
}
