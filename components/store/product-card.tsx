'use client';

import { useState, useEffect } from 'react';
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
  const [resolvedCategory, setResolvedCategory] = useState(product.categories?.name || 'أدوات مدرسية');
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (product.categories?.name) {
      setResolvedCategory(product.categories.name);
      return;
    }
    
    // Resolve dynamically from local storage or fallback
    try {
      const local = localStorage.getItem('kh_categories');
      if (local) {
        const categoriesList = JSON.parse(local);
        const cat = categoriesList.find((c: any) => c.id === product.category_id);
        if (cat) {
          setResolvedCategory(cat.name);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [product]);

  const mainImage = product.images?.[0] || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80';

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
    <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber/50 transition-all duration-300 flex flex-col h-full relative hover:-translate-y-1">
      {/* Product Image */}
      <Link href={`/products/${product.id}`} className="relative block h-32 sm:h-36 overflow-hidden bg-slate-50/60 border-b border-slate-100 shrink-0">
        <Image
          src={mainImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          priority={product.is_featured}
        />
        
        {/* Category Tag */}
        <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-slate-500 text-[8.5px] font-bold px-1.5 py-0.5 rounded-md border border-slate-200/60 shadow-2xs">
          {resolvedCategory}
        </span>

        {/* Badge */}
        {getProductBadge(product.badge) ? (
          <span className={`absolute top-2 right-2 text-[8.5px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs z-10 border ${getProductBadge(product.badge)?.className}`}>
            {getProductBadge(product.badge)?.text}
          </span>
        ) : product.is_featured ? (
          <span className="absolute top-2 right-2 bg-amber text-ink text-[8.5px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs z-10">
            🔥 مميز
          </span>
        ) : null}
      </Link>

      {/* Content Details */}
      <div className="p-2.5 sm:p-3 flex flex-col flex-grow justify-between text-right" dir="rtl">
        <div>
          <Link href={`/products/${product.id}`} className="block group-hover:text-amber transition-colors mb-0.5">
            <h3 className="font-extrabold text-xs sm:text-sm text-ink line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </Link>

          {product.description && (
            <p className="text-slate-400 text-[10px] line-clamp-1 mb-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        <div className="space-y-2 mt-auto">
          {/* Pricing Row */}
          <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100">
            <div className="flex items-baseline gap-0.5">
              <span className="text-xs sm:text-sm font-black text-amber-deep font-numbers">
                {product.price_unit}
              </span>
              <span className="text-[9px] font-bold text-slate-400">ج.م</span>
            </div>

            {product.price_box ? (
              <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-1.5 py-0.5 rounded-md font-numbers">
                العلبة {product.price_box} ج.م
              </span>
            ) : null}
          </div>

          {/* Quick Add CTA */}
          <button
            onClick={handleQuickAdd}
            disabled={added}
            className={`w-full py-1.5 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all duration-200 shadow-2xs ${
              added
                ? 'bg-emerald-600 text-white border border-emerald-600'
                : 'bg-slate-50 border border-slate-200 text-ink hover:bg-amber hover:border-amber hover:text-white'
            }`}
          >
            {added ? (
              <>
                <Check size={12} />
                <span>تمت الإضافة</span>
              </>
            ) : (
              <>
                <ShoppingCart size={12} />
                <span>أضف للسلة</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
