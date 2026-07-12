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

  // 1. Fire ViewContent event on mount
  useEffect(() => {
    trackClientEvent('ViewContent', {
      id: product.id,
      name: product.name,
      value: product.price_unit,
      type: 'product',
    });
  }, [product]);

  // Handle unit price selection
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
              {product.categories?.name || 'أدوات مدرسية'}
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
            {product.description && (
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-brand-text">وصف المنتج:</h3>
                <p className="text-brand-text/70 text-sm leading-relaxed">
                  {product.description}
                </p>
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
                        ? 'bg-ink border-ink text-white shadow-sm'
                        : 'bg-white border-paper-line text-ink-soft hover:bg-paper-dark'
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
                        ? 'bg-ink border-ink text-white shadow-sm'
                        : 'bg-white border-paper-line text-ink-soft hover:bg-paper-dark'
                    }`}
                  >
                    <span>شراء بالعلبة</span>
                    <span className="text-[10px] opacity-75 font-numbers">({product.price_box} ... خصم خاص)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Qty Selector & Add to Cart button */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              
              {/* Qty Counter */}
              <div className="flex items-center bg-paper border border-paper-line rounded-cta p-1.5 shrink-0 w-full sm:w-auto justify-between">
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

              {/* Add to Cart CTA */}
              <button
                type="button"
                onClick={handleAdd}
                disabled={added}
                className={`w-full py-4 px-8 rounded-cta font-bold text-base flex items-center justify-center gap-3 transition-all duration-300 ${
                  added
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-coral text-white hover:bg-coral-deep shadow-lg shadow-coral/20 hover:scale-103'
                }`}
              >
                {added ? (
                  <>
                    <Check size={20} className="animate-ping" />
                    <span>تمت الإضافة للسلة!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={20} />
                    <span>أضف {quantity > 1 ? `(${quantity})` : ''} للسلة</span>
                  </>
                )}
              </button>

            </div>

            {/* Total calculation */}
            <div className="flex items-center justify-between text-xs text-ink-muted pt-2 font-numbers">
              <span>الإجمالي الجزئي:</span>
              <span className="font-bold text-coral-deep text-sm">
                {(currentPrice * quantity).toFixed(2)} ج.م
              </span>
            </div>



          </div>
        </div>

      </div>
    </div>
  );
}
