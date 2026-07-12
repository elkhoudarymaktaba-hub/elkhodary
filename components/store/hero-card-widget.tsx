'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getMockData } from '@/lib/mockData';

interface HeroCardData {
  type: 'box' | 'product';
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  link: string;
}

export default function HeroCardWidget({ initialData }: { initialData: any }) {
  const [data, setData] = useState<HeroCardData | null>(initialData);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (initialData) {
      setData(initialData);
      return;
    }

    const localSettings = localStorage.getItem('kh_settings');
    if (!localSettings) return;

    try {
      const parsed = JSON.parse(localSettings);
      const type = parsed.hero_card_type || 'box';
      const id = parsed.hero_card_id;

      if (!id) return;

      const fetchDetails = async () => {
        if (type === 'product') {
          const { data: prod } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

          if (prod) {
            setData({
              type: 'product',
              id: prod.id,
              name: prod.name,
              description: prod.description || '',
              imageUrl: prod.images?.[0] || 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80',
              price: prod.price_unit,
              link: `/products/${prod.id}`
            });
          } else {
            const mockProd = getMockData.products().find(p => p.id === id);
            if (mockProd) {
              setData({
                type: 'product',
                id: mockProd.id,
                name: mockProd.name,
                description: mockProd.description || '',
                imageUrl: mockProd.images?.[0] || 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80',
                price: mockProd.price_unit,
                link: `/products/${mockProd.id}`
              });
            }
          }
        } else if (type === 'box') {
          const { data: box } = await supabase
            .from('boxes')
            .select('*')
            .eq('id', id)
            .single();

          if (box) {
            setData({
              type: 'box',
              id: box.id,
              name: box.name,
              description: box.description || '',
              imageUrl: box.image_url || box.image || 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600',
              price: box.base_price,
              link: `/boxes/${box.id}`
            });
          } else {
            const mockBox = getMockData.boxes().find(b => b.id === id);
            if (mockBox) {
              setData({
                type: 'box',
                id: mockBox.id,
                name: mockBox.name,
                description: mockBox.description || '',
                imageUrl: mockBox.image_url || mockBox.image || 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600',
                price: mockBox.base_price,
                link: `/boxes/${mockBox.id}`
              });
            }
          }
        }
      };

      fetchDetails();
    } catch (e) {
      console.error('Error parsing hero card settings:', e);
    }
  }, [initialData]);

  if (!mounted || !data) {
    return null;
  }

  return (
    <div className="lg:col-span-5 relative w-full aspect-square max-w-md mx-auto reveal animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-gradient-to-tr from-sage/10 to-amber/10 rounded-full blur-3xl" />
      <Link
        href={data.link}
        className="relative w-full h-full rounded-notebook overflow-hidden border border-paper-line bg-white p-6 shadow-brand transform rotate-2 hover:rotate-0 transition-transform duration-500 block"
      >
        <div className="relative w-full h-3/5 rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
          <img
            src={data.imageUrl}
            alt={data.name}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
        
        <div className="h-2/5 pt-4 flex flex-col justify-center text-right" dir="rtl">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sage blink shrink-0" />
            <span className="text-[10px] text-ink-soft/60 font-bold">
              {data.type === 'box' ? 'باقة جاهزة للتوصيل الفوري' : 'منتج مميز متوفر بالمتجر'}
            </span>
          </div>
          <h3 className="font-extrabold text-base text-ink mb-1 line-clamp-1">
            {data.name}
          </h3>
          <p className="text-ink-soft/75 text-xs line-clamp-1 leading-relaxed">
            {data.description || 'تصفح التفاصيل والأسعار الآن بالمتجر.'}
          </p>
        </div>
      </Link>
    </div>
  );
}
