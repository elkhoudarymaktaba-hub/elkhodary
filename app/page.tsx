import Link from 'next/link';
import Image from 'next/image';
import { supabase, cachedFetch } from '@/lib/supabase';
import ProductCard from '@/components/store/product-card';
import { Package, Sparkles, Smile, Truck, ShieldCheck, ArrowLeft, Layers } from 'lucide-react';
import { PageBlock, getMockData } from '@/lib/mockData';
import HeroCardWidget from '@/components/store/hero-card-widget';
import BoxBuilderTeaser from '@/components/store/box-builder-teaser';

function getStageLabel(stage: string) {
  switch (stage.toLowerCase()) {
    case 'kg': return 'رياض الأطفال';
    case 'primary': return 'المرحلة الابتدائية';
    case 'middle': return 'المرحلة الإعدادية';
    case 'high': return 'المرحلة الثانوية';
    default: return stage;
  }
}

export const revalidate = 0; // Fresh data on every load

async function getHomeData() {
  return cachedFetch('home-page-data', async () => {
    try {
      // 1. Fetch pages and extract hero block first to know what to pre-fetch
      const pagesPromise = supabase
      .from('pages')
      .select('*')
      .eq('slug', 'home')
      .limit(1);

    const pagesRes = await pagesPromise;
    const dbPage = pagesRes.data && pagesRes.data.length > 0 ? pagesRes.data[0] : null;
    const mockHome = getMockData.pages().find(p => p.slug === 'home');

    let useMock = !dbPage;
    if (dbPage && mockHome) {
      const dbTime = dbPage.updated_at ? new Date(dbPage.updated_at).getTime() : 0;
      const mockTime = mockHome.updated_at ? new Date(mockHome.updated_at).getTime() : 0;
      if (mockTime > dbTime) {
        useMock = true;
      }
    }

    const homePage = useMock ? mockHome : dbPage;
    let blocks: any[] = homePage?.blocks || [];
    blocks = [...blocks].sort((a, b) => a.order - b.order);

    const heroBlock = blocks.find((b: any) => b.type === 'hero');
    let selectedProductId = '';
    let selectedBoxId = '';
    if (heroBlock?.content?.media_type === 'product' && heroBlock?.content?.selected_id) {
      selectedProductId = heroBlock.content.selected_id;
    }
    if (heroBlock?.content?.media_type === 'box' && heroBlock?.content?.selected_id) {
      selectedBoxId = heroBlock.content.selected_id;
    }

    // 2. Fetch site settings
    const settingsPromise = supabase
      .from('site_settings')
      .select('key, value')
      .in('key', [
        'hero_card_type', 
        'hero_card_id',
        'box_builder_title',
        'box_builder_desc',
        'box_builder_image'
      ]);

    const productsPromise = supabase
      .from('products')
      .select('*, categories(name)')
      .eq('is_featured', true)
      .eq('is_active', true)
      .limit(8);

    const boxesPromise = supabase
      .from('boxes')
      .select('*')
      .eq('is_active', true);

    const selectedProductPromise = selectedProductId
      ? supabase.from('products').select('*, categories(name)').eq('id', selectedProductId).limit(1)
      : Promise.resolve({ data: null });

    const selectedBoxPromise = selectedBoxId
      ? supabase.from('boxes').select('*').eq('id', selectedBoxId).limit(1)
      : Promise.resolve({ data: null });

    const [settingsRes, productsRes, boxesRes, selectedProductRes, selectedBoxRes] = await Promise.all([
      settingsPromise,
      productsPromise,
      boxesPromise,
      selectedProductPromise,
      selectedBoxPromise
    ]);

    const settings: Record<string, string> = {};
    settingsRes.data?.forEach((s) => {
      settings[s.key] = s.value;
    });

    const heroCardType = settings.hero_card_type || 'box';
    const heroCardId = settings.hero_card_id;

    let heroCardData = null;

    if (heroCardType === 'product' && heroCardId) {
      const { data: prodData } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('id', heroCardId)
        .eq('is_active', true)
        .limit(1);
      if (prodData && prodData.length > 0) {
        const p = prodData[0];
        heroCardData = {
          type: 'product',
          id: p.id,
          name: p.name,
          description: p.description || '',
          imageUrl: p.images?.[0] || 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&q=80',
          price: p.price_unit,
          link: `/products/${p.id}`
        };
      }
    } else if (heroCardType === 'box' && heroCardId) {
      const { data: boxData } = await supabase
        .from('boxes')
        .select('*')
        .eq('id', heroCardId)
        .eq('is_active', true)
        .limit(1);
      if (boxData && boxData.length > 0) {
        const b = boxData[0];
        heroCardData = {
          type: 'box',
          id: b.id,
          name: b.name,
          description: b.description || '',
          imageUrl: b.image_url || 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&q=80',
          price: b.base_price,
          link: `/box-builder?stage=${b.stage}`
        };
      }
    }

    if (!heroCardData) {
      const defaultBox = boxesRes.data?.[0];
      if (defaultBox) {
        heroCardData = {
          type: 'box',
          id: defaultBox.id,
          name: defaultBox.name,
          description: defaultBox.description || '',
          imageUrl: defaultBox.image_url || 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&q=80',
          price: defaultBox.base_price,
          link: `/box-builder?stage=${defaultBox.stage}`
        };
      }
    }

    const boxBuilderSettings = {
      title: settings.box_builder_title || 'اصنع باقتك المدرسية المخصصة بنفسك!',
      desc: settings.box_builder_desc || 'لا تتقيد بالباقات الجاهزة. اختر الكشكول، القلم، المسطرة، وكل ما تحتاجه بالكميات التي تناسبك تماماً، ودع الباقي علينا لتعبئته وتوصيله لباب منزلك.',
      image: settings.box_builder_image || ''
    };

    const featuredProducts = productsRes.data || [];
    if (selectedProductRes?.data && selectedProductRes.data.length > 0) {
      const p = selectedProductRes.data[0];
      if (!featuredProducts.some((item: any) => item.id === p.id)) {
        featuredProducts.push(p);
      }
    }

    const boxes = boxesRes.data || [];
    if (selectedBoxRes?.data && selectedBoxRes.data.length > 0) {
      const b = selectedBoxRes.data[0];
      if (!boxes.some((item: any) => item.id === b.id)) {
        boxes.push(b);
      }
    }

    return {
      featuredProducts: featuredProducts,
      boxes: boxes,
      heroCardData,
      boxBuilderSettings,
      blocks
    };
  } catch (error) {
    console.error('Error loading home data:', error);
    return { 
      featuredProducts: [], 
      boxes: [], 
      heroCardData: null,
      boxBuilderSettings: {
        title: 'اصنع باقتك المدرسية المخصصة بنفسك!',
        desc: 'لا تتقيد بالباقات الجاهزة. اختر الكشكول، القلم، المسطرة، وكل ما تحتاجه بالكميات التي تناسبك تماماً، ودع الباقي علينا لتعبئته وتوصيله لباب منزلك.',
        image: ''
      },
      blocks: []
    };
  }
 }, 5000);
}


