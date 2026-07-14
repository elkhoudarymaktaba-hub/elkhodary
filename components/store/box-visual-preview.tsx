'use client';

import Image from 'next/image';
import { Sparkles, Package } from 'lucide-react';

interface BoxItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  image: string;
  category?: string;
  unitType?: 'piece' | 'box';
}

interface BoxVisualPreviewProps {
  items: BoxItem[];
  boxName: string;
  stageName?: string;
}

export default function BoxVisualPreview({ items, boxName, stageName }: BoxVisualPreviewProps) {
  const totalSlots = Math.max(8, items.length);
  const slots = Array.from({ length: totalSlots }).map((_, index) => {
    return items[index] || null;
  });

  const getStageBadgeColor = (stage?: string) => {
    switch (stage?.toLowerCase()) {
      case 'kg':
      case 'رياض الأطفال':
        return 'bg-amber/10 text-amber-deep border-amber/15';
      case 'primary':
      case 'المرحلة الابتدائية':
      case 'ابتدائى':
      case 'ابتدائي':
        return 'bg-emerald-500/10 text-emerald-800 border-emerald-500/15';
      case 'middle':
      case 'المرحلة الإعدادية':
      case 'إعدادى':
      case 'إعدادي':
        return 'bg-sage/10 text-sage-deep border-sage/15';
      case 'high':
      case 'المرحلة الثانوية':
      case 'ثانوي':
      case 'ثانوية عامة':
        return 'bg-coral/10 text-coral-deep border-coral/15';
      default:
        return 'bg-paper text-ink-soft border-paper-line';
    }
  };

  const totalPieces = items.filter(i => (i.unitType || 'piece') === 'piece').reduce((sum, item) => sum + item.qty, 0);
  const totalBoxes = items.filter(i => i.unitType === 'box').reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="bg-white rounded-card shadow-brand border border-paper-line p-6 relative overflow-hidden flex flex-col h-full z-10">
      {/* Decorative gradient backgrounds */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-sage/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

      {/* Box Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-paper-line pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-black text-base sm:text-lg text-ink">{boxName}</h3>
            {stageName && (
              <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${getStageBadgeColor(stageName)}`}>
                {stageName}
              </span>
            )}
          </div>
          <p className="text-ink-soft/60 text-xs font-bold flex items-center gap-1">
            <Package size={12} className="text-sage" />
            <span>
              يحتوي على <strong className="font-numbers text-coral-deep">{items.length}</strong> منتجات (إجمالي:{" "}
              {totalPieces > 0 ? `${totalPieces} قطعة` : ""}
              {totalPieces > 0 && totalBoxes > 0 ? " + " : ""}
              {totalBoxes > 0 ? `${totalBoxes} علبة كاملة` : ""}
              {totalPieces === 0 && totalBoxes === 0 ? "0 عناصر" : ""}
              )
            </span>
          </p>
        </div>
        
        <div className="text-left font-bold">
          <span className="block text-ink-soft/40 text-[9px] uppercase tracking-wider font-cairo">الإجمالي</span>
          <span className="text-coral-deep font-black text-xl font-numbers">
            {totalPrice.toFixed(2)} <span className="text-xs font-cairo font-normal text-ink-soft">ج.م</span>
          </span>
        </div>
      </div>

      {/* Visual Box grid */}
      <div className="relative z-10 flex-grow bg-paper/50 rounded-2xl p-5 border border-paper-line/60">
        
        {/* Pulsating Indicator */}
        <div className="absolute top-[-10px] left-1/2 transform -translate-x-1/2 bg-coral text-white text-[9px] font-bold px-4 py-1 rounded-full shadow-md flex items-center gap-1 border border-coral-deep animate-pulse">
          <Sparkles size={10} className="text-amber animate-spin" />
          <span>محتويات الصندوق المخصصة</span>
        </div>

        {/* 3D Grid slots inside the box */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-2">
          {slots.map((item, idx) => {
            if (item) {
              return (
                <div
                  key={`${item.productId}_${item.unitType || 'piece'}_${idx}`}
                  className="group relative aspect-square bg-white rounded-xl border border-paper-line shadow-sm flex items-center justify-center p-2.5 hover:border-amber hover:shadow-brand transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-contain rounded-md"
                    />
                  </div>
                  
                  {/* Quantity & Unit Type Indicator */}
                  <span className={`absolute -bottom-1.5 -left-1.5 text-white text-[9px] font-bold font-numbers rounded-full w-5 h-5 flex items-center justify-center border border-white shadow-sm group-hover:scale-110 transition-transform ${
                    item.unitType === 'box' ? 'bg-sage-deep' : 'bg-coral'
                  }`}>
                    {item.qty}
                  </span>

                  {item.unitType === 'box' && (
                    <span className="absolute top-1 right-1 bg-sage-deep/15 text-sage-deep text-[8px] font-bold px-1 rounded border border-sage-deep/10">
                      علبة
                    </span>
                  )}

                  {/* Tooltip name */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-ink text-white text-[9px] font-bold px-2.5 py-1 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-30 border border-ink-soft/40 shadow-brand">
                    {item.name} {item.unitType === 'box' ? '(علبة كاملة)' : '(قطعة)'} ({item.price} ج.م)
                  </div>
                </div>
              );
            }

            return (
              <div
                key={`empty_${idx}`}
                className="aspect-square rounded-xl border-2 border-dashed border-paper-line/60 flex items-center justify-center bg-white/20"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-paper-line/40" />
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
