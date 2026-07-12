'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Check, Box } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { trackClientEvent } from '@/lib/tracking';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price_unit: number;
  price_box?: number | null;
  images: string[];
  category_id?: string;
  categories?: { name: string } | null;
  is_featured?: boolean;
  badge?: string;
}

const getProductBadge = (badgeType?: string) => {
  switch (badgeType) {
    case 'bestseller':
      return { text: '🔥 الأكثر طلباً', className: 'bg-rose-500 text-white border-rose-600' };
    case 'last_piece':
      return { text: '⚠️ آخر قطعة متبقية!', className: 'bg-red-600 text-white border-red-700 animate-pulse' };
    case 'limited_offer':
      return { text: '⏱️ عرض لفترة محدودة', className: 'bg-purple-600 text-white border-purple-700' };
    case 'last_5_pieces':
      return { text: '⚡ المتبقي 5 قطع فقط!', className: 'bg-amber text-ink border-amber-deep font-black' };
    case 'new':
      return { text: '✨ جديدنا', className: 'bg-emerald-500 text-white border-emerald-600' };
    case 'discount':
      return { text: '🏷️ خصم خاص', className: 'bg-sky-500 text-white border-sky-600' };
    default:
      return null;
  }
};

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const mainImage = product.images?.[0] || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80';
  const categoryName = product.categories?.name || 'أدوات مدرسية';

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      type: 'product',
      productId: product.id,
      name: product.name,
      price: product.price_unit,
      qty: 1,
      image: mainImage,
      unitType: 'piece',
    });

    trackClientEvent('AddToCart', {
      id: product.id,
      name: product.name,
      value: product.price_unit,
      qty: 1,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Determine notebook spine color dynamically based on product ID
  const spineColors = ['bg-sage', 'bg-coral', 'bg-amber', 'bg-ink-soft'];
  const colorIndex = product.id ? product.id.charCodeAt(0) % spineColors.length : 0;
  const spineColor = spineColors[colorIndex];

  return (
    <div className="group bg-white rounded-card overflow-hidden shadow-card border border-paper-line hover:border-amber/40 hover:shadow-brand transition-all duration-300 flex flex-col h-full relative hover:-translate-y-1.5">
      
      {/* Main product area */}
      <div className="flex flex-col h-full w-full">
        {/* Product Image Wrapper */}
        <Link href={`/products/${product.id}`} className="relative block h-40 sm:h-48 overflow-hidden bg-slate-50/50 border-b border-paper-line">
          <Image
            src={mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 30vw, 20vw"
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
            priority={product.is_featured}
          />
          
          {/* Category Badge */}
          <span className="absolute top-2.5 left-2.5 bg-white/95 text-ink-soft text-[9px] font-bold px-2 py-0.5 rounded-full border border-paper-line shadow-sm">
            {categoryName}
          </span>

          {/* Featured / Custom Badge */}
          {getProductBadge(product.badge) ? (
            <span className={`absolute top-2.5 right-2.5 text-[9.5px] font-bold px-2 py-0.5 rounded-full shadow-sm z-30 border ${getProductBadge(product.badge)?.className}`}>
              {getProductBadge(product.badge)?.text}
            </span>
          ) : product.is_featured ? (
            <span className="absolute top-2.5 right-2.5 bg-coral text-white text-[9.5px] font-bold px-2 py-0.5 rounded-full shadow-sm z-30 animate-pulse">
              مميز
            </span>
          ) : null}
        </Link>

        {/* Content details */}
        <div className="p-3.5 flex flex-col flex-grow justify-between">
          <div>
            <Link href={`/products/${product.id}`} className="block group-hover:text-coral transition-colors mb-1.5">
              <h3 className="font-extrabold text-xs sm:text-sm text-ink line-clamp-1 leading-snug">
                {product.name}
              </h3>
            </Link>

            {product.description && (
              <p className="text-ink-soft/75 text-[11px] line-clamp-2 mb-3.5 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          <div className="space-y-3">
            {/* Dashed separator border */}
            <div className="border-t border-dashed border-paper-line" />

            {/* Pricing details */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-soft/50 font-bold text-[10px]">سعر القطعة:</span>
                <span className="text-coral-deep font-extrabold text-sm sm:text-base font-numbers">
                  {product.price_unit} <span className="text-[10px] font-cairo font-normal text-ink-soft">ج.م</span>
                </span>
              </div>

              {product.price_box ? (
                <div className="flex items-center justify-between border-t border-slate-50 pt-1">
                  <span className="text-ink-soft/50 font-bold text-[10px] flex items-center gap-1">
                    <Box size={10} className="text-sage" /> سعر العلبة:
                  </span>
                  <span className="text-sage-deep font-extrabold text-xs sm:text-sm font-numbers">
                    {product.price_box} <span className="text-[10px] font-cairo font-normal text-ink-soft">ج.م</span>
                  </span>
                </div>
              ) : (
                <div className="h-4" /> // Keep card heights aligned
              )}
            </div>

            {/* Quick Add CTA */}
            <button
              onClick={handleQuickAdd}
              disabled={added}
              className={`w-full py-2 px-3 rounded-cta font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-300 border ${
                added
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-white border-paper-line text-ink-soft hover:bg-ink hover:text-white hover:border-ink shadow-sm'
              }`}
            >
              {added ? (
                <>
                  <Check size={12} />
                  <span>تم الحفظ</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={12} className="text-amber" />
                  <span>شراء سريع</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