async function DynamicProductsRow({ block }: { block: PageBlock }) {
  let query = supabase.from('products').select('*, categories(name)').eq('is_active', true);
  if (block.content.categoryId && block.content.categoryId !== 'all') {
    query = query.eq('category_id', block.content.categoryId);
  } else {
    query = query.eq('is_featured', true);
  }
  const { data: rowProducts } = await query.limit(block.content.limit || 8);
  const products = rowProducts || [];

  const isGrid = block.content.layout === 'grid';

  return (
    <section className="py-16 bg-transparent border-b border-paper-line reveal animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-ink mb-1.5">
            {block.content.title || 'المنتجات المميزة'}
          </h2>
          {block.content.subtitle && (
            <p className="text-ink-soft/60 text-xs sm:text-sm">
              {block.content.subtitle}
            </p>
          )}
        </div>

        {products.length > 0 ? (
          isGrid ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x" dir="rtl">
              {products.map((product) => (
                <div key={product.id} className="min-w-[280px] sm:min-w-[300px] snap-start shrink-0">
                  <ProductCard product={product as any} />
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="bg-white rounded-card border border-paper-line p-12 text-center shadow-card">
            <p className="text-ink-soft/60 text-xs font-arabic">المنتجات قيد الرفع حالياً. ترقبوا انطلاق المتجر الكامل!</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const { featuredProducts, boxes, heroCardData, boxBuilderSettings, blocks } = await getHomeData();

  return (
    <>
      <div className="bg-paper min-h-screen">
        {blocks.map((block) => {
        switch (block.type) {
          case 'hero': {
            let currentHeroCardData = heroCardData;
            if (block.content.media_type === 'product' && block.content.selected_id) {
              const p = featuredProducts.find((prod: any) => prod.id === block.content.selected_id);
              if (p) {
                currentHeroCardData = {
                  type: 'product',
                  id: p.id,
                  name: p.name,
                  description: p.description || '',
                  imageUrl: p.images?.[0] || 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80',
                  price: p.price_unit,
                  link: `/products/${p.id}`
                };
              }
            } else if (block.content.media_type === 'box' && block.content.selected_id) {
              const b = boxes.find((box: any) => box.id === block.content.selected_id);
              if (b) {
                currentHeroCardData = {
                  type: 'box',
                  id: b.id,
                  name: b.name,
                  description: b.description || '',
                  imageUrl: b.image || b.image_url || 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80',
                  price: b.base_price,
                  link: `/boxes/${b.id}`
                };
              }
            }

            return (
              <section key={block.id} className="relative overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-24 bg-notebook-lines border-b border-paper-line text-right">
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-amber/5 rounded-full blur-[140px] pointer-events-none z-10" />
                <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-coral/5 rounded-full blur-[100px] pointer-events-none z-10" />
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Right: Text content */}
                    <div className="lg:col-span-7 space-y-6 text-center lg:text-right">
                      {/* Eyebrow badge with blinking dot */}
                      <div className="inline-flex items-center gap-2.5 bg-white border border-paper-line text-ink-soft text-xs font-bold px-4 py-2 rounded-full shadow-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-sage blink shrink-0" />
                        <span>{block.content.badge_text || 'عروض العودة للدراسة 2026/2027'}</span>
                      </div>
                      
                      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-ink leading-tight animate-rise">
                        {block.content.title ? (
                          <>
                            {block.content.title.split(' ')[0]} <br />
                            <span className="highlighter text-coral font-black">{block.content.title.split(' ').slice(1).join(' ')}</span>
                          </>
                        ) : (
                          <>
                            سهّلنا عليك التجهيز <br />
                            <span className="highlighter text-coral font-black">للمدرسة والتعليم!</span>
                          </>
                        )}
                      </h1>
                      
                      <p className="text-ink-soft/75 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                        {block.content.subtitle || 'اكتشف باقات الأدوات المدرسية المخصصة لكل مرحلة تعليمية لتشتري مستلزمات السنة كاملة بضغطة زر، أو قم ببناء صندوقك المخصص بالكامل.'}
                      </p>

                      <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                        <Link
                          href={block.content.ctaLink || "/boxes"}
                          className="w-full sm:w-auto px-8 py-4 bg-coral hover:bg-coral-deep text-white font-bold text-sm rounded-cta text-center transition-all duration-300 shadow-glow hover:scale-105"
                        >
                          {block.content.ctaText || "تسوق الباقات المدرسية"}
                        </Link>
                        <Link
                          href={block.content.cta2Link || "/products"}
                          className="w-full sm:w-auto px-8 py-4 bg-white text-ink border border-paper-line hover:border-ink font-bold text-sm rounded-cta text-center transition-all duration-300 hover:bg-paper-dark hover:scale-105"
                        >
                          {block.content.cta2Text || "تصفح كافة المنتجات"}
                        </Link>
                      </div>
                    </div>

                    {/* Left: Dynamic media card / static image */}
                    {block.content.media_type === 'image' ? (
                      <div className="lg:col-span-5 relative w-full aspect-square max-w-md mx-auto rounded-notebook overflow-hidden border border-paper-line bg-white p-6 shadow-brand transform rotate-2 hover:rotate-0 transition-transform duration-500 block">
                        <div className="w-full h-full rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                          <img src={block.content.imageUrl || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600'} className="w-full h-full object-cover animate-fade-in" />
                        </div>
                      </div>
                    ) : (
                      <HeroCardWidget initialData={currentHeroCardData} />
                    )}
                  </div>
                </div>
              </section>
            );
          }

          case 'stats':
            return (
              <section key={block.id} className="bg-ink text-white py-10 border-y border-ink-soft/40 reveal animate-in fade-in duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Stat 1 */}
                    <div className="flex items-center gap-4 justify-center md:justify-start">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 shadow-inner border border-white/10">
                        <span className="text-xl">{block.content.stat1_emoji || '🎓'}</span>
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-black text-lg text-amber font-numbers">{block.content.stat1_number || '+2000'}</h4>
                        <p className="text-white/80 text-xs font-bold font-arabic">{block.content.stat1_label || 'طالب سعيد'}</p>
                      </div>
                    </div>

                    {/* Stat 2 */}
                    <div className="flex items-center gap-4 justify-center md:border-r border-white/10 md:pr-8">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 shadow-inner border border-white/10">
                        <span className="text-xl">{block.content.stat2_emoji || '🚚'}</span>
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-black text-lg text-amber font-numbers">{block.content.stat2_number || '+1500'}</h4>
                        <p className="text-white/80 text-xs font-bold font-arabic">{block.content.stat2_label || 'بوكس تم تسليمه'}</p>
                      </div>
                    </div>

                    {/* Stat 3 */}
                    <div className="flex items-center gap-4 justify-center md:border-r border-white/10 md:pr-8">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 shadow-inner border border-white/10">
                        <span className="text-xl">{block.content.stat3_emoji || '🛡️'}</span>
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-black text-lg text-amber font-numbers">{block.content.stat3_number || '4.9'}</h4>
                        <p className="text-white/80 text-xs font-bold font-arabic">{block.content.stat3_label || 'تقييم العملاء'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );

          case 'packages_section':
            return (
              <section key={block.id} className="py-16 bg-transparent border-b border-paper-line reveal animate-in fade-in duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-ink mb-1.5">
                        {block.content.title || 'الصناديق المدرسية الجاهزة'}
                      </h2>
                      <p className="text-ink-soft/60 text-xs sm:text-sm">
                        {block.content.subtitle || 'اختر الصندوق المناسب لمرحلة طفلك ووفر عناء شراء كل قطعة بمفردها'}
                      </p>
                    </div>
                    <Link
                      href={block.content.ctaLink || "/boxes"}
                      className="flex items-center gap-1 text-coral font-bold text-xs hover:text-coral-deep transition-colors"
                    >
                      <span>{block.content.ctaText || 'عرض كل الصناديق'}</span>
                      <ArrowLeft size={14} />
                    </Link>
                  </div>

                  {(() => {
                    const displayedBoxes = Array.isArray(block.content.boxIds) && block.content.boxIds.length > 0
                      ? block.content.boxIds
                          .map(id => boxes.find(b => b.id === id))
                          .filter(Boolean)
                      : boxes;

                    return displayedBoxes.length > 0 ? (
                      <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x">
                        {displayedBoxes.map((box, index) => {
                          const spineColors = ['bg-sage', 'bg-coral', 'bg-amber', 'bg-ink-soft'];
                          const spineColor = spineColors[index % spineColors.length];

                          return (
                            <div
                              key={box.id}
                              className="min-w-[280px] sm:min-w-[340px] snap-start bg-white rounded-card overflow-hidden shadow-card border border-paper-line hover:shadow-brand transition-all duration-300 flex flex-col justify-between relative transform hover:-translate-y-2 hover:-rotate-[0.6deg]"
                            >
                              <div className="flex flex-col h-full justify-between">
                                <div className="relative h-44 bg-paper-dark/20 rounded-bl-xl overflow-hidden">
                                  {box.image || box.image_url ? (
                                    <img src={box.image || box.image_url} alt={box.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="absolute inset-0 bg-gradient-to-tr from-paper-dark to-slate-200 flex items-center justify-center text-slate-400">
                                      <Package size={48} />
                                    </div>
                                  )}
                                  <span className="absolute top-3 right-3 bg-ink/85 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full backdrop-blur-sm shadow-sm font-arabic">
                                    {getStageLabel(box.stage)}
                                  </span>
                                </div>

                                <div className="p-5 flex-grow flex flex-col justify-between text-right" dir="rtl">
                                  <div>
                                    <h3 className="font-extrabold text-sm sm:text-base text-ink mb-1">
                                      {box.name}
                                    </h3>
                                    <p className="text-ink-soft/75 text-[11px] sm:text-xs leading-relaxed line-clamp-2 mb-4">
                                      {box.description}
                                    </p>
                                  </div>

                                  <div className="flex items-center justify-between border-t border-dashed border-paper-line pt-3.5 mt-auto">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] text-ink-soft/50 font-bold">سعر الصندوق كامل</span>
                                      <span className="text-base sm:text-lg font-black text-coral font-numbers">
                                        {box.base_price} <span className="text-xs font-bold text-ink-soft">ج.م</span>
                                      </span>
                                    </div>

                                    <Link
                                      href={`/boxes/${box.id}`}
                                      className="px-4 py-2.5 bg-amber hover:bg-amber-deep text-ink font-black text-xs rounded-cta transition-all duration-300 hover:scale-105"
                                    >
                                      عرض الباقة
                                    </Link>
                                  </div>
                                </div>
                              </div>
                              <div className={`absolute top-0 left-0 w-1.5 h-full ${spineColor}`} />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-white rounded-card border border-paper-line p-12 text-center shadow-card">
                        <p className="text-ink-soft/60 text-xs">الباقات قيد البناء والترتيب حالياً.</p>
                      </div>
                    );
                  })()}
                </div>
              </section>
            );

          case 'box_builder_section':
            return null;

          case 'products_row':
            return (
              <DynamicProductsRow key={block.id} block={block} />
            );

          case 'text':
            return (
              <section key={block.id} className="py-12 bg-transparent border-b border-paper-line reveal animate-in fade-in duration-300">
                <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
                  {block.content.title && (
                    <h3 className="text-xl sm:text-2xl font-black text-ink">{block.content.title}</h3>
                  )}
                  <div 
                    className="text-ink-soft/80 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto font-medium font-arabic"
                    dangerouslySetInnerHTML={{ __html: block.content.text || '' }}
                  />
                </div>
              </section>
            );

          case 'image':
            return (
              <section key={block.id} className="py-12 bg-transparent reveal animate-in fade-in duration-300">
                <div className="max-w-5xl mx-auto px-4">
                  {block.content.imageUrl && (
                    <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden border border-paper-line shadow-card bg-white">
                      <Image src={block.content.imageUrl} alt={block.content.caption || 'Image block'} fill className="object-cover" />
                    </div>
                  )}
                  {block.content.caption && (
                    <p className="text-center text-[11px] text-ink-soft/50 mt-3 font-arabic">{block.content.caption}</p>
                  )}
                </div>
              </section>
            );

          case 'mixed':
            return (
              <section key={block.id} className="py-16 bg-transparent border-b border-paper-line reveal animate-in fade-in duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                    <div className={`space-y-4 text-right ${block.content.align === 'left' ? 'md:order-2' : ''}`}>
                      {block.content.title && (
                        <h3 className="text-xl sm:text-2xl font-black text-ink">{block.content.title}</h3>
                      )}
                      <p className="text-ink-soft/80 text-xs sm:text-sm leading-relaxed font-arabic">
                        {block.content.text}
                      </p>
                    </div>
                    {block.content.imageUrl && (
                      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-card border border-paper-line bg-paper-dark/10">
                        <Image src={block.content.imageUrl} alt={block.content.title || 'Mixed block'} fill className="object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );

          case 'contact_section':
            return (
              <section key={block.id} className="py-16 bg-transparent border-b border-paper-line reveal animate-in fade-in duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                    <div className="space-y-5 text-right font-arabic">
                      <h3 className="text-xl sm:text-2xl font-black text-ink">{block.content.title || 'تواصل معنا في أي وقت'}</h3>
                      <p className="text-ink-soft/60 text-xs leading-relaxed">
                        نحن هنا للإجابة على استفساراتكم ومساعدتكم في كل ما يخص مستلزماتكم الدراسية والتوصيل.
                      </p>
                      
                      <div className="space-y-3 pt-3">
                        {block.content.phone && (
                          <div className="flex items-center gap-3 text-sm">
                            <span className="w-8 h-8 rounded-lg bg-amber/15 text-amber-deep flex items-center justify-center font-bold">📞</span>
                            <span className="font-numbers text-ink font-bold">{block.content.phone}</span>
                          </div>
                        )}
                        {block.content.email && (
                          <div className="flex items-center gap-3 text-sm">
                            <span className="w-8 h-8 rounded-lg bg-coral/15 text-coral-deep flex items-center justify-center font-bold">✉️</span>
                            <span className="text-ink font-medium">{block.content.email}</span>
                          </div>
                        )}
                        {block.content.address && (
                          <div className="flex items-center gap-3 text-sm">
                            <span className="w-8 h-8 rounded-lg bg-sage/15 text-sage-deep flex items-center justify-center font-bold">📍</span>
                            <span className="text-ink font-medium">{block.content.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-card border border-paper-line shadow-card text-center space-y-4">
                      <h4 className="font-extrabold text-sm text-ink font-arabic">للتواصل السريع والمباشر عبر الواتساب:</h4>
                      <p className="text-xs text-ink-soft/60 font-arabic">
                        اضغط على الزر أدناه لبدء المحادثة مباشرة مع خدمة العملاء.
                      </p>
                      <a
                        href={block.content.ctaLink || "https://wa.me/201000000000"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-cta shadow-md transition-all duration-300 hover:scale-105"
                      >
                        <span>{block.content.ctaText || 'تواصل معنا واتساب'}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </section>
            );

          default:
            return null;
        }
      })}
      </div>
    </>
  );
}
