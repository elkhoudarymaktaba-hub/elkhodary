import { supabase } from '@/lib/supabase';
import { getMockData } from '@/lib/mockData';
import BoxBuilderClient from './box-builder-client';

export const revalidate = 0; // Fresh data on every load

async function getBuilderData() {
  try {
    const categoriesPromise = supabase.from('categories').select('*').order('name');
    const productsPromise = supabase.from('products').select('*, categories(id, name)').eq('is_active', true);
    const boxesPromise = supabase.from('boxes').select('*').eq('is_active', true);

    const [categoriesRes, productsRes, boxesRes] = await Promise.all([
      categoriesPromise,
      productsPromise,
      boxesPromise,
    ]);

    return {
      categories: categoriesRes.data || [],
      products: productsRes.data || [],
      baseBoxes: boxesRes.data || [],
    };
  } catch (err) {
    console.error('Error fetching builder data:', err);
    return { categories: [], products: [], baseBoxes: [] };
  }
}

async function getPageData() {
  try {
    const { data } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', 'box-builder')
      .single();
    return data;
  } catch (e) {
    return null;
  }
}

export const metadata = {
  title: 'صانع الصناديق والقرطاسية المخصصة',
  description: 'قم بتصميم وبناء حقيبة ومجموعة مستلزمات طفلك المدرسية المخصصة خطوة بخطوة بالكميات المطلوبة وحساب السعر مباشرة.',
};

export default async function BoxBuilderPage({
  searchParams,
}: {
  searchParams: { stage?: string };
}) {
  const { categories, products, baseBoxes } = await getBuilderData();
  const dbPageData = await getPageData();
  const mockPages = getMockData.pages();
  const pageData = dbPageData || mockPages.find(p => p.slug === 'box-builder');

  const heroBlock = pageData?.blocks?.find((b: any) => b.type === 'hero');
  const stagesBlock = pageData?.blocks?.find((b: any) => b.type === 'box_builder_stages');
  const pageTitle = heroBlock?.content?.title || 'صانع الصناديق المدرسية التفاعلي';
  const pageSubtitle = heroBlock?.content?.subtitle || 'قم ببناء باقتك المدرسية المخصصة خطوة بخطوة. اختر المرحلة المدرسية كأساس للبدء، ثم عدل وأضف المنتجات التي ترغب بها بالكمية التي تناسبك.';

  return (
    <div className="bg-brand-bg/40 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-brand-text mb-2">
            {pageTitle}
          </h1>
          <p className="text-brand-text/60 text-sm max-w-lg mx-auto">
            {pageSubtitle}
          </p>
        </div>

        {/* Client Interactive Builder */}
        <BoxBuilderClient
          categories={categories}
          products={products as any}
          baseBoxes={baseBoxes}
          initialStageParam={searchParams.stage}
          stagesContent={stagesBlock?.content}
        />

      </div>
    </div>
  );
}
