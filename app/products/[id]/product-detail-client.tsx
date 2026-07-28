'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingCart, Check, Plus, Minus, ShieldCheck, Box, ArrowRight, Star } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { trackClientEvent } from '@/lib/tracking';
import { supabase } from '@/lib/supabase';
import { getMockData } from '@/lib/mockData';
import ProductCard from '@/components/store/product-card';

interface ProductDetailClientProps {
  product: {
    id: string;
    name: string;
    description?: string;
    price_unit: number;
    price_box?: number | null;
    images: string[];
    category_id?: string;
    categories?: { name: string } | null;
    colors?: string[];
    sizes?: { name: string; price: number }[];
  };
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const searchParams = useSearchParams();
  const boxId = searchParams.get('boxId');

  const images = product.images?.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80'];

  // Parse color options from description if present
  const desc = product.description || '';
  const colorsMatch = desc.match(/\[COLORS\]:\s*(.+)$/m);
  const colorsFromDesc = colorsMatch && colorsMatch[1]
    ? colorsMatch[1].split(',').map((c: string) => c.trim()).filter(Boolean)
    : [];
  const colors = product.colors?.length ? product.colors : colorsFromDesc;
  const cleanDescription = desc.replace(/\[COLORS\]:\s*(.+)$/m, '').trim();

  const sizes = product.sizes || [];

  // ---- تجميع المقاسات: دمج (فردي) و(علبة) بنفس الاسم في مجموعة واحدة ----
  const sizeGroups = (() => {
    const groups: Record<string, { unitPrice?: number; boxPrice?: number }> = {};
    sizes.forEach(s => {
      const unitMatch = s.name.match(/^(.+?)\s*\(فردي\)$/);
      const boxMatch  = s.name.match(/^(.+?)\s*\(علبة\)$/);
      if (unitMatch) {
        const base = unitMatch[1].trim();
        if (!groups[base]) groups[base] = {};
        groups[base].unitPrice = s.price;
      } else if (boxMatch) {
        const base = boxMatch[1].trim();
        if (!groups[base]) groups[base] = {};
        groups[base].boxPrice = s.price;
      } else {
        if (!groups[s.name]) groups[s.name] = {};
        groups[s.name].unitPrice = s.price; // سعر وحيد → يُعامَل كـ فردي
      }
    });
    return Object.entries(groups).map(([name, prices]) => ({ name, ...prices }));
  })();

  const [activeImage, setActiveImage] = useState(images[0]);
  // unitType: للمنتجات بدون مقاسات (price_unit / price_box)
  const [unitType, setUnitType] = useState<'piece' | 'box'>('piece');
  // selectedSizeGroup: اسم المجموعة المختارة من sizeGroups
  const [selectedSizeGroup, setSelectedSizeGroup] = useState<string | null>(
    sizeGroups.length > 0 ? sizeGroups[0].name : null
  );
  // sizeUnitType: هل المستخدم اختار فردي أم علبة داخل المقاس؟
  const [sizeUnitType, setSizeUnitType] = useState<'unit' | 'box'>('unit');
  // selectedColors: الألوان المُختارة — كل لون = قطعة واحدة
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  // quantity: إذا فيه ألوان، الكمية = عدد الألوان المختارة (min 1)؛ وإلا يدوي
  const [manualQty, setManualQty] = useState(1);
  const quantity = colors.length > 0 ? Math.max(1, selectedColors.length) : manualQty;
  const [added, setAdded] = useState(false);
  const [resolvedCategory, setResolvedCategory] = useState(product.categories?.name || 'أدوات مدرسية');
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // ---- حساب السعر الحالي ----
  const activeSizeGroup = sizeGroups.find(g => g.name === selectedSizeGroup);
  const currentPrice = (() => {
    if (activeSizeGroup) {
      // إذا اختار "علبة" وفيه سعر علبة → استخدمه
      if (sizeUnitType === 'box' && activeSizeGroup.boxPrice !== undefined) return activeSizeGroup.boxPrice;
      // إذا اختار "فردي" وفيه سعر فردي → استخدمه
      if (sizeUnitType === 'unit' && activeSizeGroup.unitPrice !== undefined) return activeSizeGroup.unitPrice;
      // fallback: أي سعر متاح
      return activeSizeGroup.unitPrice ?? activeSizeGroup.boxPrice ?? product.price_unit;
    }
    // بدون مقاسات: استخدم نوع الشراء
    return unitType === 'piece' ? product.price_unit : (product.price_box || product.price_unit);
  })();

