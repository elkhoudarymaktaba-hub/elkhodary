import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { supabase, cachedFetch } from '@/lib/supabase';
import ProductCard from '@/components/store/product-card';
import HeroCardWidget from '@/components/store/hero-card-widget';
import BoxBuilderTeaser from '@/components/store/box-builder-teaser';
import { Package, ArrowLeft, GraduationCap, ChevronLeft } from 'lucide-react';
import { PageBlock, getMockData } from '@/lib/mockData';

export const revalidate = 1; // Cache custom pages and revalidate every 1 second

async function getPageData(slug: string) {
  return cachedFetch(`page-data-${slug}`, async () => {
    try {
      const { data: pageData } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .limit(1);

      const dbPage = pageData && pageData.length > 0 ? pageData[0] : null;
      const mockPage = getMockData.pages().find(p => p.slug.toLowerCase() === slug.toLowerCase());

      let useMock = !dbPage;
      if (dbPage && mockPage) {
        const dbTime = dbPage.updated_at ? new Date(dbPage.updated_at).getTime() : 0;
        const mockTime = mockPage.updated_at ? new Date(mockPage.updated_at).getTime() : 0;
        if (mockTime > dbTime) {
          useMock = true;
        }
      }

      return useMock ? mockPage : dbPage;
    } catch (error) {
      console.error('Error fetching dynamic page data:', error);
      return null;
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
  const isGrid = block.content.layout !== 'scroll';

  return (
    <section className="py-16 bg-transparent border-b border-paper-line reveal">
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
            <div className="flex sm:grid gap-6 overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 no-scrollbar snap-x" dir="rtl">
              {products.map((product: any) => (
                <div key={product.id} className="min-w-[270px] sm:min-w-0 snap-start shrink-0">
                  <ProductCard product={product as any} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x" dir="rtl">
              {products.map((product: any) => (
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

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps) {
  const pageData = await getPageData(params.slug);
  if (!pageData) return { title: 'الصفحة غير موجودة' };
  return {
    title: pageData.title,
    description: `مكتبة الخضري - صفحة ${pageData.title}`,
  };
}

export default async function DynamicCustomPage({ params }: PageProps) {
  const pageData = await getPageData(params.slug);

  if (!pageData) {
    notFound();
  }

  // Pre-fetch support lists for hero card rendering
  const { data: boxesData } = await supabase.from('boxes').select('*').eq('is_active', true);
  const { data: productsData } = await supabase.from('products').select('*, categories(name)').eq('is_active', true);
  const boxes = boxesData || [];
  const products = productsData || [];

  const blocks = (pageData.blocks || []).sort((a: any, b: any) => a.order - b.order);

  const getStageLabel = (stage: string) => {
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('kh_custom_stages');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          const found = parsed.find((s: any) => s.value === stage);
          if (found) return found.label;
        } catch (e) {
          console.error(e);
        }
      }
    }
    switch (stage.toLowerCase()) {
      case 'kg': return 'رياض الأطفال';
      case 'primary': return 'المرحلة الابتدائية';
      case 'middle': return 'المرحلة الإعدادية';
      case 'high': return 'المرحلة الثانوية';
      default: return stage;
    }
  };

  return (
    <div className="bg-paper min-h-screen pt-20">
      {blocks.map((block: PageBlock) => {
        switch (block.type) {
          case 'hero': {
            let currentHeroCardData = null;
            if (block.content.media_type === 'product' && block.content.selected_id) {
              const p = products.find((prod: any) => prod.id === block.content.selected_id);
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
              <section key={block.id} className="relative overflow-hidden pt-[160px] pb-16 sm:pt-28 lg:pt-36 lg:pb-24 bg-notebook-lines border-b border-paper-line text-right">
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-amber/5 rounded-full blur-[140px] pointer-events-none z-10" />
                <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-coral/5 rounded-full blur-[100px] pointer-events-none z-10" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Right: Text content */}
                    <div className="lg:col-span-7 space-y-6 text-center lg:text-right">
                      <div className="inline-flex items-center gap-2.5 bg-white border border-paper-line text-ink-soft text-xs font-bold px-4 py-2 rounded-full shadow-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-sage blink shrink-0" />
                        <span>{block.content.badge_text || 'مكتبة الخضري'}</span>
                      </div>
                      
                      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-ink leading-tight animate-rise">
                        {block.content.title ? (
                          <>
                            {block.content.title.split(' ')[0]} <br />
                            <span className="highlighter text-coral font-black">{block.content.title.split(' ').slice(1).join(' ')}</span>
                          </>
                        ) : (
                          <>
                            بوابة التعليم <br />
                            <span className="highlighter text-coral font-black">والمعرفة المتكاملة</span>
                          </>
                        )}
                      </h1>
                      
                      <p className="text-ink-soft/75 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                        {block.content.subtitle}
                      </p>

                      <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                        {block.content.ctaText && (
                          <Link
                            href={block.content.ctaLink || "/boxes"}
                            className="w-full sm:w-auto px-8 py-4 bg-coral hover:bg-coral-deep text-white font-bold text-sm rounded-cta text-center transition-all duration-300 shadow-glow hover:scale-105"
                          >
                            {block.content.ctaText}
                          </Link>
                        )}
                        {block.content.cta2Text && (
                          <Link
                            href={block.content.cta2Link || "/boxes"}
                            className="w-full sm:w-auto px-8 py-4 bg-white text-ink border border-paper-line hover:border-ink font-bold text-sm rounded-cta text-center transition-all duration-300 hover:bg-paper-dark hover:scale-105"
                          >
                            {block.content.cta2Text}
                          </Link>
                        )}
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
                      currentHeroCardData && <HeroCardWidget initialData={currentHeroCardData} />
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
                    <div className="flex items-center gap-4 justify-center md:justify-start">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 shadow-inner border border-white/10">
                        <span className="text-xl">{block.content.stat1_emoji || '🎓'}</span>
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-black text-lg text-amber font-numbers">{block.content.stat1_number || '+2000'}</h4>
                        <p className="text-white/80 text-xs font-bold font-arabic">{block.content.stat1_label || 'طالب سعيد'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 justify-center md:border-r border-white/10 md:pr-8">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 shadow-inner border border-white/10">
                        <span className="text-xl">{block.content.stat2_emoji || '🚚'}</span>
                      </div>
                      <div className="space-y-0.5 animate-in fade-in duration-300 delay-150">
                        <h4 className="font-black text-lg text-amber font-numbers">{block.content.stat2_number || '24 ساعة'}</h4>
                        <p className="text-white/80 text-xs font-bold font-arabic">{block.content.stat2_label || 'شحن سريع'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 justify-center md:border-r border-white/10 md:pr-8">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 shadow-inner border border-white/10">
                        <span className="text-xl">{block.content.stat3_emoji || '⭐'}</span>
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-black text-lg text-amber font-numbers">{block.content.stat3_number || '4.9'}</h4>
                        <p className="text-white/80 text-xs font-bold font-arabic">{block.content.stat3_label || 'تقييم ممتاز'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );

          case 'packages_section':
            return (
              <section key={block.id} className="py-16 bg-transparent border-b border-paper-line reveal animate-in fade-in duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                  <div className="flex items-end justify-between border-b border-dashed border-paper-line pb-6">
                    <div className="space-y-2 text-right" dir="rtl">
                      <h2 className="text-2xl sm:text-3xl font-black text-ink">
                        {block.content.title}
                      </h2>
                      <p className="text-ink-soft/60 text-xs sm:text-sm max-w-lg leading-relaxed">
                        {block.content.subtitle}
                      </p>
                    </div>
                    {block.content.ctaText && (
                      <Link
                        href={block.content.ctaLink || "/boxes"}
                        className="flex items-center gap-1 text-coral font-bold text-xs hover:text-coral-deep transition-colors"
                      >
                        <span>{block.content.ctaText || 'عرض كل الصناديق'}</span>
                        <ArrowLeft size={14} />
                      </Link>
                    )}
                  </div>

                  {(() => {
                    const displayedBoxes = Array.isArray(block.content.boxIds) && block.content.boxIds.length > 0
                      ? block.content.boxIds
                          .map((id: any) => boxes.find((b: any) => b.id === id))
                          .filter(Boolean)
                      : boxes;

                    return displayedBoxes.length > 0 ? (
                      <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x">
                        {displayedBoxes.map((box: any, index: number) => {
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
                                    <div className="flex flex-col font-numbers">
                                      <span className="text-[10px] text-ink-soft/50 font-bold font-cairo">سعر الصندوق كامل</span>
                                      <span className="text-base sm:text-lg font-black text-coral">
                                        {box.base_price} <span className="text-xs font-bold text-ink-soft font-cairo">ج.م</span>
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
                    ) : null;
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
              <section key={block.id} className="py-12 bg-transparent border-b border-paper-line reveal">
                <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
                  {block.content.title && (
                    <h3 className="text-xl sm:text-2xl font-black text-ink">{block.content.title}</h3>
                  )}
                  <div 
                    className="text-ink-soft/80 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto font-medium font-arabic text-right"
                    dangerouslySetInnerHTML={{ __html: block.content.text || '' }}
                  />
                </div>
              </section>
            );

          case 'image':
            return (
              <section key={block.id} className="py-12 bg-transparent reveal">
                <div className="max-w-5xl mx-auto px-4">
                  {block.content.imageUrl && (
                    <div className="relative aspect-video rounded-[32px] overflow-hidden border border-paper-line bg-white shadow-brand max-w-3xl mx-auto">
                      <img src={block.content.imageUrl} alt="Page section" className="w-full h-full object-cover" />
                      {block.content.caption && (
                        <p className="absolute bottom-4 left-4 right-4 bg-ink/75 text-white text-xs px-4 py-2 rounded-xl backdrop-blur-sm text-center font-arabic">{block.content.caption}</p>
                      )}
                    </div>
                  )}
                </div>
              </section>
            );

          case 'mixed':
            const isImgRight = block.content.align === 'right';
            return (
              <section key={block.id} className="py-16 bg-transparent border-b border-paper-line reveal">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${isImgRight ? 'lg:flex-row-reverse' : ''}`}>
                    <div className="space-y-6 text-right">
                      {block.content.title && <h2 className="text-2xl sm:text-3xl font-black text-ink">{block.content.title}</h2>}
                      <p className="text-ink-soft/80 text-sm leading-relaxed font-medium font-arabic">{block.content.text}</p>
                    </div>
                    {block.content.imageUrl && (
                      <div className="relative aspect-[4/3] rounded-[24px] overflow-hidden border border-paper-line shadow-brand">
                        <img src={block.content.imageUrl} alt="mixed panel" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );

          case 'contact_section':
            return (
              <section key={block.id} className="py-16 bg-white border-b border-paper-line reveal">
                <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
                  <h3 className="text-2xl font-black text-ink">بيانات التواصل والاستفسارات</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-right font-arabic">
                    <div className="bg-paper p-6 rounded-card border border-paper-line">
                      <p className="font-bold text-ink">📞 الخط الساخن:</p>
                      <p className="text-coral font-bold mt-1 font-numbers">{block.content.phone || '19000'}</p>
                    </div>
                    <div className="bg-paper p-6 rounded-card border border-paper-line">
                      <p className="font-bold text-ink">✉️ البريد الإلكتروني:</p>
                      <p className="text-sage-deep font-bold mt-1 font-numbers">{block.content.email || 'info@alkhodary.eg'}</p>
                    </div>
                    <div className="bg-paper p-6 rounded-card border border-paper-line">
                      <p className="font-bold text-ink">📍 المقر الرئيسي:</p>
                      <p className="text-ink-soft mt-1">{block.content.address || 'القاهرة، جمهورية مصر العربية'}</p>
                    </div>
                  </div>
                  {block.content.ctaText && (
                    <div className="pt-4">
                      <a
                        href={block.content.ctaLink || '#'}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-cta transition-colors shadow-lg"
                      >
                        <span>{block.content.ctaText}</span>
                      </a>
                    </div>
                  )}
                </div>
              </section>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
