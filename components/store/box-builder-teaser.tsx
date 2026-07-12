'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft } from 'lucide-react';

interface BoxBuilderTeaserProps {
  title: string;
  desc: string;
  ctaText?: string;
  step1?: string;
  step2?: string;
  step3?: string;
  images?: string[];
}

export default function BoxBuilderTeaser({ 
  title, 
  desc, 
  ctaText, 
  step1 = 'اختر المرحلة الدراسية', 
  step2 = 'عدّل وزد الأدوات والكميات', 
  step3 = 'أضف الصندوق للسلة', 
  images = [] 
}: BoxBuilderTeaserProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const defaultDolls = [
    'https://images.unsplash.com/photo-1559251606-c623743a6d76?w=400', // Doll 1
    'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400', // Doll 2
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400', // Doll 3
    'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400', // Doll 4
    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400', // Doll 5
    'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400'  // Doll 6
  ];

  const displayImages = [0, 1, 2, 3, 4, 5].map(idx => images[idx] || defaultDolls[idx]);

  return (
    <section className="py-16 bg-[#16233F] text-white overflow-hidden relative border-b border-paper-line animate-in fade-in duration-300">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] bg-coral/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-amber">
              <Sparkles size={10} className="animate-pulse" />
              <span>تحكم كامل 100% بالكميات والأنواع</span>
            </div>
            
            <h2 className="text-2xl sm:text-4xl font-black leading-tight text-white">
              {title}
            </h2>
            
            <p className="text-white/70 text-xs sm:text-sm leading-relaxed max-w-xl">
              {desc}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-amber text-ink font-bold flex items-center justify-center font-numbers shrink-0">1</span>
                <span className="font-bold text-white/95 text-right">{step1}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-amber text-ink font-bold flex items-center justify-center font-numbers shrink-0">2</span>
                <span className="font-bold text-white/95 text-right">{step2}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-amber text-ink font-bold flex items-center justify-center font-numbers shrink-0">3</span>
                <span className="font-bold text-white/95 text-right">{step3}</span>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/box-builder"
                className="inline-flex items-center gap-2 px-8 py-4 bg-amber hover:bg-amber/90 text-ink font-black text-sm rounded-cta transition-all duration-300 shadow-glowLight hover:scale-105"
              >
                <span>{ctaText || 'ابدأ بناء صندوقك الآن'}</span>
                <ArrowLeft size={16} />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 w-full">
            <div className="grid grid-cols-3 gap-3 bg-white/5 p-6 rounded-2xl border border-white/10 relative">
              {[1, 2, 3, 4, 5, 6].map((i) => {
                const customSlotImg = displayImages[i - 1];
                return (
                  <div
                    key={i}
                    className="aspect-square rounded-xl border border-white/10 bg-white/5 flex items-center justify-center p-2 relative float-slow animate-float overflow-hidden"
                    style={{ animationDelay: `${i * 300}ms` }}
                  >
                    {customSlotImg ? (
                      <img src={customSlotImg} alt={`Slot ${i}`} className="w-full h-full object-cover rounded-lg animate-fade-in" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/10" />
                    )}
                    <span className="absolute bottom-1.5 left-1.5 bg-amber text-ink text-[8px] font-bold font-numbers rounded-full w-4 h-4 flex items-center justify-center border border-ink/40">
                      {i}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
