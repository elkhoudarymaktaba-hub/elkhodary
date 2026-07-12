'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ShoppingCart, Check, Plus, Minus, ShieldCheck, Box } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { trackClientEvent } from '@/lib/tracking';

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
  const images = product.images?.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80'];

  const [activeImage, setActiveImage] = useState(images[0]);
  const [unitType, setUnitType] = useState<'piece' | 'box'>('piece');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    trackClientEvent('ViewContent', {
      id: product.id,
      name: product.name,
      value: product.price_unit,
      type: 'product',
    });
  }, [product]);

  const currentPrice = unitType === 'piece'
    ? product.price_unit
    : (product.price_box || product.price_unit);

  const handleAdd = () => {
    addItem({
      type: 'product',
      productId: product.id,
      name: product.name,
      price: currentPrice,
      qty: quantity,
      image: images[0],
      unitType: unitType,
    });

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
    <div className="bg-white rounded-card shadow-brand border border-paper-line p-6 md:p-10 relative overflow-hidden">
      
      {/* Subtle decorative background gradients */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-sage/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber/5 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Right column: Image Gallery */}
        <div className="lg:col-span-6 space-y-4 z-10">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-paper/40 border border-paper-line">
            <Image
              src={activeImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
              className="object-contain p-4"
              priority
            />
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1.5 no-scrollbar">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(img)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 bg-white ${
                    activeImage === img ? 'border-amber' : 'border-paper-line hover:border-amber/40'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover p-1"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Left column: Actions & Details */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6 z-10">
          <div className="space-y-4">
            {/* Category tag */}
            <span className="inline-block bg-sage/10 text-sage-deep text-xs font-black px-3 py-1.5 rounded-full border border-sage/10">
              {product.categories?.name || 'أدوات مدرسية'}
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-ink leading-snug">
              {product.name}
            </h1>

            {/* Price Box */}
            <div className="p-4 bg-paper rounded-2xl border border-paper-line/80 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-ink-soft/60 text-xs font-bold">سعر القطعة الفردية:</span>
                <span className="text-coral-deep font-black text-2xl font-numbers">
                  {product.price_unit} <span className="text-sm font-cairo font-semibold text-ink-soft">ج.م</span>
                </span>
              </div>

              {product.price_box && (
                <div className="flex items-baseline justify-between pt-2.5 border-t border-paper-line">
                  <span className="text-ink-soft/60 text-xs font-bold flex items-center gap-1.5">
                    <Box size={14} className="text-sage" /> سعر العلبة الكاملة:
                  </span>
                  <span className="text-sage-deep font-black text-xl font-numbers">
                    {product.price_box} <span className="text-sm font-cairo font-semibold text-ink-soft">ج.م</span>
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="space-y-2">
                <h3 className="font-extrabold text-xs text-ink">وصف المنتج:</h3>
                <p className="text-ink-soft/75 text-sm leading-relaxed font-medium">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6 pt-6 border-t border-dashed border-paper-line">
            {/* Unit Selector */}
            {product.price_box && (
              <div className="space-y-2.5">
                <span className="block text-xs font-extrabold text-ink-soft/60">اختر طريقة الشراء:</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setUnitType('piece'); setQuantity(1); }}
                    className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center gap-1.5 ${
                      unitType === 'piece'
                        ? 'bg-ink border-ink text-white shadow-sm'
                        : 'bg-white border-paper-line text-ink-soft hover:bg-paper'
                    }`}
                  >
                    <span>شراء بالقطعة</span>
                    <span className="text-[10px] opacity-75 font-numbers">({product.price_unit} ج.م)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setUnitType('box'); setQuantity(1); }}
                    className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center gap-1.5 ${
                      unitType === 'box'
                        ? 'bg-ink border-ink text-white shadow-sm'
                        : 'bg-white border-paper-line text-ink-soft hover:bg-paper'
                    }`}
                  >
                    <span>شراء بالعلبة</span>
                    <span className="text-[10px] opacity-75 font-numbers">({product.price_box} ج.م)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quantity Counter & Add to Cart */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              
              {/* Counter */}
              <div className="flex items-center bg-paper border border-paper-line rounded-full p-1 shrink-0 w-full sm:w-auto justify-between">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-ink border border-paper-line hover:bg-paper-dark transition-all active:scale-95 shadow-sm"
                  aria-label="تقليل"
                >
                  <Minus size={14} />
                </button>
                <span className="w-14 text-center font-extrabold text-base font-numbers text-ink">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-ink border border-paper-line hover:bg-paper-dark transition-all active:scale-95 shadow-sm"
                  aria-label="زيادة"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Add CTA */}
              <button
                type="button"
                onClick={handleAdd}
                disabled={added}
                className={`w-full py-4 px-8 rounded-cta font-bold text-sm flex items-center justify-center gap-3 transition-all duration-300 ${
                  added
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-coral hover:bg-coral-deep text-white shadow-glow hover:scale-103'
                }`}
              >
                {added ? (
                  <>
                    <Check size={18} />
                    <span>تمت الإضافة للسلة!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} className="text-amber" />
                    <span>أضف {quantity > 1 ? `(${quantity})` : ''} للسلة</span>
                  </>
                )}
              </button>

            </div>

            {/* Subtotal calculation */}
            <div className="flex items-center justify-between text-xs text-ink-soft/50 pt-2 font-numbers font-bold">
              <span>الإجمالي الجزئي للمنتج:</span>
              <span className="font-extrabold text-coral-deep text-sm">
                {(currentPrice * quantity).toFixed(2)} ج.م
              </span>
            </div>

            {/* Quality Seal */}
            <div className="flex items-center gap-2 text-ink-soft/50 text-[10px] font-bold bg-paper/60 p-3 rounded-xl border border-paper-line/60">
              <ShieldCheck size={14} className="text-sage shrink-0" />
              <span>ضمان استبدال واسترجاع مرن خلال 14 يوم من الاستلام.</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
