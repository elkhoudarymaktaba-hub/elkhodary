'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Minus, RefreshCw, Trash2, ShoppingCart, Check, X, ShieldAlert } from 'lucide-react';
import BoxVisualPreview from '@/components/store/box-visual-preview';
import { useCartStore } from '@/lib/store/cart';
import { trackClientEvent } from '@/lib/tracking';
import { supabase } from '@/lib/supabase';
import { getMockData } from '@/lib/mockData';

interface Box {
  id: string;
  name: string;
  stage: string;
  base_price: number;
  image?: string;
  description?: string;
  items: Array<{ product_id: string; qty: number }>;
}

interface Product {
  id: string;
  name: string;
  price_unit: number;
  images: string[];
  category_id: string;
  categories?: { id: string; name: string } | null;
}

interface BoxDetailClientProps {
  box: Box;
  initialProducts: Product[];
  allAlternatives: Product[];
}

const getStageLabel = (stage: string) => {
  switch (stage.toLowerCase()) {
    case 'kg': return 'رياض الأطفال';
    case 'primary': return 'المرحلة الابتدائية';
    case 'middle': return 'المرحلة الإعدادية';
    case 'high': return 'المرحلة الثانوية';
    default: return stage;
  }
};

export default function BoxDetailClient({ box, initialProducts, allAlternatives }: BoxDetailClientProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);

  const [customItems, setCustomItems] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`kh_custom_box_${box.id}`);
      if (saved) {
        try {
          setCustomItems(JSON.parse(saved));
          return;
        } catch (e) {
          console.error(e);
        }
      }
    }

    let cachedCats: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('kh_categories');
        if (local) cachedCats = JSON.parse(local);
      } catch (e) {
        console.error(e);
      }
    }

    const boxItems = box.products || box.items || [];
    const mapped = boxItems.map((bItem: any) => {
      const prod = initialProducts.find((p) => p.id === bItem.product_id);
      const cat = cachedCats.find((c) => c.id === prod?.category_id);
      return {
        productId: bItem.product_id,
        name: prod?.name || 'منتج غير معروف',
        qty: bItem.quantity || bItem.qty || 1,
        price: prod?.price_unit || 0,
        image: prod?.images?.[0] || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=150&q=80',
        categoryId: prod?.category_id || '',
        categoryName: cat ? cat.name : (prod?.categories?.name || 'أدوات مدرسية'),
      };
    });
    setCustomItems(mapped);
  }, [box, initialProducts]);

  useEffect(() => {
    if (customItems.length > 0) {
      localStorage.setItem(`kh_custom_box_${box.id}`, JSON.stringify(customItems));
    }
  }, [customItems, box.id]);

  const [swapTargetId, setSwapTargetId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Lock scroll when Swap Modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  useEffect(() => {
    trackClientEvent('ViewContent', {
      id: box.id,
      name: box.name,
      value: box.base_price,
      type: 'box',
    });
  }, [box]);

  const totalPrice = useMemo(() => {
    return customItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [customItems]);

  const totalItemsCount = useMemo(() => {
    return customItems.reduce((sum, item) => sum + item.qty, 0);
  }, [customItems]);

  const handleUpdateQty = (productId: string, delta: number) => {
    setCustomItems((items) =>
      items.map((item) => {
        if (item.productId === productId) {
          return { ...item, qty: Math.max(1, item.qty + delta) };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCustomItems((items) => items.filter((item) => item.productId !== productId));
  };

  const handleOpenSwap = (productId: string) => {
    setSwapTargetId(productId);
    setIsModalOpen(true);
  };

  const swapTargetItem = useMemo(() => {
    return customItems.find((item) => item.productId === swapTargetId);
  }, [customItems, swapTargetId]);

  const swapAlternatives = useMemo(() => {
    if (!swapTargetItem) return [];
    return allAlternatives.filter(
      (alt) => alt.category_id === swapTargetItem.categoryId && alt.id !== swapTargetItem.productId
    );
  }, [allAlternatives, swapTargetItem]);

  const handlePerformSwap = (newProduct: Product) => {
    if (!swapTargetId) return;

    setCustomItems((items) =>
      items.map((item) => {
        if (item.productId === swapTargetId) {
          return {
            productId: newProduct.id,
            name: newProduct.name,
            qty: 1,
            price: newProduct.price_unit,
            image: newProduct.images?.[0] || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=150&q=80',
            categoryId: newProduct.category_id,
            categoryName: newProduct.categories?.name || item.categoryName,
          };
        }
        return item;
      })
    );

    setIsModalOpen(false);
    setSwapTargetId(null);
  };

  const handleAddBoxToCart = () => {
    const boxMainImage = box.image || customItems[0]?.image || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80';
    
    addItem({
      type: 'box',
      boxId: box.id,
      name: `باقة: ${box.name} (مخصصة)`,
      price: totalPrice,
      qty: 1,
      image: boxMainImage,
      stage: box.stage,
      customItems: customItems.map((item) => {
        return {
          productId: item.productId,
          name: item.name,
          qty: item.qty,
          price: item.price,
          image: item.image,
          category: item.categoryName
        };
      })
    });

    trackClientEvent('AddToCart', {
      id: box.id,
      name: `باقة: ${box.name} (مخصصة)`,
      value: totalPrice,
      qty: 1,
    });

    if (typeof window !== 'undefined') {
      localStorage.removeItem(`kh_custom_box_${box.id}`);
    }

    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      router.push('/cart');
    }, 1500);
  };

  return (
    <div className="space-y-8 pt-28">
      {/* 2-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* RIGHT COLUMN: Customization Controls */}
        <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
          <div className="bg-white rounded-card shadow-card border border-paper-line p-6">
            <h2 className="font-extrabold text-xl text-ink mb-1.5">مكونات الباقة المدرسية</h2>
            <p className="text-ink-soft/50 text-xs mb-6">يمكنك زيادة الكميات، حذف القطع غير المطلوبة، أو استبدالها ببدائل مناسبة من نفس التصنيف.</p>
            
            {customItems.length > 0 ? (
              <>
                <div className="divide-y divide-paper-dark/60">
                  {customItems.map((item) => (
                    <div key={item.productId} className="py-4.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      
                      {/* Item Thumbnail */}
                      <div className="relative w-16 h-16 bg-paper rounded-xl overflow-hidden shrink-0 border border-paper-line">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-contain p-1.5"
                        />
                      </div>

                      {/* Item Info details */}
                      <div className="flex-grow">
                        <h4 className="font-bold text-sm text-ink line-clamp-1">{item.name}</h4>
                        <div className="flex items-center gap-2.5 mt-1.5">
                          <span className="text-[10px] bg-sage/10 text-sage-deep font-bold px-2 py-0.5 rounded-full border border-sage/10">
                            {item.categoryName}
                          </span>
                          <span className="text-xs text-ink-soft/50 font-numbers font-bold">
                            {item.price} ج.م للقطعة
                          </span>
                        </div>
                      </div>

                      {/* Controls Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        
                        {/* Qty Counter */}
                        <div className="flex items-center bg-paper rounded-full p-1 border border-paper-line">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.productId, -1)}
                            className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-ink border border-paper-line hover:bg-paper-dark transition-colors active:scale-95 shadow-sm"
                            aria-label="تقليل"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center font-bold text-sm font-numbers text-ink">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.productId, 1)}
                            className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-ink border border-paper-line hover:bg-paper-dark transition-colors active:scale-95 shadow-sm"
                            aria-label="زيادة"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Swap Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenSwap(item.productId)}
                          className="p-2 bg-white text-sage hover:bg-paper border border-paper-line rounded-full transition-colors hover:text-sage-deep active:scale-95 shadow-sm"
                          title="استبدال بمنتج آخر"
                        >
                          <RefreshCw size={12} />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productId)}
                          className="p-2 bg-white text-rose-500 hover:bg-rose-50 border border-paper-line hover:border-rose-100 rounded-full transition-colors active:scale-95 shadow-sm"
                          title="حذف من الباقة"
                        >
                          <Trash2 size={12} />
                        </button>

                      </div>

                    </div>
                  ))}
                </div>
                
                {/* Add other products button */}
                <div className="mt-4 pt-4 border-t border-dashed border-paper-line flex justify-center">
                  <button
                    type="button"
                    onClick={() => router.push(`/boxes/${box.id}/add-products`)}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border-2 border-amber text-amber hover:bg-amber/5 active:scale-95 transition-all shadow-sm"
                  >
                    <Plus size={14} className="text-amber" />
                    <span>إضافة منتجات أخرى للباقة</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <ShieldAlert size={36} className="mx-auto text-ink-soft/30 mb-2" />
                <p className="text-ink-soft/50 text-xs font-arabic">الباقة فارغة تماماً. قم بإضافة بعض المنتجات.</p>
                <button
                  type="button"
                  onClick={() => router.push(`/boxes/${box.id}/add-products`)}
                  className="mt-3 py-1.5 px-4 rounded-lg bg-amber hover:bg-amber-deep text-white font-bold text-xs transition-all"
                >
                  تصفح وإضافة منتجات
                </button>
              </div>
            )}
          </div>
        </div>

        {/* LEFT COLUMN: Visual Box & Summary Card */}
        <div className="lg:col-span-5 space-y-6 order-1 lg:order-2 lg:sticky lg:top-28">
          <BoxVisualPreview 
            items={customItems} 
            boxName={box.name} 
            stageName={getStageLabel(box.stage)} 
          />

          {/* Checkout Card */}
          <div className="bg-white rounded-card shadow-card border border-paper-line p-6 space-y-4">
            <h3 className="font-extrabold text-ink text-sm">ملخص طلب الباقة المخصصة</h3>
            
            <div className="space-y-2.5 pt-3 border-t border-dashed border-paper-line">
              <div className="flex items-center justify-between text-xs text-ink-soft/60 font-bold">
                <span>عدد المنتجات المشمولة:</span>
                <span className="font-numbers text-ink">{customItems.length} منتجات</span>
              </div>
              <div className="flex items-center justify-between text-xs text-ink-soft/60 font-bold">
                <span>إجمالي عدد قطع الباقة:</span>
                <span className="font-numbers text-ink">{totalItemsCount} قطعة</span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold text-ink pt-3 border-t border-paper-line">
                <span>سعر الباقة الإجمالي:</span>
                <span className="text-amber font-black font-numbers text-lg">
                  {totalPrice.toFixed(2)} <span className="text-xs font-cairo font-normal text-ink-soft">ج.م</span>
                </span>
              </div>
            </div>

            {/* Add to Cart button */}
            <button
              onClick={handleAddBoxToCart}
              disabled={added || customItems.length === 0}
              className={`w-full py-3.5 px-6 rounded-cta font-bold text-sm flex items-center justify-center gap-3 transition-all duration-300 ${
                added
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber hover:bg-amber-deep text-white shadow-glow'
              }`}
            >
              {added ? (
                <>
                  <Check size={18} />
                  <span>تم تجهيز وإضافة الباقة!</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={18} className="text-amber" />
                  <span>أضف الباقة المخصصة للسلة</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {isModalOpen && swapTargetItem && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-card shadow-brand border border-paper-line w-full max-w-lg overflow-hidden animate-fade-in-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-paper-line flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-ink text-sm">استبدال بمنتج بديل</h3>
                <p className="text-[10px] text-ink-soft/50 font-bold">اختر بديلاً مناسباً للمنتج: <strong className="text-coral">{swapTargetItem.name}</strong></p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-paper text-ink-soft/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 max-h-[350px] overflow-y-auto space-y-4 no-scrollbar">
              {swapAlternatives.length > 0 ? (
                <div className="space-y-3">
                  {swapAlternatives.map((alt) => (
                    <div 
                      key={alt.id}
                      className="p-3 border border-paper-line hover:border-amber/55 hover:bg-paper rounded-xl flex items-center justify-between gap-4 transition-all duration-200"
                    >
                      <div className="relative w-12 h-12 bg-paper rounded-lg overflow-hidden shrink-0 border border-paper-line">
                        <Image
                          src={alt.images?.[0] || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=100&q=80'}
                          alt={alt.name}
                          fill
                          sizes="48px"
                          className="object-contain p-1"
                        />
                      </div>
                      
                      <div className="flex-grow min-w-0">
                        <h5 className="font-bold text-xs text-ink truncate">{alt.name}</h5>
                        <span className="text-[10px] text-coral-deep font-extrabold font-numbers mt-0.5 block">{alt.price_unit} ج.م</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePerformSwap(alt)}
                        className="py-1.5 px-4 bg-ink hover:bg-ink-soft text-white font-bold text-[10px] rounded-full transition-all shrink-0"
                      >
                        اختيار البديل
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-ink-soft/50 text-xs font-bold">لا تتوفر حالياً بدائل من نفس التصنيف ({swapTargetItem.categoryName}) في المتجر.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-paper-dark/40 border-t border-paper-line flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="py-2 px-6 bg-white hover:bg-paper text-ink-soft/85 border border-paper-line font-bold text-xs rounded-cta transition-colors"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