  const handleAddToBox = () => {
    if (!boxId || typeof window === 'undefined') return;

    const saved = localStorage.getItem(`kh_custom_box_${boxId}`);
    let items: any[] = [];
    if (saved) {
      try {
        items = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }

    const existing = items.find((item) => item.productId === product.id);
    let updatedItems = [];
    if (existing) {
      updatedItems = items.map((item) => {
        if (item.productId === product.id) {
          return {
            ...item,
            qty: item.qty + quantity,
            colors: item.colors ? [...item.colors, ...selectedColors] : selectedColors
          };
        }
        return item;
      });
    } else {
      updatedItems = [
        ...items,
        {
          productId: product.id,
          name: product.name,
          qty: quantity,
          price: currentPrice,
          image: images[0],
          categoryId: product.category_id || '',
          categoryName: resolvedCategory,
          colors: colors.length > 0 ? selectedColors : undefined
        }
      ];
    }

    localStorage.setItem(`kh_custom_box_${boxId}`, JSON.stringify(updatedItems));
    
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      router.push(`/boxes/${boxId}/add-products`);
    }, 1500);
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', product.id)
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setReviews(data);
          return;
        }
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
        
        const productReviews = allReviews.filter((r: any) => r.product_id === product.id);
        
        if (productReviews.length === 0) {
          const defaultMock = [
            {
              id: 'mock-1',
              product_id: product.id,
              customer_name: 'أحمد محمود',
              rating: 5,
              comment: 'منتج ممتاز جداً وجودة الخامات فوق المتوقع، والتوصيل كان سريع.',
              created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              is_verified: true
            },
            {
              id: 'mock-2',
              product_id: product.id,
              customer_name: 'أميرة صلاح',
              rating: 4,
              comment: 'جميل جداً وتغليفه ممتاز، أنصح به بشدة لكل الطلاب.',
              created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              is_verified: true
            }
          ];
          
          const updatedAll = [...allReviews, ...defaultMock];
          localStorage.setItem('kh_reviews', JSON.stringify(updatedAll));
          setReviews(defaultMock);
        } else {
          setReviews(productReviews);
        }
      }
    };

    fetchReviews();
  }, [product.id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewText.trim()) return;
    setSubmittingReview(true);

    const reviewObj = {
      id: `rev-${Date.now()}`,
      product_id: product.id,
      product_name: product.name,
      customer_name: newReviewName,
      rating: newReviewRating,
      comment: newReviewText,
      created_at: new Date().toISOString(),
      is_verified: false
    };

    try {
      await supabase.from('reviews').insert([reviewObj]);
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
      allReviews.unshift(reviewObj);
      localStorage.setItem('kh_reviews', JSON.stringify(allReviews));
    }

    setReviews(prev => [reviewObj, ...prev]);
    setNewReviewName('');
    setNewReviewText('');
    setNewReviewRating(5);
    setSubmittingReview(false);
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      let allProducts: any[] = [];
      try {
        const { data } = await supabase.from('products').select('*');
        if (data && data.length > 0) {
          allProducts = data;
        } else {
          allProducts = getMockData.products();
        }
      } catch (err) {
        allProducts = getMockData.products();
      }

      // Filter out the current product
      const filtered = allProducts.filter((p) => p.id !== product.id);

      // Recommendations Logic:
      // 1. First, select products in the same category
      let recommended = filtered.filter((p) => p.category_id === product.category_id);

      // 2. If less than 4, pad with other products
      if (recommended.length < 4) {
        const otherProducts = filtered.filter((p) => p.category_id !== product.category_id);
        recommended = [...recommended, ...otherProducts].slice(0, 4);
      } else {
        recommended = recommended.slice(0, 4);
      }

      setRecommendations(recommended);
    };

    fetchRecommendations();
  }, [product]);

  const handleBuyNow = () => {
    const sizeSuffix = activeSizeGroup
      ? ` (${activeSizeGroup.name} - ${sizeUnitType === 'unit' ? 'فردي' : 'علبة'})`
      : '';
    addItem({
      type: 'product',
      productId: product.id,
      name: `${product.name}${sizeSuffix}`,
      price: currentPrice,
      qty: quantity,
      image: images[0],
      unitType: activeSizeGroup ? sizeUnitType : unitType,
      selectedSize: activeSizeGroup?.name,
      colors: colors.length > 0 ? selectedColors : undefined,
    } as any);

    trackClientEvent('AddToCart', {
      id: product.id,
      name: product.name,
      value: currentPrice,
      qty: quantity,
    });

    router.push('/checkout');
  };

  useEffect(() => {
    if (product.categories?.name) {
      setResolvedCategory(product.categories.name);
      return;
    }
    try {
      const local = localStorage.getItem('kh_categories');
      if (local) {
        const categoriesList = JSON.parse(local);
        const cat = categoriesList.find((c: any) => c.id === product.category_id);
        if (cat) setResolvedCategory(cat.name);
      }
    } catch (e) {
      console.error(e);
    }
  }, [product]);

  // (تمت إزالة منطق مزامنة الألوان مع الكمية - الآن الألوان تتحكم في الكمية)

  // 1. Fire ViewContent event on mount
  useEffect(() => {
    trackClientEvent('ViewContent', {
      id: product.id,
      name: product.name,
      value: product.price_unit,
      type: 'product',
    });
  }, [product]);



  const handleAdd = () => {
    const sizeSuffix = activeSizeGroup
      ? ` (${activeSizeGroup.name} - ${sizeUnitType === 'unit' ? 'فردي' : 'علبة'})`
      : '';
    addItem({
      type: 'product',
      productId: product.id,
      name: `${product.name}${sizeSuffix}`,
      price: currentPrice,
      qty: quantity,
      image: images[0],
      unitType: activeSizeGroup ? sizeUnitType : unitType,
      colors: colors.length > 0 ? selectedColors : undefined,
    } as any);

    trackClientEvent('AddToCart', {
      id: product.id,
      name: product.name,
      value: currentPrice,
      qty: quantity,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="space-y-12">
      {boxId && (
        <div className="text-right">
          <Link
            href={`/boxes/${boxId}/add-products`}
            className="inline-flex items-center gap-1.5 text-xs text-amber hover:underline font-bold font-arabic flex-row-reverse"
          >
            <ArrowRight size={14} />
            <span>العودة لكتالوج إضافة المنتجات</span>
          </Link>
        </div>
      )}
      <div className="bg-white rounded-card shadow-brand border border-brand-border p-6 md:p-10 relative overflow-hidden">
      
      {/* 2-Column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Right column: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-50 border border-paper-line">
            <Image
              src={activeImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
              className="object-cover"
              priority
            />
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(img)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 bg-white ${
                    activeImage === img ? 'border-primary' : 'border-brand-border hover:border-primary/40'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover p-1"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Left column: Product Actions & Information */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Category tag */}
            <span className="inline-block bg-primary/10 text-primary text-xs font-extrabold px-3 py-1 rounded-full border border-primary/10">
              {resolvedCategory}
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-brand-text leading-snug">
              {product.name}
            </h1>

            {/* Price section */}
            <div className="p-4 bg-brand-bg/40 rounded-2xl border border-brand-border/60 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-brand-text/50 text-xs font-bold">
                  {activeSizeGroup
                    ? `السعر النهائي (${sizeUnitType === 'unit' ? 'فردي' : 'علبة'}):`
                    : unitType === 'piece' ? 'سعر القطعة (فردي):' : 'سعر العلبة الكاملة:'}
                </span>
                <span className="text-primary font-black text-2xl font-numbers">
                  {currentPrice} <span className="text-sm font-cairo font-semibold">ج.م</span>
                </span>
              </div>
            </div>

            {/* ---- Sizes / Variants Selector ---- */}
            {sizeGroups.length > 0 && (
              <div className="space-y-3 mt-4" dir="rtl">
                <span className="block text-xs font-bold text-slate-700 font-arabic">اختر الحجم / الكمية المطلوبة:</span>
                {/* Chips الرئيسية */}
                <div className="flex flex-wrap gap-2">
                  {sizeGroups.map(group => {
                    const isActive = selectedSizeGroup === group.name;
                    return (
                      <button
                        key={group.name}
                        type="button"
                        onClick={() => {
                          setSelectedSizeGroup(group.name);
                          // تلقائياً اختر النوع المتاح
                          if (group.unitPrice !== undefined) setSizeUnitType('unit');
                          else if (group.boxPrice !== undefined) setSizeUnitType('box');
                        }}
                        className={`px-4 py-2 rounded-full text-sm font-bold font-arabic border-2 transition-all ${
                          isActive
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-md scale-[1.03]'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50'
                        }`}
                      >
                        {group.name}
                      </button>
                    );
                  })}
                </div>

                {/* عند اختيار مجموعة: أظهر سعر الفردي والعلبة */}
                {activeSizeGroup && (
                  <div className="flex flex-wrap gap-2 pt-1 pb-1 px-1 bg-slate-50 rounded-2xl border border-slate-200 animate-fade-in">
                    {activeSizeGroup.unitPrice !== undefined && (
                      <button
                        type="button"
                        onClick={() => setSizeUnitType('unit')}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold font-arabic border-2 transition-all flex flex-col items-center gap-0.5 ${
                          sizeUnitType === 'unit'
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'
                        }`}
                      >
                        <span>🟢 فردي / قطعة</span>
                        <span className="text-[11px] font-numbers font-black opacity-90">{activeSizeGroup.unitPrice} ج.م</span>
                      </button>
                    )}
                    {activeSizeGroup.boxPrice !== undefined && (
                      <button
                        type="button"
                        onClick={() => setSizeUnitType('box')}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold font-arabic border-2 transition-all flex flex-col items-center gap-0.5 ${
                          sizeUnitType === 'box'
                            ? 'bg-blue-500 border-blue-500 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                        }`}
                      >
                        <span>📦 علبة / جملة</span>
                        <span className="text-[11px] font-numbers font-black opacity-90">{activeSizeGroup.boxPrice} ج.م</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {cleanDescription && (
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-brand-text font-arabic">وصف المنتج:</h3>
                <p className="text-brand-text/70 text-sm leading-relaxed font-arabic">
                  {cleanDescription}
                </p>
              </div>
            )}

            {/* Colors Selector: كل لون تنقر عليه = قطعة واحدة */}
            {colors.length > 0 && (
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-right mt-4 animate-fade-in" dir="rtl">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-arabic">
                    {selectedColors.length > 0
                      ? `${selectedColors.length} قطعة مختارة`
                      : 'انقر على اللون لإضافة قطعة'}
                  </span>
                  <span className="block text-xs font-bold text-ink-soft font-arabic">اختر الألوان المطلوبة:</span>
                </div>

                {/* أزرار الألوان */}
                <div className="flex flex-wrap gap-2 justify-end">
                  {colors.map(color => {
                    const count = selectedColors.filter(c => c === color).length;
                    const isSelected = count > 0;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          // كل ضغطة تضيف قطعة من هذا اللون
                          setSelectedColors(prev => [...prev, color]);
                        }}
                        onContextMenu={(e) => {
                          // كليك يمين يحذف آخر قطعة من هذا اللون
                          e.preventDefault();
                          setSelectedColors(prev => {
                            const idx = [...prev].lastIndexOf(color);
                            if (idx === -1) return prev;
                            const next = [...prev];
                            next.splice(idx, 1);
                            return next;
                          });
                        }}
                        className={`px-4 py-2 rounded-full border-2 text-sm font-bold font-arabic transition-all relative ${
                          isSelected
                            ? 'bg-amber border-amber text-white shadow-md scale-[1.05]'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-amber/50 hover:bg-amber/5'
                        }`}
                      >
                        {color}
                        {count > 1 && (
                          <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* ملخص الاختيار */}
                {selectedColors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-dashed border-slate-200">
                    {selectedColors.map((c, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 bg-amber/15 border border-amber/30 text-amber-700 px-2 py-0.5 rounded-full text-[11px] font-bold font-arabic"
                      >
                        {c}
                        <button
                          type="button"
                          onClick={() => setSelectedColors(prev => prev.filter((_, j) => j !== i))}
                          className="text-amber-600 hover:text-red-500 font-black text-xs leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-slate-400 font-arabic text-right">
                  💡 اضغط على اللون لإضافة قطعة — اضغط × لإزالة قطعة
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6 pt-6 border-t border-paper-line">
            {/* Unit Selector: فقط لو ما فيش مقاسات وفيه سعر علبة */}
            {sizeGroups.length === 0 && product.price_box && (
              <div className="space-y-2">
                <span className="block text-xs font-bold text-ink-soft">طريقة الشراء:</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUnitType('piece')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold border-2 transition-all text-center flex flex-col items-center justify-center gap-1 ${
                      unitType === 'piece'
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm font-black'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    <span>🟢 فردي / قطعة</span>
                    <span className="text-[11px] font-numbers font-black">{product.price_unit} ج.م</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUnitType('box')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold border-2 transition-all text-center flex flex-col items-center justify-center gap-1 ${
                      unitType === 'box'
                        ? 'bg-blue-500 border-blue-500 text-white shadow-sm font-black'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <span>📦 علبة / جملة</span>
                    <span className="text-[11px] font-numbers font-black">{product.price_box} ج.م</span>
                  </button>
                </div>
              </div>
            )}

            {/* Qty Selector & Action buttons */}
            <div className="flex flex-col md:flex-row items-center gap-4 w-full">
              
              {/* Qty Counter — مخفي لو في ألوان (الألوان تتحكم في الكمية) */}
              {colors.length === 0 && (
                <div className="flex items-center bg-slate-50 border border-paper-line rounded-cta p-1.5 shrink-0 w-full md:w-auto justify-between">
                  <button
                    type="button"
                    onClick={() => setManualQty(Math.max(1, manualQty - 1))}
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-ink border border-paper-line hover:bg-paper-dark active:scale-95 transition-all"
                    aria-label="تقليل الكمية"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-14 text-center font-bold text-lg font-numbers text-ink">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setManualQty(manualQty + 1)}
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-ink border border-paper-line hover:bg-paper-dark active:scale-95 transition-all"
                    aria-label="زيادة الكمية"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
              {colors.length > 0 && (
                <div className="text-center px-4 py-2 bg-amber/10 border border-amber/30 rounded-cta shrink-0">
                  <span className="text-xs font-bold text-amber font-arabic block">الكمية</span>
                  <span className="text-2xl font-black text-amber font-numbers">{quantity}</span>
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="w-full">
                {boxId ? (
                  <button
                    type="button"
                    onClick={handleAddToBox}
                    disabled={added}
                    className={`w-full py-4 px-6 rounded-cta font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-300 border-2 ${
                      added
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                        : 'bg-amber border-amber text-white shadow-md shadow-amber/20 hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {added ? (
                      <>
                        <Check size={18} />
                        <span>تمت الإضافة للباقة!</span>
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        <span>إضافة للباقة المدرسية</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-3 w-full">
                    {/* Buy Now (Primary CTA) */}
                    <button
                      type="button"
                      onClick={handleBuyNow}
                      className="w-full py-4 px-6 rounded-cta font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 bg-amber hover:bg-amber-deep text-white shadow-md shadow-amber/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    >
                      <span>شراء الآن</span>
                    </button>

                    {/* Add to Cart (Secondary CTA) */}
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={added}
                      className={`w-full py-4 px-6 rounded-cta font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-300 border-2 ${
                        added
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                          : 'border-ink-soft text-ink-soft bg-transparent hover:bg-ink-soft/5 active:scale-[0.98]'
                      }`}
                    >
                      {added ? (
                        <>
                          <Check size={18} />
                          <span>تمت الإضافة!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={18} />
                          <span>أضف للسلة</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Total calculation */}
            <div className="flex items-center justify-between text-xs text-ink-muted pt-2 font-numbers">
              <span>الإجمالي الجزئي:</span>
              <span className="font-bold text-amber text-sm">
                {(currentPrice * quantity).toFixed(2)} ج.م
              </span>
            </div>

          </div>
        </div>

      </div>


    </div>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="space-y-6 pt-10 border-t border-paper-line animate-fade-in text-right" dir="rtl">
          <div className="border-r-4 border-amber pr-3">
            <h2 className="text-xl font-bold text-ink font-arabic">قد يعجبك أيضاً (منتجات مقترحة لك)</h2>
            <p className="text-xs text-slate-500 font-arabic mt-1">تشكيلة مختارة من الأدوات والمستلزمات المدرسية التي قد تثير اهتمامك</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
