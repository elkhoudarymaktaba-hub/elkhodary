import { supabase } from '@/lib/supabase';
import { BookOpen, PhoneCall, Mail, MapPin, Clock, ArrowLeft, Package, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getMockData } from '@/lib/mockData';

export const revalidate = 0; // Fresh data on every load

async function getAboutData() {
  try {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', 'about')
      .single();

    if (error) return null;
    return data;
  } catch (e) {
    return null;
  }
}

async function getBoxes() {
  try {
    const { data } = await supabase.from('boxes').select('*').eq('is_active', true);
    return data || [];
  } catch (e) {
    return [];
  }
}

export const metadata = {
  title: 'من نحن - مسيرتنا وقيمنا',
  description: 'تعرف على قصة مكتبة الخضري، قيمنا، ورؤيتنا في تيسير العملية التعليمية للطلاب في مصر.',
};

function getStageLabel(stage: string) {
  switch (stage.toLowerCase()) {
    case 'kg': return 'رياض الأطفال';
    case 'primary': return 'المرحلة الابتدائية';
    case 'middle': return 'المرحلة الإعدادية';
    case 'high': return 'المرحلة الثانوية';
    default: return stage;
  }
}

export default async function AboutPage() {
  const dbData = await getAboutData();
  const mockPages = getMockData.pages();
  const pageData = dbData || mockPages.find(p => p.slug === 'about');
  const boxes = await getBoxes();

  return (
    <div className="bg-paper-dark/30 min-h-screen py-16 pt-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Card Wrapper */}
        <div className="bg-white rounded-notebook shadow-brand border border-paper-line p-6 sm:p-10 md:p-12 space-y-12 relative overflow-hidden">
          
          {pageData?.blocks && pageData.blocks.map((block: any) => {
            switch (block.type) {
              case 'about_header':
                return (
                  <div key={block.id} className="text-center border-b border-dashed border-paper-line pb-6">
                    <div className="w-12 h-12 bg-coral/10 rounded-full flex items-center justify-center text-coral-deep mx-auto mb-4 border border-coral/10">
                      <BookOpen size={22} />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-ink">
                      {block.content.title || 'من نحن'}
                    </h1>
                    {block.content.subtitle && (
                      <p className="text-ink-soft/50 text-xs mt-1.5 font-bold">{block.content.subtitle}</p>
                    )}
                  </div>
                );

              case 'hero':
                return (
                  <div key={block.id} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-right py-6 border-b border-dashed border-paper-line" dir="rtl">
                    <div className="lg:col-span-7 space-y-4">
                      <div className="inline-flex items-center gap-2 bg-paper border px-3 py-1 rounded-full text-[10px] font-bold text-ink-soft">
                        <span className="w-1.5 h-1.5 rounded-full bg-sage" />
                        <span>مكتبة الخضري</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-ink leading-tight">
                        {block.content.title}
                      </h2>
                      <p className="text-sm text-ink-soft/85 leading-relaxed font-medium">
                        {block.content.subtitle}
                      </p>
                      {block.content.ctaText && (
                        <div className="pt-2">
                          <Link
                            href={block.content.ctaLink || '/boxes'}
                            className="inline-block px-6 py-2.5 bg-coral hover:bg-coral-deep text-white font-bold text-xs rounded-cta transition-colors shadow-sm"
                          >
                            {block.content.ctaText}
                          </Link>
                        </div>
                      )}
                    </div>
                    {block.content.imageUrl && (
                      <div className="lg:col-span-5 relative aspect-[4/3] rounded-2xl overflow-hidden border shadow-sm">
                        <img src={block.content.imageUrl} alt={block.content.title || 'من نحن'} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                );

              case 'about_story':
                return (
                  <div key={block.id} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center border-b border-dashed border-paper-line pb-8">
                    <div className="lg:col-span-7 space-y-4 text-right" dir="rtl">
                      {block.content.title && (
                        <h2 className="text-xl sm:text-2xl font-black text-ink">{block.content.title}</h2>
                      )}
                      {block.content.text1 && (
                        <p className="text-ink-soft/75 text-sm sm:text-base leading-relaxed font-medium">
                          {block.content.text1}
                        </p>
                      )}
                      {block.content.text2 && (
                        <p className="text-ink-soft/75 text-sm sm:text-base leading-relaxed font-medium">
                          {block.content.text2}
                        </p>
                      )}
                    </div>
                    <div className="lg:col-span-5 relative aspect-square rounded-2xl overflow-hidden bg-paper border border-paper-line shadow-card">
                      <Image
                        src={block.content.imageUrl || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80"}
                        alt={block.content.title || "قصة نجاح مكتبة الخضري"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                );

              case 'mixed':
                return (
                  <div key={block.id} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-right py-6 border-b border-dashed border-paper-line" dir="rtl">
                    <div className={`space-y-4 ${block.content.align === 'left' ? 'md:order-2' : ''}`}>
                      {block.content.title && (
                        <h3 className="text-xl sm:text-2xl font-black text-ink">{block.content.title}</h3>
                      )}
                      <p className="text-ink-soft/85 text-xs sm:text-sm leading-relaxed font-medium font-arabic">
                        {block.content.text}
                      </p>
                    </div>
                    {block.content.imageUrl && (
                      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-card border border-paper-line bg-paper-dark/10">
                        <img src={block.content.imageUrl} alt={block.content.title || 'Mixed block'} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                );

              case 'stats':
                return (
                  <div key={block.id} className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-dashed border-paper-line text-center">
                    <div className="flex items-center gap-4 justify-center">
                      <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center text-sage-deep shrink-0 border border-sage/10">
                        <span className="text-lg">{block.content.stat1_emoji || '🎓'}</span>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <h4 className="font-extrabold text-sm text-ink">{block.content.stat1_number || '+2000'}</h4>
                        <p className="text-ink-soft/50 text-[10px]">{block.content.stat1_label || 'طالب سعيد'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 justify-center md:border-r border-paper-line md:pr-6">
                      <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center text-coral-deep shrink-0 border border-coral/10">
                        <span className="text-lg">{block.content.stat2_emoji || '🚚'}</span>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <h4 className="font-extrabold text-sm text-ink">{block.content.stat2_number || 'شحن سريع'}</h4>
                        <p className="text-ink-soft/50 text-[10px]">{block.content.stat2_label || 'توصيل لباب المنزل'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 justify-center md:border-r border-paper-line md:pr-6">
                      <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center text-amber-deep shrink-0 border border-amber/10">
                        <span className="text-lg">{block.content.stat3_emoji || '🛡️'}</span>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <h4 className="font-extrabold text-sm text-ink">{block.content.stat3_number || 'ضمان الجودة'}</h4>
                        <p className="text-ink-soft/50 text-[10px]">{block.content.stat3_label || 'منتجات متينة'}</p>
                      </div>
                    </div>
                  </div>
                );

              case 'about_values':
                return (
                  <div key={block.id} className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-right" dir="rtl">
                    {/* Card 1 */}
                    <div className="bg-paper-dark/40 p-6 rounded-card border border-paper-line space-y-3">
                      <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center text-sage-deep shrink-0 border border-sage/10 text-lg">
                        {block.content.card1_emoji || '🎯'}
                      </div>
                      <h3 className="font-extrabold text-ink text-sm sm:text-base">{block.content.card1_title || 'رسالتنا'}</h3>
                      <p className="text-ink-soft/70 text-xs leading-relaxed font-medium">
                        {block.content.card1_text}
                      </p>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-paper-dark/40 p-6 rounded-card border border-paper-line space-y-3">
                      <div className="w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center text-coral-deep shrink-0 border border-coral/10 text-lg">
                        {block.content.card2_emoji || '🏆'}
                      </div>
                      <h3 className="font-extrabold text-ink text-sm sm:text-base">{block.content.card2_title || 'رؤيتنا'}</h3>
                      <p className="text-ink-soft/70 text-xs leading-relaxed font-medium">
                        {block.content.card2_text}
                      </p>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-paper-dark/40 p-6 rounded-card border border-paper-line space-y-3">
                      <div className="w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center text-amber-deep shrink-0 border border-amber/10 text-lg">
                        {block.content.card3_emoji || '⏳'}
                      </div>
                      <h3 className="font-extrabold text-ink text-sm sm:text-base">{block.content.card3_title || 'تاريخنا'}</h3>
                      <p className="text-ink-soft/70 text-xs leading-relaxed font-medium">
                        {block.content.card3_text}
                      </p>
                    </div>
                  </div>
                );

              case 'packages_section':
                const displayedBoxes = Array.isArray(block.content.boxIds) && block.content.boxIds.length > 0
                  ? block.content.boxIds.map((id: string) => boxes.find((b: any) => b.id === id)).filter(Boolean)
                  : boxes;
                return (
                  <div key={block.id} className="py-6 border-b border-dashed border-paper-line text-right" dir="rtl">
                    <h3 className="text-xl font-black text-ink mb-2">{block.content.title || 'باقات المراحل الدراسية'}</h3>
                    <p className="text-ink-soft/60 text-xs mb-6">{block.content.subtitle}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {displayedBoxes.map((box: any, index: number) => {
                        const spineColors = ['bg-sage', 'bg-coral', 'bg-amber', 'bg-ink-soft'];
                        const spineColor = spineColors[index % spineColors.length];
                        return (
                          <div key={box.id} className="bg-white rounded-card overflow-hidden shadow-card border border-paper-line flex flex-col justify-between relative">
                            <div className="relative h-32 bg-paper-dark/10">
                              {box.image || box.image_url ? (
                                <img src={box.image || box.image_url} alt={box.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-300">📦</div>
                              )}
                            </div>
                            <div className="p-4 flex-grow flex flex-col justify-between">
                              <h4 className="font-extrabold text-xs sm:text-sm text-ink mb-1 truncate">{box.name}</h4>
                              <p className="text-[10px] text-ink-soft/60 line-clamp-2 leading-relaxed mb-3">{box.description}</p>
                              <div className="flex items-center justify-between border-t border-dashed pt-2.5">
                                <span className="text-xs font-black text-coral">{box.base_price} ج.م</span>
                                <Link href={`/boxes/${box.id}`} className="px-2.5 py-1 bg-amber text-ink font-bold text-[10px] rounded-cta">
                                  عرض الباقة
                                </Link>
                              </div>
                            </div>
                            <div className={`absolute top-0 left-0 w-1 h-full ${spineColor}`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );

              case 'text':
                return (
                  <div key={block.id} className="py-6 border-b border-dashed border-paper-line text-right">
                    <div 
                      className="text-ink-soft/80 text-xs sm:text-sm leading-relaxed font-medium font-arabic"
                      dangerouslySetInnerHTML={{ __html: block.content.text || '' }}
                    />
                  </div>
                );

              case 'image':
                return (
                  <div key={block.id} className="py-6 border-b border-dashed border-paper-line">
                    {block.content.imageUrl && (
                      <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden border border-paper-line shadow-sm bg-white">
                        <img src={block.content.imageUrl} alt={block.content.caption || 'Image block'} className="w-full h-full object-cover" />
                      </div>
                    )}
                    {block.content.caption && (
                      <p className="text-center text-[10px] text-ink-soft/50 mt-2 font-arabic">{block.content.caption}</p>
                    )}
                  </div>
                );

              default:
                return null;
            }
          })}

        </div>

      </div>
    </div>
  );
}
