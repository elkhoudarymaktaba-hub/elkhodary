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
  // selectedSizeGroup: اسم المجموعة المختارة من sizeGroups (افتراضياً null ليعرض السعر الأساسي)
  const [selectedSizeGroup, setSelectedSizeGroup] = useState<string | null>(null);
  // sizeUnitType: هل المستخدم اختار فردي أم علبة داخل المقاس؟
  const [sizeUnitType, setSizeUnitType] = useState<'unit' | 'box'>('unit');
  
  // ---- 🎨 تخزين ألوان كل مقاس بشكل منفصل ومحفوظ ----
  const activeSizeKey = selectedSizeGroup || '__base__';
  const [sizeColorsMap, setSizeColorsMap] = useState<Record<string, string[]>>({});
  const [isColorDrawerOpen, setIsColorDrawerOpen] = useState<boolean>(false);
  
  const selectedColors = sizeColorsMap[activeSizeKey] || [];
  const setSelectedColors = (updater: string[] | ((prev: string[]) => string[])) => {
    setSizeColorsMap(prev => {
      const current = prev[activeSizeKey] || [];
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [activeSizeKey]: next };
    });
  };

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

      // 1. جلب من Supabase
      try {
        const { data } = await supabase.from('products').select('*');
        if (data && data.length > 0) {
          allProducts = data;
        }
      } catch (err) {
        console.warn('Supabase fetch for recommendations failed:', err);
      }

      // 2. جلب من LocalStorage (المنتجات المحلية)
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('kh_products');
          if (stored) {
            const localProducts = JSON.parse(stored);
            // دمج بدون تكرار
            localProducts.forEach((lp: any) => {
              if (!allProducts.some(p => p.id === lp.id)) {
                allProducts.push(lp);
              }
            });
          }
        } catch (_) {}
      }

      // 3. fallback: mock data
      if (allProducts.length === 0) {
        allProducts = getMockData.products();
      }

      // استبعاد المنتج الحالي
      const candidates = allProducts.filter((p) => p.id !== product.id);

      // ---- 🧠 خوارزمية حساب معامل التشابه الذكية (Recommendation Scoring) ----
      const tokenize = (text: string) => {
        if (!text) return [];
        return text
          .toLowerCase()
          .replace(/[^\u0621-\u064Aa-zA-Z0-9\s]/g, '')
          .split(/\s+/)
          .filter(w => w.length > 1);
      };

      const currentTokens = tokenize(`${product.name} ${product.description || ''}`);
      const currentPriceVal = product.price_unit || 1;

      const scoredProducts = candidates.map((item) => {
        let score = 0;

        // أ) تطابق القسم (Category Match) -> 40 نقطة
        if (item.category_id && item.category_id === product.category_id) {
          score += 40;
        }

        // ب) تشابه الكلمات في العنوان والوصف (Title & Word Overlap) -> حتى 35 نقطة
        const itemTokens = tokenize(`${item.name} ${item.description || ''}`);
        const sharedWords = currentTokens.filter(t => itemTokens.includes(t));
        if (sharedWords.length > 0) {
          score += Math.min(35, sharedWords.length * 12);
        }

        // ج) التقارب السعري (Price Proximity) -> 15 نقطة
        const itemPrice = item.price_unit || item.price || 1;
        const priceRatio = Math.abs(itemPrice - currentPriceVal) / currentPriceVal;
        if (priceRatio <= 0.25) {
          score += 15; // تفاوت السعر أقل من 25%
        } else if (priceRatio <= 0.5) {
          score += 8;  // تفاوت السعر أقل من 50%
        }

        // د) المكافأة إذا كان مميزاً (Featured Boost) -> 5 نقاط
        if (item.is_featured) {
          score += 5;
        }

        return { product: item, score };
      });

      // ترتيب المنتجات تنازلياً حسب أعلى نقاط تشابه
      scoredProducts.sort((a, b) => b.score - a.score);

      // اختيار أفضل 4 منتجات مرتبة بالذكاء الاصطناعي
      const topRecommended = scoredProducts.slice(0, 4).map(sp => sp.product);

      setRecommendations(topRecommended);
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
      <div className="bg-white rounded-card shadow-brand border border-brand-border p-3 sm:p-5 relative overflow-hidden">
      
      {/* 2-Column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Right column: Image Gallery */}
        <div className="lg:col-span-5 space-y-2 shrink-0">
          <div className="relative aspect-square max-h-[200px] sm:max-h-[220px] w-full rounded-2xl overflow-hidden bg-slate-50 border border-paper-line flex items-center justify-center p-2 mx-auto">
            <Image
              src={activeImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 45vw, 35vw"
              className="object-contain p-2"
              priority
            />
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar justify-center">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(img)}
                  className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 bg-white ${
                    activeImage === img ? 'border-primary' : 'border-brand-border hover:border-primary/40'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    fill
                    sizes="48px"
                    className="object-contain p-1"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Left column: Product Actions & Information */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-3.5">
          <div className="space-y-3">
            {/* Category tag */}
            <span className="inline-block bg-primary/10 text-primary text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-primary/10">
              {resolvedCategory}
            </span>

            <h1 className="text-xl sm:text-2xl font-black text-brand-text leading-snug">
              {product.name}
            </h1>

            {/* Price section */}
            <div className="p-3 bg-brand-bg/40 rounded-xl border border-brand-border/60 space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-brand-text/70 text-xs font-bold font-arabic">
                  {activeSizeGroup
                    ? `سعر مقاس (${activeSizeGroup.name}) - ${sizeUnitType === 'unit' ? 'فردي' : 'علبة'}:`
                    : unitType === 'piece' ? 'السعر الأساسي للمنتج (فردي):' : 'السعر الأساسي للمنتج (علبة):'}
                </span>
                <div className="text-right">
                  <span className="text-primary font-black text-2xl font-numbers">
                    {currentPrice} <span className="text-sm font-cairo font-semibold">ج.م</span>
                  </span>
                  {activeSizeGroup && (
                    <span className="block text-[10px] text-emerald-600 font-bold font-arabic">
                      ✓ مقاس خاص مفعّل
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ---- Sizes / Variants Selector ---- */}
            {sizeGroups.length > 0 && (
              <div className="space-y-2.5 mt-3" dir="rtl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 font-arabic">
                    اختر مقاس خاص (اختياري):
                  </span>
                  {selectedSizeGroup && (
                    <button
                      type="button"
                      onClick={() => setSelectedSizeGroup(null)}
                      className="text-[11px] text-red-600 hover:text-red-700 font-bold font-arabic flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-lg border border-red-200 transition-colors"
                      title="إلغاء التحديد والرجوع للسعر الأساسي للمنتج"
                    >
                      <span>✖ إلغاء المقاس (الرجوع للأساسي)</span>
                    </button>
                  )}
                </div>

                {/* Chips الرئيسية */}
                <div className="flex flex-wrap gap-2">
                  {sizeGroups.map(group => {
                    const isActive = selectedSizeGroup === group.name;
                    const groupColorsCount = (sizeColorsMap[group.name] || []).length;
                    return (
                      <button
                        key={group.name}
                        type="button"
                        onClick={() => {
                          if (isActive) {
                            // إذا ضغط على المقاس النشط مجدداً -> فتح/إغلاق نافذة الألوان
                            setIsColorDrawerOpen(prev => !prev);
                          } else {
                            setSelectedSizeGroup(group.name);
                            setIsColorDrawerOpen(true); // فتح قائمة الألوان مباشرة عند التبديل
                            if (group.unitPrice !== undefined) setSizeUnitType('unit');
                            else if (group.boxPrice !== undefined) setSizeUnitType('box');
                          }
                        }}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold font-arabic border-2 transition-all flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-md scale-[1.02]'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50'
                        }`}
                      >
                        <span>{group.name}</span>
                        {groupColorsCount > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-numbers font-black ${
                            isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {groupColorsCount} قطع
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[10px] text-white/80 font-bold">
                            {isColorDrawerOpen ? '▲' : '▼'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* عند اختيار مجموعة: أظهر سعر الفردي والعلبة مع زر إلغاء صريح */}
                {activeSizeGroup && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex flex-wrap gap-2 p-1 bg-slate-50 rounded-xl border border-slate-200 animate-fade-in">
                      {activeSizeGroup.unitPrice !== undefined && (
                        <button
                          type="button"
                          onClick={() => setSizeUnitType('unit')}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold font-arabic border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${
                            sizeUnitType === 'unit'
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
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
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold font-arabic border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${
                            sizeUnitType === 'box'
                              ? 'bg-blue-500 border-blue-500 text-white shadow-xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                          }`}
                        >
                          <span>📦 علبة / جملة</span>
                          <span className="text-[11px] font-numbers font-black opacity-90">{activeSizeGroup.boxPrice} ج.م</span>
                        </button>
                      )}
                    </div>
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

            {/* Colors Selector: طي وإخفاء الألوان مع بقاء الأرقام والأسعار محفوظة */}
            {colors.length > 0 && (
              <div className="mt-3 animate-fade-in" dir="rtl">
                {isColorDrawerOpen ? (
                  <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-right">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-700 font-arabic bg-amber/10 px-2.5 py-1 rounded-full border border-amber/20">
                        {selectedColors.length > 0
                          ? `إجمالي القطع المختارة: ${selectedColors.length}`
                          : 'حدد الكمية المطلوبة من كل لون'}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <span className="block text-xs font-extrabold text-ink font-arabic">تحديد الألوان:</span>
                        <button
                          type="button"
                          onClick={() => setIsColorDrawerOpen(false)}
                          className="text-[11px] text-slate-600 hover:text-ink font-bold font-arabic bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg shadow-xs transition-colors"
                        >
                          إخفاء الألوان 🔼
                        </button>
                      </div>
                    </div>

                    {/* أزرار التحكم في الألوان (+ / - / حذف) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {colors.map(color => {
                        const count = selectedColors.filter(c => c === color).length;
                        const isSelected = count > 0;
                        return (
                          <div
                            key={color}
                            className={`flex items-center justify-between p-2 rounded-xl border-2 transition-all ${
                              isSelected
                                ? 'bg-white border-amber shadow-xs'
                                : 'bg-white/80 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {/* اسم اللون وتصفيات */}
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-ink font-arabic">{color}</span>
                              {isSelected && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedColors(prev => prev.filter(c => c !== color))}
                                  className="text-[10px] text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-1.5 py-0.5 rounded-md font-arabic font-bold transition-colors"
                                  title="حذف هذا اللون بالكامل"
                                >
                                  حذف
                                </button>
                              )}
                            </div>

                            {/* عداد + و - */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={count === 0}
                                onClick={() => {
                                  setSelectedColors(prev => {
                                    const idx = [...prev].lastIndexOf(color);
                                    if (idx === -1) return prev;
                                    const next = [...prev];
                                    next.splice(idx, 1);
                                    return next;
                                  });
                                }}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                                  count > 0
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95'
                                    : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                }`}
                              >
                                -
                              </button>

                              <span className={`w-7 text-center font-black text-xs font-numbers ${
                                count > 0 ? 'text-amber-600' : 'text-slate-400'
                              }`}>
                                {count}
                              </span>

                              <button
                                type="button"
                                onClick={() => setSelectedColors(prev => [...prev, color])}
                                className="w-7 h-7 rounded-lg bg-amber hover:bg-amber-deep text-white font-bold text-xs flex items-center justify-center shadow-xs active:scale-95 transition-all"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* زر تصفير الكل */}
                    {selectedColors.length > 0 && (
                      <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200 text-xs">
                        <button
                          type="button"
                          onClick={() => setSelectedColors([])}
                          className="text-[11px] text-red-600 hover:text-red-700 font-bold font-arabic flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <span>🗑️ تصفير كل الألوان</span>
                        </button>
                        <span className="text-[10px] text-slate-400 font-arabic">
                          إجمالي العدد: <strong className="text-amber font-numbers text-xs">{selectedColors.length}</strong> قطعة
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* الشريط المصغر عند الإغلاق: خفيف ومحفوظ بدون ظهور الشبكة الأكبر */
                  <div className="flex items-center justify-between p-2.5 bg-amber/10 border border-amber/30 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-900 font-arabic">
                        {selectedColors.length > 0
                          ? `🎨 تم اختيار (${selectedColors.length}) قطعة بألوان مخصصة`
                          : '🎨 تخصيص وألوان المنتج (اختياري)'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsColorDrawerOpen(true)}
                      className="text-xs font-bold text-amber-800 hover:text-amber-950 bg-white border border-amber/40 px-3 py-1 rounded-lg shadow-xs hover:bg-amber-50 transition-all font-arabic"
                    >
                      {selectedColors.length > 0 ? 'تعديل الألوان ✏️' : 'تحديد الألوان 🎨'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-3 border-t border-paper-line">
            {/* Unit Selector: فقط لو ما فيش مقاسات وفيه سعر علبة */}
            {sizeGroups.length === 0 && product.price_box && (
              <div className="space-y-1.5">
                <span className="block text-xs font-bold text-ink-soft">طريقة الشراء:</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setUnitType('piece')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
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
                    className={`py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
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
            <div className="flex flex-col md:flex-row items-center gap-3 w-full">
              
              {/* Qty Counter — مخفي لو في ألوان (الألوان تتحكم في الكمية) */}
              {colors.length === 0 && (
                <div className="flex items-center bg-slate-50 border border-paper-line rounded-cta p-1 shrink-0 w-full md:w-auto justify-between">
                  <button
                    type="button"
                    onClick={() => setManualQty(Math.max(1, manualQty - 1))}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-ink border border-paper-line hover:bg-paper-dark active:scale-95 transition-all"
                    aria-label="تقليل الكمية"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center font-bold text-base font-numbers text-ink">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setManualQty(manualQty + 1)}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-ink border border-paper-line hover:bg-paper-dark active:scale-95 transition-all"
                    aria-label="زيادة الكمية"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              )}
              {colors.length > 0 && (
                <div className="text-center px-3 py-1 bg-amber/10 border border-amber/30 rounded-cta shrink-0 flex items-center gap-2">
                  <span className="text-[11px] font-bold text-amber font-arabic">الكمية:</span>
                  <span className="text-lg font-black text-amber font-numbers">{quantity}</span>
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="w-full">
                {boxId ? (
                  <button
                    type="button"
                    onClick={handleAddToBox}
                    disabled={added}
                    className={`w-full py-2.5 px-4 rounded-cta font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-300 border-2 ${
                      added
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                        : 'bg-amber border-amber text-white shadow-md shadow-amber/20 hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {added ? (
                      <>
                        <Check size={16} />
                        <span>تمت الإضافة للباقة!</span>
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        <span>إضافة للباقة المدرسية</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 w-full">
                    {/* Buy Now (Primary CTA) */}
                    <button
                      type="button"
                      onClick={handleBuyNow}
                      className="w-full py-2.5 px-4 rounded-cta font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 bg-amber hover:bg-amber-deep text-white shadow-md shadow-amber/20 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200"
                    >
                      <span>شراء الآن</span>
                    </button>

                    {/* Add to Cart (Secondary CTA) */}
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={added}
                      className={`w-full py-2.5 px-4 rounded-cta font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-300 border-2 ${
                        added
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                          : 'border-ink-soft text-ink-soft bg-transparent hover:bg-ink-soft/5 active:scale-[0.98]'
                      }`}
                    >
                      {added ? (
                        <>
                          <Check size={16} />
                          <span>تمت الإضافة!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={16} />
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
