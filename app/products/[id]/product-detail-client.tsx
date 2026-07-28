'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingCart, Check, Plus, Minus, ShieldCheck, Box, ArrowRight, Star, Zap } from 'lucide-react';
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
  // selectedSizeGroup: اسم المجموعة المختارة من sizeGroups (تلقائياً أول مقاس إذا وجد)
  const [selectedSizeGroup, setSelectedSizeGroup] = useState<string | null>(() => {
    return sizeGroups.length > 0 ? sizeGroups[0].name : null;
  });
  // sizeUnitType: هل المستخدم اختار فردي أم علبة داخل المقاس؟
  const [sizeUnitType, setSizeUnitType] = useState<'unit' | 'box'>('unit');
  
  // ---- 🎨 تخزين ألوان كل مقاس ونوع شراء (فردي / علبة) بشكل منفصل ومستقل ----
  const activeSizeKey = (() => {
    if (selectedSizeGroup === null) {
      return unitType === 'box' ? '__base___box' : '__base___unit';
    }
    return sizeUnitType === 'box' ? `${selectedSizeGroup}_box` : `${selectedSizeGroup}_unit`;
  })();

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

  // quantity: إذا فيه ألوان، الكمية = عدد الألوان المختارة؛ وإلا يدوي
  const [manualQty, setManualQty] = useState(1);
  const quantity = colors.length > 0 ? selectedColors.length : manualQty;
  const [added, setAdded] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
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
      if (sizeUnitType === 'box' && activeSizeGroup.boxPrice !== undefined) return activeSizeGroup.boxPrice;
      if (sizeUnitType === 'unit' && activeSizeGroup.unitPrice !== undefined) return activeSizeGroup.unitPrice;
      return activeSizeGroup.unitPrice ?? activeSizeGroup.boxPrice ?? product.price_unit;
    }
    return unitType === 'piece' ? product.price_unit : (product.price_box || product.price_unit);
  })();

  // ---- 🛒 كارد ملخص الطلبات والمقاسات المباشر (Live Itemized Order Summary) ----
  const activeOrderItems = (() => {
    const items: {
      key: string;
      name: string;
      unitPrice: number;
      colors: string[];
      qty: number;
      total: number;
      unitType: 'piece' | 'box' | 'unit';
    }[] = [];

    // 1. فحص المنتج الأساسي (فردي)
    const baseUnitColors = sizeColorsMap['__base___unit'] || [];
    if (baseUnitColors.length > 0) {
      items.push({
        key: '__base___unit',
        name: `${product.name} (فردي)`,
        unitPrice: product.price_unit,
        colors: baseUnitColors,
        qty: baseUnitColors.length,
        total: product.price_unit * baseUnitColors.length,
        unitType: 'piece',
      });
    }

    // 2. فحص المنتج الأساسي (علبة)
    const baseBoxColors = sizeColorsMap['__base___box'] || [];
    if (baseBoxColors.length > 0 && product.price_box) {
      items.push({
        key: '__base___box',
        name: `${product.name} (علبة)`,
        unitPrice: product.price_box,
        colors: baseBoxColors,
        qty: baseBoxColors.length,
        total: product.price_box * baseBoxColors.length,
        unitType: 'box',
      });
    }

    // 3. فحص المقاسات الخاصة (فردي وعلبة لكل مقاس)
    sizeGroups.forEach(group => {
      // فردي للمقاس
      const groupUnitColors = sizeColorsMap[`${group.name}_unit`] || [];
      if (groupUnitColors.length > 0 && group.unitPrice !== undefined) {
        items.push({
          key: `${group.name}_unit`,
          name: `${group.name} (فردي)`,
          unitPrice: group.unitPrice,
          colors: groupUnitColors,
          qty: groupUnitColors.length,
          total: group.unitPrice * groupUnitColors.length,
          unitType: 'unit',
        });
      }

      // علبة للمقاس
      const groupBoxColors = sizeColorsMap[`${group.name}_box`] || [];
      if (groupBoxColors.length > 0 && group.boxPrice !== undefined) {
        items.push({
          key: `${group.name}_box`,
          name: `${group.name} (علبة)`,
          unitPrice: group.boxPrice,
          colors: groupBoxColors,
          qty: groupBoxColors.length,
          total: group.boxPrice * groupBoxColors.length,
          unitType: 'box',
        });
      }
    });

    return items;
  })();

  // حساب الإجمالي المباشر: إذا وجد ملخص يتم حسابه، وإلا حسب السعر والكمية اليدوية للمنتج بدون خيارات ألوان
  const grandTotal = activeOrderItems.length > 0
    ? activeOrderItems.reduce((sum, item) => sum + item.total, 0)
    : (colors.length > 0 ? 0 : currentPrice * manualQty);

  // دالة تحضير الأصناف المضافة للسلة
  const getItemsToAdd = () => {
    if (activeOrderItems.length > 0) {
      return activeOrderItems.filter(i => i.qty > 0);
    }
    // إذا لم تكن هناك خيارات ألوان للمنتج أصلاً
    if (colors.length === 0 && manualQty > 0) {
      return [{
        key: activeSizeKey,
        name: activeSizeGroup ? activeSizeGroup.name : 'المقاس الأساسي',
        unitPrice: currentPrice,
        colors: [],
        qty: manualQty,
        total: currentPrice * manualQty,
      }];
    }
    return [];
  };

  const handleAddToBox = () => {
    if (!boxId || typeof window === 'undefined') return;

    const itemsToAdd = getItemsToAdd();
    if (itemsToAdd.length === 0) {
      setValidationError('برجاء تحديد الألوان والكميات المطلوبة أولاً');
      setTimeout(() => setValidationError(null), 3000);
      return;
    }
    setValidationError(null);

    const saved = localStorage.getItem(`kh_custom_box_${boxId}`);
    let items: any[] = [];
    if (saved) {
      try {
        items = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }

    let updatedItems = [...items];
    itemsToAdd.forEach(toAdd => {
      const existingIdx = updatedItems.findIndex((item) => item.productId === product.id && item.name === (toAdd.key === '__base__' ? product.name : `${product.name} (${toAdd.name})`));
      if (existingIdx >= 0) {
        updatedItems[existingIdx] = {
          ...updatedItems[existingIdx],
          qty: updatedItems[existingIdx].qty + toAdd.qty,
          colors: toAdd.colors.length > 0 ? [...(updatedItems[existingIdx].colors || []), ...toAdd.colors] : updatedItems[existingIdx].colors,
        };
      } else {
        updatedItems.push({
          productId: product.id,
          name: toAdd.key === '__base__' ? product.name : `${product.name} (${toAdd.name})`,
          qty: toAdd.qty,
          price: toAdd.unitPrice,
          image: images[0],
          categoryId: product.category_id || '',
          categoryName: resolvedCategory,
          colors: toAdd.colors.length > 0 ? toAdd.colors : undefined,
        });
      }
    });

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
    const itemsToAdd = getItemsToAdd();
    if (itemsToAdd.length === 0) {
      setValidationError('برجاء تحديد الألوان والكميات المطلوبة أولاً');
      setTimeout(() => setValidationError(null), 3000);
      return;
    }
    setValidationError(null);

    itemsToAdd.forEach(item => {
      const variantId = `${product.id}_${item.key}`;
      addItem({
        id: variantId,
        type: 'product',
        productId: product.id,
        name: `${product.name} (${item.name})`,
        price: item.unitPrice,
        qty: item.qty,
        image: images[0],
        unitType: item.unitType === 'piece' || item.unitType === 'unit' ? 'piece' : 'box',
        selectedSize: item.name,
        colors: item.colors.length > 0 ? item.colors : undefined,
      } as any);

      trackClientEvent('AddToCart', {
        id: product.id,
        name: product.name,
        value: item.unitPrice,
        qty: item.qty,
      });
    });

    router.push('/checkout');
  };

  const handleAdd = () => {
    const itemsToAdd = getItemsToAdd();
    if (itemsToAdd.length === 0) {
      setValidationError('برجاء تحديد الألوان والكميات المطلوبة أولاً');
      setTimeout(() => setValidationError(null), 3000);
      return;
    }
    setValidationError(null);

    itemsToAdd.forEach(item => {
      const variantId = `${product.id}_${item.key}`;
      addItem({
        id: variantId,
        type: 'product',
        productId: product.id,
        name: `${product.name} (${item.name})`,
        price: item.unitPrice,
        qty: item.qty,
        image: images[0],
        unitType: item.unitType === 'piece' || item.unitType === 'unit' ? 'piece' : 'box',
        selectedSize: item.name,
        colors: item.colors.length > 0 ? item.colors : undefined,
      } as any);

      trackClientEvent('AddToCart', {
        id: product.id,
        name: product.name,
        value: item.unitPrice,
        qty: item.qty,
      });
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
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 md:p-8 relative overflow-hidden">
      
      {/* 2-Column layout like reference design */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Right column: Image Gallery (Prominent like reference) */}
        <div className="lg:col-span-6 space-y-4 shrink-0">
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-slate-50 border border-slate-200/60 shadow-xs flex items-center justify-center p-3">
            <Image
              src={activeImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover rounded-2xl"
              priority
            />
          </div>

          {/* Thumbnails row (Exactly like reference design bottom thumbnails) */}
          {images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar justify-start">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(img)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 bg-slate-50 transition-all ${
                    activeImage === img ? 'border-amber ring-2 ring-amber/20 scale-[1.03]' : 'border-slate-200 hover:border-amber/50'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover p-0.5 rounded-lg"
                  />
                </button>
              ))}
            </div>
          )}

          {/* 📋 كارد ملخص الطلبات والمقاسات التفاعلي المباشر (في جهة اليسار بجانب كارت المنتج) */}
          {activeOrderItems.length > 0 && activeOrderItems.some(i => i.qty > 0) && (
            <div className="p-3.5 bg-[#FFFBF5] border-2 border-amber/30 rounded-2xl space-y-2.5 text-right animate-fade-in mt-4" dir="rtl">
              <div className="flex items-center justify-between border-b border-amber/20 pb-2">
                <span className="text-[11px] text-amber-800 font-bold font-arabic bg-amber/15 px-2.5 py-0.5 rounded-full border border-amber/20">
                  {activeOrderItems.filter(i => i.qty > 0).length} صنف مضاف
                </span>
                <span className="text-xs font-black text-ink font-arabic flex items-center gap-1">
                  📋 ملخص الأصناف المختارة:
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {activeOrderItems.filter(i => i.qty > 0).map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-amber/25 text-xs shadow-2xs transition-all hover:border-amber/40"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.key === '__base__') {
                            setSizeColorsMap(prev => ({ ...prev, '__base__': [] }));
                          } else {
                            setSizeColorsMap(prev => ({ ...prev, [item.key]: [] }));
                            if (selectedSizeGroup === item.key) setSelectedSizeGroup(null);
                          }
                        }}
                        className="text-[10px] text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg font-arabic font-bold transition-colors border border-red-100 shrink-0"
                        title="إزالة هذا الاختيار بالكامل"
                      >
                        إزالة 🗑️
                      </button>
                      <div className="text-right">
                        <span className="font-extrabold text-ink font-arabic block text-xs">
                          {product.name} ({item.name})
                        </span>
                        {item.colors.length > 0 && (
                          <span className="text-[10px] text-slate-500 font-arabic block mt-0.5">
                            الألوان: {Array.from(new Set(item.colors)).map(c => `${item.colors.filter(x => x === c).length} ${c}`).join('، ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-left font-numbers shrink-0">
                      <span className="font-black text-amber text-xs block">
                        {item.total.toFixed(2)} ج.م
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold block">
                        {item.qty} قطعة × {item.unitPrice} ج.م
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-amber/20 text-xs font-arabic">
                <span className="text-slate-600 font-bold">الإجمالي المباشر:</span>
                <span className="font-black text-amber text-sm font-numbers">
                  {grandTotal.toFixed(2)} ج.م
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Left column: Product Actions & Information */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            {/* Category tag */}
            <span className="inline-block bg-primary/10 text-primary text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-primary/10">
              {resolvedCategory}
            </span>

            <div className="flex items-baseline justify-between pt-1">
              <h1 className="text-xl sm:text-2xl font-black text-brand-text leading-snug">
                {product.name}
              </h1>
              <div className="text-left shrink-0">
                <span className="text-amber font-black text-2xl sm:text-3xl font-numbers">
                  {currentPrice} <span className="text-sm font-cairo font-semibold">ج.م</span>
                </span>
              </div>
            </div>

            {/* ---- Sizes / Variants Selector ---- */}
            {sizeGroups.length > 0 && (
              <div className="space-y-2.5 mt-3" dir="rtl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 font-arabic">
                    المقاسات والخيارات المتاحة:
                  </span>
                </div>

                {/* Chips الرئيسية (المقاس الأساسي + المقاسات الخاصة) */}
                <div className="flex flex-wrap gap-2.5">
                  {/* زر المقاس الأساسي (ياخذ اسم المنتج مباشرة) */}
                  {(() => {
                    const isBaseActive = selectedSizeGroup === null;
                    const baseColorsCount = (sizeColorsMap['__base___unit'] || []).length + (sizeColorsMap['__base___box'] || []).length;
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSizeGroup(null);
                          setIsColorDrawerOpen(true);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold font-arabic border-2 transition-all flex items-center gap-2 shadow-2xs ${
                          isBaseActive
                            ? 'bg-amber border-amber text-white shadow-sm scale-[1.02]'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-amber/50 hover:bg-amber-50/40'
                        }`}
                      >
                        <span>{product.name}</span>
                        <span className={`text-[11px] font-numbers font-black px-2 py-0.5 rounded-lg ${
                          isBaseActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {product.price_unit} ج.م
                        </span>
                        {baseColorsCount > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-numbers font-black ${
                            isBaseActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {baseColorsCount} قطع
                          </span>
                        )}
                      </button>
                    );
                  })()}

                  {/* أزرار المقاسات الخاصة */}
                  {sizeGroups.map(group => {
                    const isActive = selectedSizeGroup === group.name;
                    const groupColorsCount = (sizeColorsMap[group.name] || []).length;
                    const groupPrice = group.unitPrice ?? group.boxPrice ?? product.price_unit;
                    return (
                      <button
                        key={group.name}
                        type="button"
                        onClick={() => {
                          setSelectedSizeGroup(group.name);
                          setIsColorDrawerOpen(true);
                          if (group.unitPrice !== undefined) setSizeUnitType('unit');
                          else if (group.boxPrice !== undefined) setSizeUnitType('box');
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold font-arabic border-2 transition-all flex items-center gap-2 shadow-2xs ${
                          isActive
                            ? 'bg-amber border-amber text-white shadow-sm scale-[1.02]'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-amber/50 hover:bg-amber-50/40'
                        }`}
                      >
                        <span>{group.name}</span>
                        <span className={`text-[11px] font-numbers font-black px-2 py-0.5 rounded-lg ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {groupPrice} ج.م
                        </span>
                        {groupColorsCount > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-numbers font-black ${
                            isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {groupColorsCount} قطع
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* خيارات الشراء (فردي / علبة) للمقاس المحدد */}
                <div className="space-y-1.5 pt-1">
                  {selectedSizeGroup === null ? (
                    /* خيارات المقاس الأساسي */
                    <div className="flex flex-wrap gap-2 p-1 bg-slate-50 rounded-xl border border-slate-200 animate-fade-in">
                      <button
                        type="button"
                        onClick={() => setUnitType('piece')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold font-arabic border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${
                          unitType === 'piece'
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs font-black'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'
                        }`}
                      >
                        <span>🟢 فردي / قطعة</span>
                        <span className="text-[11px] font-numbers font-black opacity-90">{product.price_unit} ج.م</span>
                      </button>
                      {product.price_box && (
                        <button
                          type="button"
                          onClick={() => setUnitType('box')}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold font-arabic border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${
                            unitType === 'box'
                              ? 'bg-blue-500 border-blue-500 text-white shadow-xs font-black'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                          }`}
                        >
                          <span>📦 علبة / جملة</span>
                          <span className="text-[11px] font-numbers font-black opacity-90">{product.price_box} ج.م</span>
                        </button>
                      )}
                    </div>
                  ) : activeSizeGroup && (
                    /* خيارات المقاس الخاص المحدد */
                    <div className="flex flex-wrap gap-2 p-1 bg-slate-50 rounded-xl border border-slate-200 animate-fade-in">
                      {activeSizeGroup.unitPrice !== undefined && (
                        <button
                          type="button"
                          onClick={() => setSizeUnitType('unit')}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold font-arabic border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${
                            sizeUnitType === 'unit'
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs font-black'
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
                              ? 'bg-blue-500 border-blue-500 text-white shadow-xs font-black'
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

            {/* Colors Selector: ظاهرة مباشرة مع حفظ ألوان كل مقاس بشكل منفصل ومستقل */}
            {colors.length > 0 && (
              <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-right mt-3 animate-fade-in" dir="rtl">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-700 font-arabic bg-amber/10 px-2.5 py-1 rounded-full border border-amber/20">
                    {selectedColors.length > 0
                      ? `إجمالي القطع المختارة: ${selectedColors.length}`
                      : 'حدد الكمية المطلوبة من كل لون'}
                  </span>
                  <span className="block text-xs font-extrabold text-ink font-arabic">تحديد الألوان المطلوبة:</span>
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
                  <div className="flex flex-col gap-3 w-full">
                    {validationError && (
                      <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-extrabold font-arabic rounded-2xl text-center shadow-2xs animate-fade-in" dir="rtl">
                        ⚠️ {validationError}
                      </div>
                    )}
                    {/* Add to Cart (Clean Pill) */}
                    <div className="flex items-center gap-3">
                      {colors.length === 0 && (
                        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-full px-3 py-1.5 shrink-0 justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => setManualQty(Math.max(1, manualQty - 1))}
                            className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-slate-700 hover:bg-slate-200 active:scale-95 transition-all shadow-xs"
                            aria-label="تقليل الكمية"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="font-bold text-sm font-numbers text-slate-900">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setManualQty(manualQty + 1)}
                            className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-slate-700 hover:bg-slate-200 active:scale-95 transition-all shadow-xs"
                            aria-label="زيادة الكمية"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      )}
                      
                      <button
                        type="button"
                        onClick={handleAdd}
                        disabled={added}
                        className={`flex-1 py-3 px-6 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 border ${
                          added
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                            : 'bg-[#F5F0E8] border-[#E8DFC8] text-[#5C4A38] hover:bg-[#EAE0CD] active:scale-[0.98]'
                        }`}
                      >
                        {added ? (
                          <>
                            <Check size={16} />
                            <span>تمت الإضافة للسلة!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={16} />
                            <span>أضف للسلة</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Buy Now (Prominent Pill like reference button) */}
                    <button
                      type="button"
                      onClick={handleBuyNow}
                      className="w-full py-3.5 px-6 rounded-full font-black text-sm sm:text-base flex items-center justify-center gap-2 bg-[#C87D53] hover:bg-[#B56D45] text-white shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all duration-200"
                    >
                      <Zap size={18} className="fill-white" />
                      <span>شراء سريع (اطلب الآن) — {grandTotal.toFixed(2)} ج.م</span>
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Total calculation */}
            <div className="flex items-center justify-between text-xs text-ink-muted pt-2 font-numbers">
              <span>الإجمالي:</span>
              <span className="font-bold text-amber text-sm">
                {grandTotal.toFixed(2)} ج.م
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
