'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Tag, Check, X, Box } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';

export default function CartPage() {
  const router = useRouter();
  
  const {
    items,
    coupon,
    couponError,
    updateQty,
    removeItem,
    addItem,
    applyCoupon,
    removeCoupon,
    getSubtotal,
    getDiscount,
    getTotal,
  } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);
  const [detailModalGroup, setDetailModalGroup] = useState<any>(null);

  // دالة مساعدة لاستخراج اسم المنتج الأساسي بدون الأقواس
  const getBaseProductName = (name: string) => {
    return name.split(' (')[0].trim();
  };

  // دالة مساعدة لاستخراج اسم الخيار/المقاس داخل الأقواس
  const getOptionName = (name: string) => {
    const startIdx = name.indexOf('(');
    if (startIdx === -1) return '';
    return name.substring(startIdx + 1, name.length - 1).trim();
  };

  // تجميع السلة: تجميع عناصر المنتجات المتطابقة في كارد واحد
  const groupedItems = (() => {
    const groups: Record<string, {
      productId: string;
      baseProduct: any;
      subItems: any[];
      totalQty: number;
      totalPrice: number;
    }> = {};

    items.forEach(item => {
      const key = item.type === 'product' && item.productId ? item.productId : item.id;
      if (!groups[key]) {
        groups[key] = {
          productId: item.productId || item.id,
          baseProduct: item,
          subItems: [],
          totalQty: 0,
          totalPrice: 0
        };
      }
      groups[key].subItems.push(item);
      groups[key].totalQty += item.qty;
      groups[key].totalPrice += item.price * item.qty;
    });

    return Object.values(groups);
  })();

  // مزامنة المودال ليكون تفاعلياً وتحديث معلوماته تلقائياً عند تغيير الكمية
  const activeModalGroup = detailModalGroup
    ? groupedItems.find(g => g.productId === detailModalGroup.productId)
    : null;

  useEffect(() => {
    if (activeModalGroup) {
      document.body.style.overflow = 'hidden';
      if (typeof window !== 'undefined' && (window as any).lenis) {
        (window as any).lenis.stop();
      }
    } else {
      document.body.style.overflow = '';
      if (typeof window !== 'undefined' && (window as any).lenis) {
        (window as any).lenis.start();
      }
    }
    return () => {
      document.body.style.overflow = '';
      if (typeof window !== 'undefined' && (window as any).lenis) {
        (window as any).lenis.start();
      }
    };
  }, [activeModalGroup]);

  useEffect(() => {
    if (detailModalGroup && !activeModalGroup) {
      setDetailModalGroup(null);
    }
  }, [activeModalGroup, detailModalGroup]);

  useEffect(() => {
    setMounted(true);
    if (coupon) {
      setCouponCode(coupon.code);
      setCouponApplied(true);
    }
  }, [coupon]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('kh_products');
      if (stored) {
        const allProducts = JSON.parse(stored);
        // Filter cheap products under 100 EGP, excluding those already in the cart
        const cartProductIds = items.map(item => item.productId);
        const cheapAndActive = allProducts.filter((p: any) => 
          p.is_active && 
          p.price_unit <= 100 && 
          !cartProductIds.includes(p.id)
        );
        // Pick up to 4 cheap products
        setSuggestedProducts(cheapAndActive.slice(0, 4));
      }
    } catch (e) {
      console.error(e);
    }
  }, [items]);

  if (!mounted) {
    return (
      <div className="bg-paper-dark/50 min-h-screen py-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
      </div>
    );
  }

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setApplying(true);
    const success = await applyCoupon(couponCode);
    setApplying(false);

    if (success) {
      setCouponApplied(true);
    } else {
      setCouponApplied(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode('');
    setCouponApplied(false);
  };

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const total = getTotal();

  return (
    <div className="bg-paper-dark/30 min-h-screen py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="border-b border-dashed border-paper-line pb-4 mb-5">
          <h1 className="text-2xl sm:text-3xl font-black text-ink flex items-center gap-3">
            <ShoppingBag size={28} className="text-coral" />
            <span>سلة التسوق الخاصة بك</span>
          </h1>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* RIGHT COLUMN: Cart Items List */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-card shadow-card border border-paper-line p-6 space-y-6">
                {groupedItems.map((group) => {
                  const item = group.baseProduct;
                  const isGrouped = group.subItems.length > 1;
                  const displayName = isGrouped ? getBaseProductName(item.name) : item.name;

                  return (
                    <div 
                      key={group.productId}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-paper-line last:pb-0 last:border-b-0 cursor-pointer group/card"
                      onClick={() => setDetailModalGroup(group)}
                    >
                      {/* Item Details */}
                      <div className="flex items-center gap-4 flex-grow">
                        <div className="relative w-20 h-20 bg-paper rounded-xl overflow-hidden shrink-0 border border-paper-line group-hover/card:border-amber transition-colors">
                          <Image
                            src={item.image}
                            alt={displayName}
                            fill
                            sizes="80px"
                            className="object-contain p-1.5 transition-transform duration-200 group-hover/card:scale-105"
                          />
                        </div>
                        
                        <div className="text-right space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-extrabold text-sm sm:text-base text-ink leading-snug group-hover/card:text-amber transition-colors">
                              {displayName}
                            </h3>
                            {isGrouped && (
                              <span className="text-[10px] text-amber-800 bg-amber/10 font-bold px-2 py-0.5 rounded-full border border-amber/30 font-arabic">
                                👁️ {group.subItems.length} خيارات مختارة
                              </span>
                            )}
                          </div>
                          
                          {isGrouped ? (
                            <p className="text-[11px] text-slate-400 font-extrabold font-arabic leading-relaxed mt-1">
                              الخيارات المحددة: {group.subItems.map(sub => {
                                const opt = getOptionName(sub.name);
                                return `${opt || 'الأساسي'} (x${sub.qty})`;
                              }).join('، ')}
                            </p>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2 mt-1.5 font-bold">
                              {item.type === 'product' && (
                                <span className="text-[9px] bg-paper text-ink-soft/85 px-2 py-0.5 rounded-full border border-paper-line">
                                  {item.unitType === 'piece' ? 'شراء بالقطعة' : 'شراء بالعلبة'}
                                </span>
                              )}

                              {item.type === 'box' && (
                                <span className="text-[9px] bg-sage/10 text-sage-deep px-2 py-0.5 rounded-full border border-sage/10 flex items-center gap-1">
                                  <Box size={10} /> باقة مخصصة
                                </span>
                              )}

                              <span className="text-xs text-ink-soft/50 font-numbers font-bold">
                                سعر الوحدة: {item.price} ج.م
                              </span>
                            </div>
                          )}

                          {/* Colors List (only for single options) */}
                          {!isGrouped && (item as any).colors && (item as any).colors.length > 0 && (
                            <div className="flex flex-wrap gap-1 items-center mt-2">
                              <span className="text-[10px] text-slate-400 font-bold ml-1.5 font-arabic">الألوان:</span>
                              {(item as any).colors.map((c: string, idx: number) => (
                                <span key={idx} className="text-[9px] bg-amber/10 text-amber-deep font-bold px-2 py-0.5 rounded border border-amber/20 font-arabic">
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Customized box items list inside cart */}
                          {item.type === 'box' && item.customItems && (
                            <div className="mt-3 bg-paper rounded-xl border border-paper-line p-3 max-w-md">
                              <span className="block text-[10px] font-extrabold text-ink-soft/50 mb-1.5">محتويات الباقة المخصصة:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {item.customItems.map((cItem, cIdx) => (
                                  <span 
                                    key={cIdx} 
                                    className="text-[9px] bg-white text-ink-soft/80 px-2 py-0.5 rounded-md border border-paper-line font-numbers font-bold"
                                  >
                                    {cItem.name} (x{cItem.qty})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Qty and price controls */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-paper-line border-dashed">
                        
                        {/* Qty Counter */}
                        {!isGrouped ? (
                          <div className="flex items-center bg-paper rounded-full p-1 border border-paper-line" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, Math.max(1, item.qty - 1))}
                              className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-ink border border-paper-line hover:bg-paper-dark transition-colors active:scale-95 shadow-sm"
                              aria-label="تقليل"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center font-bold text-sm font-numbers text-ink">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, item.qty + 1)}
                              className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-ink border border-paper-line hover:bg-paper-dark transition-colors active:scale-95 shadow-sm"
                              aria-label="زيادة"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="text-right font-arabic text-xs font-bold text-slate-400">
                            <span>الكمية الإجمالية: </span>
                            <span className="font-numbers font-black text-slate-800 text-sm bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">{group.totalQty}</span>
                          </div>
                        )}

                        {/* Total Price */}
                        <div className="text-left font-numbers" style={{ minWidth: '90px' }}>
                          <span className="block text-[9px] text-ink-soft/40 font-cairo font-bold">الإجمالي</span>
                          <span className="text-coral-deep font-extrabold text-base">
                            {group.totalPrice.toFixed(2)} <span className="text-[10px] font-cairo font-normal text-ink-soft">ج.م</span>
                          </span>
                        </div>

                        {/* Remove / Edit Button */}
                        {!isGrouped ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(item.id);
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-full border border-transparent hover:border-rose-100 transition-colors"
                            title="إزالة من السلة"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailModalGroup(group);
                            }}
                            className="text-xs bg-amber/10 text-amber-deep font-bold px-3 py-1.5 rounded-xl border border-amber/30 hover:bg-amber hover:text-white transition-all font-arabic"
                          >
                            تعديل
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* SUGGESTED ITEMS CROSS-SELLING */}
              {suggestedProducts.length > 0 && (
                <div className="bg-white rounded-card shadow-card border border-paper-line p-6 space-y-4 animate-fade-in-up mt-6">
                  <h3 className="font-extrabold text-ink text-sm flex items-center gap-2 border-b border-paper-line pb-3">
                    <Plus size={16} className="text-[#1E90FF] animate-pulse" />
                    <span>مستلزمات دراسية هامة قد تحتاجها:</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {suggestedProducts.map((prod) => {
                      const prodImage = prod.images?.[0] || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=150&q=80';
                      return (
                        <div key={prod.id} className="flex items-center gap-3 p-3 bg-paper rounded-xl border border-paper-line hover:border-amber/40 transition-colors">
                          <div className="relative w-12 h-12 rounded-lg bg-white border border-paper-line overflow-hidden shrink-0">
                            <img src={prodImage} alt={prod.name} className="object-contain p-1 w-full h-full" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <h4 className="font-bold text-xs text-ink truncate">{prod.name}</h4>
                            <p className="text-[10px] text-slate-500 font-numbers font-black mt-0.5">{prod.price_unit} ج.م</p>
                          </div>
                          <button
                            onClick={() => {
                              addItem({
                                type: 'product',
                                productId: prod.id,
                                name: prod.name,
                                price: prod.price_unit,
                                qty: 1,
                                image: prodImage,
                                unitType: 'piece',
                              });
                            }}
                            className="btn-primary px-3 py-1.5 text-[10px] text-white font-bold shrink-0 shadow-sm"
                          >
                            أضف سريعا
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* LEFT COLUMN: Summary and Coupons */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Coupon validator */}
              <div className="bg-white rounded-card shadow-card border border-paper-line p-6">
                <h3 className="font-extrabold text-ink text-sm mb-4 flex items-center gap-2">
                  <Tag size={16} className="text-coral" />
                  <span>كوبون الخصم</span>
                </h3>
                
                <form onSubmit={handleApplyCoupon} className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="أدخل كود الخصم هنا..."
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={couponApplied}
                      className="w-full pl-4 pr-4 py-3 bg-paper rounded-input border border-paper-line focus:outline-none focus:border-amber text-sm font-bold uppercase tracking-wider text-center"
                    />
                    
                    {couponApplied && (
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-rose-500 bg-rose-50 p-1 rounded-full border border-rose-100 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {!couponApplied ? (
                    <button
                      type="submit"
                      disabled={applying || !couponCode.trim()}
                      className="w-full py-2.5 bg-ink hover:bg-ink-soft text-white font-bold text-xs rounded-cta transition-colors shadow-sm"
                    >
                      {applying ? 'جاري الفحص...' : 'تطبيق الكود'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl font-bold">
                      <Check size={14} />
                      <span>تم تطبيق كوبون الخصم بنجاح!</span>
                    </div>
                  )}

                  {couponError && (
                    <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-xl font-bold">
                      {couponError}
                    </p>
                  )}
                </form>
              </div>

              {/* Order Calculations */}
              <div className="bg-white rounded-card shadow-card border border-paper-line p-6 space-y-4">
                <h3 className="font-extrabold text-ink text-sm">ملخص الحساب</h3>
                
                <div className="space-y-3 pt-3 border-t border-dashed border-paper-line text-xs text-ink-soft/75 font-bold">
                  <div className="flex justify-between font-numbers">
                    <span>الإجمالي الجزئي:</span>
                    <span>{subtotal.toFixed(2)} ج.م</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>قيمة الخصم الكوبون:</span>
                      <span className="font-numbers">-{discount.toFixed(2)} ج.م</span>
                    </div>
                  )}

                  <div className="flex justify-between text-ink-soft/40 text-[10px] pt-1">
                    <span>مصاريف الشحن:</span>
                    <span>تُحسب في الصفحة التالية</span>
                  </div>

                  <div className="flex justify-between items-baseline pt-4 border-t border-paper-line text-ink text-sm font-bold">
                    <span>الإجمالي المستحق:</span>
                    <span className="text-coral-deep font-black font-numbers text-xl">
                      {total.toFixed(2)} <span className="text-xs font-cairo font-normal text-ink-soft">ج.م</span>
                    </span>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => router.push('/checkout')}
                    className="w-full py-4 bg-coral hover:bg-coral-deep text-white font-bold text-base rounded-cta text-center transition-all duration-300 shadow-glow hover:scale-103"
                  >
                    إإتمام الطلب والتوصيل
                  </button>
                </div>

                <div className="text-center pt-2">
                  <Link href="/products" className="text-xs text-ink-soft/60 hover:text-coral transition-colors font-bold flex items-center justify-center gap-1">
                    <ArrowLeft size={12} className="text-amber" />
                    <span>مواصلة التسوق وشراء المزيد</span>
                  </Link>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="bg-white rounded-card border border-paper-line p-16 text-center max-w-xl mx-auto shadow-card">
            <ShoppingBag size={48} className="mx-auto text-ink-soft/20 mb-6 animate-bounce" />
            <h3 className="font-extrabold text-lg text-ink mb-2">سلة التسوق الخاصة بك فارغة</h3>
            <p className="text-ink-soft/60 text-xs leading-relaxed mb-8 max-w-xs mx-auto font-medium">
              لم تقم بإضافة أي أدوات مدرسية أو باقات حتى الآن. تسوق الآن وابدأ عامك الدراسي بقوة!
            </p>
            <Link
              href="/products"
              className="px-8 py-3.5 bg-coral hover:bg-coral-deep text-white font-bold text-xs rounded-cta transition-colors inline-block shadow-glow"
            >
              الذهاب لمعرض المنتجات
            </Link>
          </div>
        )}

      </div>

      {activeModalGroup && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setDetailModalGroup(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200 space-y-5 text-right animate-scale-up"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setDetailModalGroup(null)}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors"
            >
              <X size={16} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="relative w-14 h-14 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-200">
                <Image
                  src={activeModalGroup.baseProduct.image}
                  alt={getBaseProductName(activeModalGroup.baseProduct.name)}
                  fill
                  sizes="64px"
                  className="object-contain p-1"
                />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                  {getBaseProductName(activeModalGroup.baseProduct.name)}
                </h3>
                <span className="text-[11px] font-bold text-amber font-arabic">
                  تفاصيل الخيارات والمقاسات المحددة
                </span>
              </div>
            </div>

            {/* Subitems List */}
            <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1 scrollbar-thin" data-lenis-prevent>
              {activeModalGroup.subItems.map((subItem) => {
                const isBox = subItem.type === 'box';
                return (
                  <div key={subItem.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="font-extrabold text-xs text-slate-800 block">
                          {getOptionName(subItem.name) || (isBox ? 'باقة مخصصة' : 'الخيار الافتراضي')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-numbers font-bold mt-1 block">
                          سعر الوحدة: {subItem.price} ج.م
                        </span>
                      </div>

                      {/* Quantity control inside modal */}
                      <div className="flex items-center border border-slate-200 rounded-lg bg-white p-1 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQty(subItem.id, Math.max(1, subItem.qty - 1))}
                          className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="w-6 text-center text-xs font-black font-numbers">{subItem.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(subItem.id, subItem.qty + 1)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Colors details if any */}
                    {subItem.colors && subItem.colors.length > 0 && (
                      <div className="flex flex-wrap gap-1 items-center bg-white p-2 rounded-lg border border-slate-200/60 text-[10px]">
                        <span className="text-slate-400 font-bold ml-1">الألوان المختارة:</span>
                        {Array.from(new Set(subItem.colors)).map((c: any, idx: number) => {
                          const count = subItem.colors.filter((x: any) => x === c).length;
                          return (
                            <span key={idx} className="bg-amber/10 text-amber-deep font-bold px-1.5 py-0.5 rounded border border-amber/20">
                              {c} ({count})
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Box customized items list */}
                    {isBox && subItem.customItems && (
                      <div className="mt-1 bg-white rounded-lg border border-slate-200/60 p-2 text-[10px] max-h-24 overflow-y-auto space-y-1">
                        {subItem.customItems.map((cItem: any, cIdx: number) => (
                          <div key={cIdx} className="flex justify-between text-slate-600 font-bold">
                            <span>{cItem.name}</span>
                            <span className="text-amber font-numbers">×{cItem.qty}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10px] border-t border-slate-200 pt-2 mt-1">
                      <span className="text-slate-500 font-bold">إجمالي هذا الخيار:</span>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-slate-800 font-numbers text-xs">{(subItem.price * subItem.qty).toFixed(2)} ج.م</span>
                        <button
                          type="button"
                          onClick={() => removeItem(subItem.id)}
                          className="text-rose-500 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                          title="حذف هذا الخيار"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Group Pricing */}
            <div className="flex justify-between items-center p-3 bg-amber/5 rounded-xl border border-amber/10 text-xs">
              <span className="font-extrabold text-slate-700">إجمالي المنتج لكافة الخيارات:</span>
              <span className="font-black text-amber text-sm font-numbers">{activeModalGroup.totalPrice.toFixed(2)} ج.م</span>
            </div>

            {/* Modal Actions */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setDetailModalGroup(null)}
                className="w-full py-3 bg-amber hover:bg-amber-deep text-white font-black text-xs rounded-xl shadow-md transition-all font-arabic"
              >
                إغلاق النافذة ✖
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
