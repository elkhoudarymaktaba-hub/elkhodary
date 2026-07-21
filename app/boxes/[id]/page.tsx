import { notFound } from 'next/navigation';
import { supabase, cachedFetch } from '@/lib/supabase';
import BoxDetailClient from './box-detail-client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface BoxDetailPageProps {
  params: {
    id: string;
  };
}

async function getBoxData(id: string) {
  return cachedFetch(`box-detail-data-${id}`, async () => {
    try {
      // 1. Get box
      const { data: box, error } = await supabase
        .from('boxes')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !box) return null;

      const boxItems = (box.products || box.items || []) as Array<{ product_id: string; qty?: number; quantity?: number }>;
      if (!boxItems || boxItems.length === 0) {
        return { box, products: [], alternatives: [] };
      }

      // 2. Get products in this box
      const productIds = boxItems.map((item) => item.product_id);
      const { data: products } = await supabase
        .from('products')
        .select('*, categories(id, name)')
        .in('id', productIds);

      // 3. Get alternative products from the same categories for swapping
      const categoryIds = Array.from(
        new Set(products?.map((p) => p.category_id).filter(Boolean))
      );

      const { data: alternatives } = await supabase
        .from('products')
        .select('*, categories(id, name)')
        .in('category_id', categoryIds)
        .eq('is_active', true);

      return {
        box,
        products: products || [],
        alternatives: alternatives || [],
      };
    } catch (err) {
      console.error('Error fetching box details:', err);
      return null;
    }
  }, 5000);
}

export async function generateMetadata({ params }: BoxDetailPageProps) {
  const data = await getBoxData(params.id);
  if (!data) return { title: 'الباقة غير موجودة' };
  return {
    title: `تخصيص ${data.box.name}`,
    description: data.box.description || 'قم بتعديل محتويات الباقة المدرسية وإضافة البدائل وإتمام الطلب.',
  };
}

export default async function BoxDetailPage({ params }: BoxDetailPageProps) {
  const data = await getBoxData(params.id);

  if (!data) {
    notFound();
  }

  const { box, products, alternatives } = data;

  return (
    <div className="bg-brand-bg/40 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="text-xs text-brand-text/50 mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
          <span>/</span>
          <Link href="/boxes" className="hover:text-primary transition-colors">الباقات المدرسية</Link>
          <span>/</span>
          <span className="text-primary font-bold">{box.name}</span>
        </div>

        {/* Client Interactive Area */}
        <BoxDetailClient 
          box={box} 
          initialProducts={products} 
          allAlternatives={alternatives} 
        />
      </div>
    </div>
  );
}
