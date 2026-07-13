import { supabase, cachedFetch } from '@/lib/supabase';
import ProductsClient from './products-client';
import { getMockData } from '@/lib/mockData';

export const revalidate = 0; // Fresh data on every load

async function getProductsData() {
  return cachedFetch('products-page-data', async () => {
    try {
      const categoriesPromise = supabase
        .from('categories')
        .select('*')
        .order('name');

      const productsPromise = supabase
        .from('products')
        .select('*, categories(name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      const pagePromise = supabase
        .from('pages')
        .select('*')
        .eq('slug', 'products')
        .limit(1);

      const [categoriesRes, productsRes, pageRes] = await Promise.all([
        categoriesPromise,
        productsPromise,
        pagePromise
      ]);

      let pageData = null;
      if (pageRes.data && pageRes.data.length > 0) {
        pageData = pageRes.data[0];
      } else {
        pageData = getMockData.pages().find(p => p.slug === 'products') || null;
      }

      return {
        categories: categoriesRes.data || [],
        products: productsRes.data || [],
        pageData,
      };
    } catch (error) {
      console.error('Error fetching products page data:', error);
      return { categories: [], products: [], pageData: null };
    }
  }, 5000);
}

export async function generateMetadata() {
  const { pageData } = await getProductsData();
  const heroBlock = pageData?.blocks?.find((b: any) => b.type === 'hero');
  return {
    title: heroBlock?.content?.title || 'تسوق الأدوات والمستلزمات المدرسية',
    description: heroBlock?.content?.subtitle || 'تصفح تشكيلة واسعة من الأقلام، الكشاكيل، الممحاة، والمساطر وغيرها من المستلزمات المدرسية مع فلاتر البحث المتقدمة.',
  };
}

export default async function ProductsPage() {
  const { categories, products, pageData } = await getProductsData();

  // Find hero block from pageData blocks to dynamically pull edit values from admin builder
  const heroBlock = pageData?.blocks?.find((b: any) => b.type === 'hero');
  const pageTitle = heroBlock?.content?.title || 'معرض المنتجات والأدوات المدرسية';
  const pageSubtitle = heroBlock?.content?.subtitle || 'تصفح منتجاتنا الفردية بأسعار متميزة للقطعة والعلبة، وقم بفلترة المنتجات للوصول إلى ما تحتاجه دراستك سريعاً.';

  return (
    <div className="bg-brand-bg/50 min-h-screen py-10 pt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header (Dynamic from Supabase page builder settings) */}
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-3xl font-black text-ink">
            {pageTitle}
          </h1>
          <p className="text-ink-soft/60 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            {pageSubtitle}
          </p>
        </div>

        {/* Live Filter Interface */}
        <ProductsClient categories={categories} initialProducts={products as any} />
      </div>
    </div>
  );
}
