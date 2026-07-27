'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getMockData } from '@/lib/mockData';
import ProductDetailClient from './product-detail-client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface ProductClientPageProps {
  id: string;
}

export default function ProductClientPage({ id }: ProductClientPageProps) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);

      // 1. Try Supabase first
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(id, name)')
          .eq('id', id)
          .single();

        if (!error && data) {
          setProduct(data);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Supabase product fetch failed, trying local:', e);
      }

      // 2. Fallback: localStorage
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('kh_products');
          if (stored) {
            const localProducts = JSON.parse(stored);
            const found = localProducts.find((p: any) => p.id === id);
            if (found) {
              // Try to get category name
              let catName = 'أدوات مكتبية';
              try {
                const catStored = localStorage.getItem('kh_categories');
                if (catStored) {
                  const cats = JSON.parse(catStored);
                  const cat = cats.find((c: any) => c.id === found.category_id);
                  if (cat) catName = cat.name;
                }
              } catch (_) {}

              setProduct({
                ...found,
                categories: { id: found.category_id || 'all', name: catName }
              });
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('localStorage product fetch failed:', e);
        }
      }

      // 3. Fallback: getMockData (server-side mock)
      const mockProducts = getMockData.products();
      const mockFound = mockProducts.find((p: any) => p.id === id);
      if (mockFound) {
        const cats = getMockData.categories();
        const cat = cats.find((c: any) => c.id === mockFound.category_id);
        setProduct({
          ...mockFound,
          categories: { id: mockFound.category_id || 'all', name: cat?.name || 'أدوات مكتبية' }
        });
        setLoading(false);
        return;
      }

      // Not found anywhere
      setNotFound(true);
      setLoading(false);
    }

    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-paper min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-card border border-paper-line p-16 text-center shadow-card animate-pulse">
            <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4" />
            <div className="h-4 bg-slate-100 rounded w-48 mx-auto mb-2" />
            <div className="h-3 bg-slate-100 rounded w-32 mx-auto" />
            <p className="text-ink-soft/60 text-sm font-arabic mt-4">جاري تحميل تفاصيل المنتج...</p>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="bg-paper min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-card border border-paper-line p-16 shadow-card">
            <p className="text-5xl mb-4">📦</p>
            <h1 className="text-2xl font-black text-ink mb-2 font-arabic">المنتج غير متاح</h1>
            <p className="text-ink-soft/70 text-sm mb-6 font-arabic">
              هذا المنتج غير موجود أو تم إزالته. تصفح منتجاتنا الأخرى.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-cta font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              <ArrowLeft size={16} />
              تصفح المنتجات
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="text-xs text-brand-text/50 mb-8 flex items-center gap-2" dir="rtl">
          <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-primary transition-colors">المنتجات</Link>
          <span>/</span>
          <span className="text-brand-text/70">{product.categories?.name}</span>
          <span>/</span>
          <span className="text-primary font-bold">{product.name}</span>
        </div>

        <ProductDetailClient product={product} />
      </div>
    </div>
  );
}
