'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/lib/store/cart';
import { supabase } from '@/lib/supabase';
import { trackClientEvent } from '@/lib/tracking';
import { CheckCircle2, ChevronRight, Truck, Info, AlertTriangle } from 'lucide-react';

interface ShippingZone {
  id: string;
  governorate_name: string;
  price: number;
  delivery_days: number;
  free_shipping_threshold: number | null;
}

interface CheckoutClientProps {
  shippingZones: ShippingZone[];
}

export default function CheckoutClient({ shippingZones }: CheckoutClientProps) {
  const router = useRouter();
  
  const {
    items,
    coupon,
    shippingCost,
    freeShippingThreshold,
    selectedGovernorate,
    setShippingInfo,
    clearCart,
    getSubtotal,
    getDiscount,
    getTotal,
  } = useCartStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<{ id: string; total: number } | null>(null);

  useEffect(() => {
    if (items.length > 0) {
      const subtotal = getSubtotal();
      const count = items.reduce((sum, item) => sum + item.qty, 0);
      trackClientEvent('InitiateCheckout', { value: subtotal, count });
    }
  }, [items]);

  useEffect(() => {
    if (selectedGovernorate) {
      setGovernorate(selectedGovernorate);
    }
  }, [selectedGovernorate]);

  const handleGovernorateChange = (govName: string) => {
    setGovernorate(govName);
    const zone = shippingZones.find((z) => z.governorate_name === govName);
    
    if (zone) {
      setShippingInfo(zone.governorate_name, zone.price, zone.free_shipping_threshold);
    } else {
      setShippingInfo('', 0, null);
    }
  };

  const subtotal = getSubtotal();
  const discount = getDiscount();

  const isFreeShipping = useMemo(() => {
    if (freeShippingThreshold === null || freeShippingThreshold === undefined) return false;
    return subtotal >= freeShippingThreshold;
  }, [subtotal, freeShippingThreshold]);

  const activeShippingCost = isFreeShipping ? 0 : shippingCost;
  const total = getTotal();

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError('يرجى إدخال الاسم بالكامل');
    if (!phone.trim()) return setError('يرجى إدخال رقم الهاتف');
    if (phone.trim().length < 11) return setError('رقم الهاتف يجب أن يكون 11 رقماً على الأقل');
    if (!governorate) return setError('يرجى تحديد المحافظة');
    if (!address.trim()) return setError('يرجى كتابة العنوان التفصيلي');

    setLoading(true);

    try {
      const orderItems = items.map((item) => ({
        id: item.id,
        type: item.type,
        name: item.name,
        price: item.price,
        qty: item.qty,
        image: item.image,
        unit_type: item.unitType || null,
        productId: item.productId || null,
        custom_items: item.customItems || null,
        colors: (item as any).colors || null,
      }));

      const { data, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: name.trim(),
          phone: phone.trim(),
          governorate: governorate,
          address: address.trim(),
          items: orderItems,
          subtotal: subtotal,
          shipping: activeShippingCost,
          discount: discount,
          total: total,
          coupon_code: coupon?.code || null,
          status: 'new',
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      const orderId = data.id;

      const trackingItems = items.map((item) => ({
        id: item.productId || item.boxId || item.id,
        name: item.name,
        qty: item.qty,
        price: item.price,
      }));

      trackClientEvent('Purchase', {
        orderId: orderId,
        value: total,
        items: trackingItems,
      });

      setSuccessOrder({ id: orderId, total: total });
      clearCart();
    } catch (err: any) {
      console.error('Error placing order:', err);
      setError('حدث خطأ أثناء تسجيل طلبك، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS SCREEN
  if (successOrder) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-card shadow-brand border border-paper-line p-8 md:p-12 text-center space-y-6 animate-fade-in-up">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto animate-pulse">
          <CheckCircle2 size={40} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-ink">تم تسجيل طلبك بنجاح!</h2>
          <p className="text-ink-soft/60 text-xs sm:text-sm font-numbers font-bold">
            رقم الطلب الخاص بك: <span className="font-bold text-coral-deep select-all">{successOrder.id}</span>
          </p>
        </div>

        <p className="text-ink-soft/75 text-sm leading-relaxed max-w-md mx-auto font-medium">
          نشكرك على تسوقك من مكتبة الخضري. سيقوم أحد ممثلي خدمة العملاء بالتواصل معك هاتفياً لتأكيد الطلب وتحديد موعد التوصيل.
        </p>

        <div className="bg-paper rounded-2xl border border-paper-line p-5 max-w-sm mx-auto text-xs text-ink-soft/70 space-y-2 font-bold">
          <div className="flex justify-between font-numbers">
            <span>قيمة الفاتورة المستحقة:</span>
            <span className="font-extrabold text-coral-deep text-sm">{successOrder.total.toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between">
            <span>طريقة الدفع:</span>
            <span className="text-sage-deep">الدفع عند الاستلام</span>
          </div>
        </div>

        <div className="pt-6">
          <Link
            href="/products"
            className="px-8 py-3.5 bg-coral hover:bg-coral-deep text-white font-bold text-xs rounded-cta transition-all inline-block shadow-glow hover:scale-105"
          >
            العودة للتسوق
          </Link>
        </div>
      </div>
    );
  }

  // EMPTY CHECKOUT
  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-card border border-paper-line p-12 text-center shadow-card">
        <AlertTriangle size={40} className="mx-auto text-amber mb-4" />
        <h3 className="font-extrabold text-base text-ink mb-1">لا توجد عناصر في السلة لإتمام الطلب</h3>
        <p className="text-ink-soft/60 text-xs mb-8">يرجى إضافة بعض الكشاكيل والأدوات المدرسية أولاً.</p>
        <Link href="/products" className="px-6 py-2.5 bg-coral hover:bg-coral-deep text-white font-bold text-xs rounded-cta transition-colors">
          الذهاب لصفحة المنتجات
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-28">
      
      {/* RIGHT SIDE: Shipping Form */}
      <div className="lg:col-span-7 order-2 lg:order-1">
        <div className="bg-white rounded-card shadow-card border border-paper-line p-6 md:p-8">
          <h2 className="font-extrabold text-xl text-ink mb-6">بيانات التوصيل والشحن</h2>
          
          <form onSubmit={handlePlaceOrder} className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="customer_name" className="block text-xs font-extrabold text-ink-soft/75 mb-2">الاسم بالكامل *</label>
              <input
                id="customer_name"
                type="text"
                required
                placeholder="اكتب اسمك الثلاثي للتوصيل..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-paper rounded-input border border-paper-line focus:outline-none focus:border-amber text-sm font-bold"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-xs font-extrabold text-ink-soft/75 mb-2">رقم الهاتف للتواصل *</label>
              <input
                id="phone"
                type="tel"
                required
                placeholder="مثال: 01012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-paper rounded-input border border-paper-line focus:outline-none focus:border-amber text-sm font-numbers text-right font-bold"
              />
              <p className="text-[10px] text-ink-soft/40 mt-1 font-bold">سنتصل بك على هذا الرقم لتأكيد الشحن.</p>
            </div>

            {/* Governorate */}
            <div>
              <label htmlFor="governorate" className="block text-xs font-extrabold text-ink-soft/75 mb-2">المحافظة *</label>
              <select
                id="governorate"
                required
                value={governorate}
                onChange={(e) => handleGovernorateChange(e.target.value)}
                className="w-full px-4 py-3 bg-paper rounded-input border border-paper-line focus:outline-none focus:border-amber text-sm font-bold"
              >
                <option value="">-- اختر محافظة التوصيل --</option>
                {shippingZones.map((zone) => (
                  <option key={zone.id} value={zone.governorate_name}>
                    {zone.governorate_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Detailed Address */}
            <div>
              <label htmlFor="address" className="block text-xs font-extrabold text-ink-soft/75 mb-2">العنوان بالتفصيل *</label>
              <textarea
                id="address"
                required
                rows={3}
                placeholder="الشارع، اسم العمارة، رقم الشقة، علامة مميزة بجوارك..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 bg-paper rounded-input border border-paper-line focus:outline-none focus:border-amber text-sm leading-relaxed font-bold"
              />
            </div>

            {/* Payment Method COD */}
            <div className="p-4 bg-paper rounded-2xl border border-paper-line flex items-start gap-3">
              <Info size={16} className="text-sage shrink-0 mt-0.5" />
              <div className="space-y-1 font-bold text-xs">
                <span className="block text-ink">طريقة الدفع المتاحة:</span>
                <span className="block text-ink-soft/70 leading-relaxed font-medium">
                  الدفع عند الاستلام نقداً بعد فحص محتويات الطرد والتأكد من مطابقتها لطلبك.
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-coral hover:bg-coral-deep text-white font-bold text-sm rounded-cta transition-all shadow-glow flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>جاري تسجيل طلبك...</span>
              ) : (
                <>
                  <span>تأكيد الطلب والدفع عند الاستلام</span>
                  <CheckCircle2 size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* LEFT SIDE: Order Sidebar Summary */}
      <div className="lg:col-span-5 order-1 lg:order-2 lg:sticky lg:top-28">
        <div className="bg-white rounded-card shadow-card border border-paper-line p-6 space-y-4">
          <h3 className="font-extrabold text-ink text-sm">تفاصيل سلة المشتريات</h3>
          
          {/* Items preview list */}
          <div className="divide-y divide-paper-dark max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
            {items.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center gap-3 first:pt-0 last:pb-0">
                <div className="relative w-10 h-10 bg-paper rounded-lg overflow-hidden shrink-0 border border-paper-line">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="40px"
                    className="object-contain p-0.5"
                  />
                </div>
                
                <div className="flex-grow min-w-0">
                  <h4 className="font-bold text-xs text-ink truncate leading-snug">{item.name}</h4>
                  <span className="text-[10px] text-ink-soft/50 font-numbers block mt-0.5 font-bold">
                    {item.qty} وحدة × {item.price} ج.م
                  </span>
                  {(item as any).colors && (item as any).colors.length > 0 && (
                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5 font-arabic">
                      الألوان: {(item as any).colors.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pricing calculations */}
          <div className="space-y-2.5 pt-4 border-t border-dashed border-paper-line text-xs text-ink-soft/75 font-numbers font-bold">
            <div className="flex justify-between">
              <span>الإجمالي الجزئي للطلب:</span>
              <span className="font-bold text-ink">{subtotal.toFixed(2)} ج.م</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>قيمة الخصم الكوبون:</span>
                <span className="font-bold">-{discount.toFixed(2)} ج.م</span>
              </div>
            )}

            {governorate ? (
              <div className="flex justify-between items-center">
                <span>تكلفة الشحن ({governorate}):</span>
                {isFreeShipping ? (
                  <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-bold text-[10px] font-cairo">
                    شحن مجاني!
                  </span>
                ) : (
                  <span className="font-bold text-ink">{shippingCost.toFixed(2)} ج.m</span>
                )}
              </div>
            ) : (
              <div className="flex justify-between text-ink-soft/45 text-[9px] items-center bg-paper p-2.5 rounded-xl border border-paper-line">
                <Truck size={12} className="text-sage" />
                <span>يرجى اختيار المحافظة لحساب الشحن</span>
              </div>
            )}

            {governorate && !isFreeShipping && freeShippingThreshold && (
              <div className="bg-paper p-2.5 rounded-xl border border-paper-line text-[10px] text-ink-soft/50 font-cairo leading-relaxed font-bold">
                * أضف منتجات بقيمة <strong className="font-numbers text-coral-deep">{(freeShippingThreshold - subtotal).toFixed(2)} ج.م</strong> إضافية للحصول على شحن مجاني للمحافظة!
              </div>
            )}

            <div className="flex justify-between items-baseline pt-4 border-t border-paper-line text-ink text-sm font-bold">
              <span>المجموع النهائي:</span>
              <span className="text-coral-deep font-black font-numbers text-xl">
                {total.toFixed(2)} <span className="text-xs font-cairo font-normal text-ink-soft">ج.م</span>
              </span>
            </div>
          </div>

          <div className="pt-2 text-center">
            <Link href="/cart" className="text-xs text-ink-soft/50 hover:text-coral transition-colors font-bold flex items-center justify-center gap-1">
              <ChevronRight size={14} className="text-amber shrink-0" />
              <span>العودة وتعديل سلة المشتريات</span>
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
