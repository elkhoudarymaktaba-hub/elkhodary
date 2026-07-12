import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ProductDetailClient from './product-detail-client';
import ProductCard from '@/components/store/product-card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0; // Fresh data on every load

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

async function getProductData(id: string) {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*, categories(id, name)')
      .eq('id', id)
      .single();

    if (error || !product) {
      return null;
    }

    // 1. Get related products from the same category
    let { data: related } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('category_id', product.category_id)
      .eq('is_active', true)
      .neq('id', product.id)
      .limit(4);

    // If we have less than 4 related products, fetch featured products to fill the gaps
    if (!related || related.length < 4) {
      const neededCount = 4 - (related?.length || 0);
      const existingIds = [product.id, ...(related || []).map((p: any) => p.id)];
      
      const { data: featured } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('is_active', true)
        .eq('is_featured', true)
        .limit(6);
        
      if (featured && featured.length > 0) {
        const filteredFeatured = featured
          .filter((p: any) => !existingIds.includes(p.id))
          .slice(0, neededCount);
        related = [...(related || []), ...filteredFeatured];
      }
    }

    // 2. Fetch the featured box/package ID from site settings
    const { data: settingsList } = await supabase
      .from('site_settings')
      .select('key, value')
      .eq('key', 'featured_box_id')
      .limit(1);

    const featuredBoxIdSetting = settingsList?.[0]?.value;

    let featuredBox = null;
    if (featuredBoxIdSetting) {
      const { data: boxList } = await supabase
        .from('boxes')
        .select('*')
        .eq('id', featuredBoxIdSetting)
        .eq('is_active', true)
        .limit(1);
      if (boxList && boxList.length > 0) featuredBox = boxList[0];
    }

    // If no box is selected or found, fetch the first active box as a default fallback
    if (!featuredBox) {
      const { data: defaultBoxList } = await supabase
        .from('boxes')
        .select('*')
        .eq('is_active', true)
        .limit(1);
      if (defaultBoxList && defaultBoxList.length > 0) featuredBox = defaultBoxList[0];
    }

    return {
      product,
      related: related || [],
      featuredBox,
    };
  } catch (error) {
    console.error('Error fetching product details:', error);
    return null;
  }
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const data = await getProductData(params.id);
  if (!data) return { title: 'منتج غير موجود' };
  
  return {
    title: `${data.product.name}`,
    description: data.product.description || 'تفاصيل المنتج ومواصفاته وشراء بالقطعة والعلبة.',
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const data = await getProductData(params.id);

  if (!data) {
    notFound();
  }

  const { product, related, featuredBox } = data;

  return (
    <div className="bg-brand-bg/40 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <div className="text-xs text-brand-text/50 mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-primary transition-colors">المنتجات</Link>
          <span>/</span>
          <span className="text-brand-text/70">{product.categories?.name}</span>
          <span>/</span>
          <span className="text-primary font-bold">{product.name}</span>
        </div>

        {/* Product client details */}
        <ProductDetailClient product={product} />

        {/* Dynamic Promotional Box/Package Section */}
        {featuredBox && (
          <div className="mt-16 bg-white rounded-card shadow-brand border border-paper-line overflow-hidden p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Box Image */}
              <div className="lg:col-span-5 relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-50 border border-paper-line">
                <img
                  src={featuredBox.image_url}
                  alt={featuredBox.name}
                  className="object-cover w-full h-full"
                />
              </div>
              
              {/* Box Details */}
              <div className="lg:col-span-7 space-y-4 text-right" dir="rtl">
                <span className="inline-block bg-amber/15 text-amber-deep text-xs font-extrabold px-3 py-1 rounded-full border border-amber/20">
                  باقة مميزة مقترحة لكم
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-ink">{featuredBox.name}</h2>
                <p className="text-ink-soft/75 text-sm leading-relaxed">{featuredBox.description}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-dashed border-paper-line">
                  <div className="space-y-1">
                    <span className="text-ink-soft/50 text-xs block">سعر الباقة كاملة:</span>
                    <span className="text-coral-deep font-black text-2xl font-numbers">
                      {featuredBox.base_price} <span className="text-sm font-cairo font-semibold">ج.م</span>
                    </span>
                  </div>
                  
                  <Link
                    href={`/box-builder?stage=${featuredBox.stage}`}
                    className="py-3 px-6 rounded-cta font-bold text-sm bg-ink text-white hover:bg-ink-soft shadow-md transition-all duration-300 flex items-center gap-2"
                  >
                    <span>عرض وتعديل الباقة</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl sm:text-2xl font-black text-brand-text">منتجات قد تعجبك أيضاً</h2>
              <Link
                href="/products"
                className="flex items-center gap-1 text-primary hover:text-secondary text-xs font-bold transition-colors"
              >
                <span>تصفح الكل</span>
                <ArrowLeft size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {related.map((prod) => (
                <ProductCard key={prod.id} product={prod as any} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
