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
  const colors = colorsMatch && colorsMatch[1]
    ? colorsMatch[1].split(',').map((c: string) => c.trim()).filter(Boolean)
    : [];
  const cleanDescription = desc.replace(/\[COLORS\]:\s*(.+)$/m, '').trim();

  const [activeImage, setActiveImage] = useState(images[0]);
  const [unitType, setUnitType] = useState<'piece' | 'box'>('piece');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [resolvedCategory, setResolvedCategory] = useState(product.categories?.name || 'أدوات مدرسية');
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Handle unit price selection
  const currentPrice = unitType === 'piece'
    ? product.price_unit
    : (product.price_box || product.price_unit);

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
    addItem({
      type: 'product',
      productId: product.id,
      name: product.name,
      price: currentPrice,
      qty: quantity,
      image: images[0],
      unitType: unitType,
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

  useEffect(() => {
    if (colors.length > 0) {
      setSelectedColors(prev => {
        const next = [...prev];
        if (next.length < quantity) {
          while (next.length < quantity) {
            next.push(colors[0] || '');
          }
        } else if (next.length > quantity) {
          next.length = quantity;
        }
        return next;
      });
    }
  }, [quantity, colors]);

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
    addItem({
      type: 'product',
      productId: product.id,
      name: product.name,
      price: currentPrice,
      qty: quantity,
      image: images[0],
      unitType: unitType,
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
                <span className="text-brand-text/50 text-xs font-bold">سعر القطعة الفردية:</span>
                <span className="text-primary font-black text-2xl font-numbers">
                  {product.price_unit} <span className="text-sm font-cairo font-semibold">ج.م</span>
                </span>
              </div>

              {product.price_box && (
                <div className="flex items-baseline justify-between pt-2 border-t border-brand-border/50">
                  <span className="text-brand-text/50 text-xs font-bold flex items-center gap-1.5">
                    <Box size={14} className="text-secondary" /> سعر العلبة الكاملة:
                  </span>
                  <span className="text-secondary font-black text-xl font-numbers">
                    {product.price_box} <span className="text-sm font-cairo font-semibold">ج.م</span>
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {cleanDescription && (
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-brand-text font-arabic">وصف المنتج:</h3>
                <p className="text-brand-text/70 text-sm leading-relaxed font-arabic">
                  {cleanDescription}
                </p>
              </div>
            )}

            {/* Colors Selector Widget */}
            {colors.length > 0 && (
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-right mt-4 animate-fade-in" dir="rtl">
                <span className="block text-xs font-bold text-ink-soft font-arabic">
                  تحديد الألوان المطلوبة للكمية ({quantity} قطع/علب):
                </span>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {Array.from({ length: quantity }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 text-xs border-b border-dashed border-slate-200/60 pb-2 last:border-0 last:pb-0">
                      <span className="text-slate-500 font-arabic font-medium">القطعة/العلبة رقم {i + 1}:</span>
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {colors.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              setSelectedColors(prev => {
                                const updated = [...prev];
                                updated[i] = color;
                                return updated;
                              });
                            }}
                            className={`px-3 py-1 rounded-full border text-xs font-bold font-arabic transition-all ${
                              selectedColors[i] === color
                                ? 'bg-amber border-amber text-white shadow-sm animate-pulse-subtle'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6 pt-6 border-t border-paper-line">
            {/* Unit Selector (if box price exists) */}
            {product.price_box && (
              <div className="space-y-2">
                <span className="block text-xs font-bold text-ink-soft">طريقة الشراء المعتمدة:</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setUnitType('piece'); setQuantity(1); }}
                    className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center gap-1 ${
                      unitType === 'piece'
                        ? 'bg-amber border-amber text-white shadow-sm font-black'
                        : 'bg-white border-paper-line text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span>شراء بالقطعة</span>
                    <span className="text-[10px] opacity-75 font-numbers">({product.price_unit} ج.م)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setUnitType('box'); setQuantity(1); }}
                    className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center gap-1 ${
                      unitType === 'box'
                        ? 'border-2 border-ink-soft text-ink-soft bg-white shadow-sm font-black'
                        : 'bg-white border-paper-line text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span>شراء بالعلبة</span>
                    <span className="text-[10px] opacity-75 font-numbers">({product.price_box} ... خصم خاص)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Qty Selector & Action buttons */}
            <div className="flex flex-col md:flex-row items-center gap-4 w-full">
              
              {/* Qty Counter */}
              <div className="flex items-center bg-slate-50 border border-paper-line rounded-cta p-1.5 shrink-0 w-full md:w-auto justify-between">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
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
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-ink border border-paper-line hover:bg-paper-dark active:scale-95 transition-all"
                  aria-label="زيادة الكمية"
                >
                  <Plus size={16} />
                </button>
              </div>

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

      {/* 📝 Reviews & Ratings Section */}
      <div className="bg-white rounded-card shadow-brand border border-brand-border p-6 md:p-10 text-right space-y-8 animate-fade-in" dir="rtl">
        <div className="border-r-4 border-amber pr-3">
          <h2 className="text-xl font-bold text-ink font-arabic">تقييمات وآراء العملاء</h2>
          <p className="text-xs text-slate-500 font-arabic mt-1">تجارب حقيقية لعملائنا بعد تجربة هذا المنتج</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Summary Column */}
          <div className="lg:col-span-4 bg-slate-50/60 p-6 rounded-[20px] border border-slate-100/80 flex flex-col items-center justify-center text-center space-y-4">
            <span className="text-sm font-bold text-ink-soft font-arabic">التقييم العام</span>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-black text-ink font-numbers leading-none">
                {reviews.length > 0 
                  ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
                  : '5.0'}
              </span>
              <span className="text-[10px] text-slate-400 font-bold mt-1.5 font-numbers">من 5 نقاط</span>
            </div>
            
            {/* Stars */}
            <div className="flex gap-1 justify-center">
              {Array.from({ length: 5 }).map((_, idx) => {
                const avgRating = reviews.length > 0 
                  ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
                  : 5;
                return (
                  <svg 
                    key={idx} 
                    className={`w-5 h-5 ${idx < Math.round(avgRating) ? 'text-amber fill-amber' : 'text-slate-200'}`} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                );
              })}
            </div>
            
            <span className="text-xs text-slate-400 font-arabic font-medium">({reviews.length} تقييم مضاف)</span>
          </div>

          {/* List of reviews */}
          <div className="lg:col-span-8 space-y-5 max-h-[380px] overflow-y-auto pr-2 no-scrollbar">
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="p-4 bg-white rounded-xl border border-paper-line space-y-2.5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-ink font-arabic">{r.customer_name}</span>
                        {r.is_verified && (
                          <span className="inline-flex items-center gap-1 text-[8px] bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded-full border border-emerald-100 font-arabic">
                            ✓ مشتري مؤكد
                          </span>
                        )}
                      </div>
                      
                      <span className="text-[10px] text-slate-400 font-numbers font-medium">
                        {new Date(r.created_at).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                      </span>
                    </div>

                    {/* Review Stars */}
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <svg 
                          key={idx} 
                          className={`w-3.5 h-3.5 ${idx < r.rating ? 'text-amber fill-amber' : 'text-slate-200'}`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    <p className="text-xs text-slate-600 font-arabic leading-relaxed">{r.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400 font-arabic text-xs">لا توجد تقييمات بعد. كن أول من يضيف تقييماً!</p>
              </div>
            )}
          </div>

        </div>

        {/* Add Review Form */}
        <form onSubmit={handleSubmitReview} className="border-t border-dashed border-paper-line pt-6 space-y-4">
          <h4 className="font-extrabold text-sm text-ink font-arabic">أضف تقييمك للمنتج</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 font-arabic">الاسم الكريم:</label>
              <input
                type="text"
                required
                value={newReviewName}
                onChange={(e) => setNewReviewName(e.target.value)}
                placeholder="مثال: محمد علي"
                className="w-full px-3.5 py-2 border border-[#E7DCC2] rounded-xl text-xs font-arabic bg-white text-right focus:outline-none focus:border-amber"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 font-arabic">درجة التقييم:</label>
              <div className="flex gap-1.5 items-center h-[38px] justify-end" dir="ltr">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const val = idx + 1;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewReviewRating(val)}
                      className="p-0.5 text-slate-300 hover:scale-110 active:scale-95 transition-all"
                    >
                      <svg 
                        className={`w-6 h-6 ${val <= newReviewRating ? 'text-amber fill-amber' : 'text-slate-200'}`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 font-arabic">رأيك بالتفصيل:</label>
            <textarea
              required
              rows={3}
              value={newReviewText}
              onChange={(e) => setNewReviewText(e.target.value)}
              placeholder="اكتب رأيك الصادق في المنتج وتجربتك معه..."
              className="w-full p-3.5 border border-[#E7DCC2] rounded-xl text-xs font-arabic bg-white text-right focus:outline-none focus:border-amber resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingReview}
              className="px-6 py-2.5 bg-amber hover:bg-amber-deep text-white font-bold text-xs rounded-xl shadow-md shadow-amber/15 transition-all"
            >
              {submittingReview ? 'جاري الإرسال...' : 'إرسال التقييم'}
            </button>
          </div>
        </form>

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
