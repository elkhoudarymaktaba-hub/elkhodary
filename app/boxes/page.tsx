import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Package, ArrowLeft, GraduationCap, ChevronLeft } from 'lucide-react';
import { getMockData } from '@/lib/mockData';

export const revalidate = 0; // Fresh data on every load

async function getBoxesData() {
  try {
    const boxesPromise = supabase
      .from('boxes')
      .select('*')
      .eq('is_active', true)
      .order('base_price', { ascending: true });

    const pagePromise = supabase
      .from('pages')
      .select('*')
      .eq('slug', 'packages')
      .limit(1);

    const [boxesRes, pageRes] = await Promise.all([boxesPromise, pagePromise]);

    let pageData = null;
    if (pageRes.data && pageRes.data.length > 0) {
      pageData = pageRes.data[0];
    } else {
      pageData = getMockData.pages().find(p => p.slug === 'packages') || null;
    }

    return {
      boxes: boxesRes.data || [],
      pageData,
    };
  } catch (err) {
    console.error('Error fetching boxes page data:', err);
    return { boxes: [], pageData: null };
  }
}

export async function generateMetadata() {
  const { pageData } = await getBoxesData();
  const heroBlock = pageData?.blocks?.find((b: any) => b.type === 'hero');
  return {
    title: heroBlock?.content?.title || 'الباقات المدرسية الجاهزة حسب المرحلة',
    description: heroBlock?.content?.subtitle || 'تسوق باقات ومستلزمات المدارس الجاهزة والكاملة والمعدّة مسبقاً لكل من رياض الأطفال والابتدائي والإعدادي والثانوي في مصر.',
  };
}

function getStageLabel(stage: string) {
  switch (stage.toLowerCase()) {
    case 'kg': return 'رياض الأطفال';
    case 'primary': return 'المرحلة الابتدائية';
    case 'middle': return 'المرحلة الإعدادية';
    case 'high': return 'المرحلة الثانوية';
    default: return stage;
  }
}

export default async function BoxesPage() {
  const { boxes, pageData } = await getBoxesData();

  const heroBlock = pageData?.blocks?.find((b: any) => b.type === 'hero');
  const pageTitle = heroBlock?.content?.title || 'تسوق حسب المرحلة الدراسية';
  const pageSubtitle = heroBlock?.content?.subtitle || 'اختر المرحلة الدراسية لطفلك ووفر الوقت، نوفر باقات مدروسة بعناية تحتوي على كافة المستلزمات لبدء الدراسة بقوة.';

  const stageStages = [
    { key: 'kg', label: 'رياض الأطفال (KG)', price: '320', desc: 'أقلام تلوين، كراسات رسم ومستلزمات مرحلة الروضة الأولى.', color: 'bg-amber' },
    { key: 'primary', label: 'المرحلة الابتدائية', price: '480', desc: 'كشاكيل مسطرة ومربعات، أقلام رصاص وحبر أساسية.', color: 'bg-emerald-500' },
    { key: 'middle', label: 'المرحلة الإعدادية', price: '620', desc: 'أدوات هندسية، كشاكيل سلك، أقلام تظليل وحبر ملون.', color: 'bg-sage' },
    { key: 'high', label: 'المرحلة الثانوية', price: '780', desc: 'كشاكيل جامعية كبيرة، ورق فلوسكاب، آلة حاسبة وأقلام.', color: 'bg-coral' },
  ];

  return (
    <div className="bg-paper-dark/30 min-h-screen py-12 pt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Page Header (Dynamic from Supabase page builder settings) */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-ink">
            {pageTitle}
          </h1>
          <p className="text-ink-soft/60 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            {pageSubtitle}
          </p>
        </div>



        {/* Available Boxes */}
        <div className="space-y-6 pt-6">
          <div className="border-b border-dashed border-paper-line pb-3">
            <h2 className="text-xl font-extrabold text-ink">الباقات المدرسية الجاهزة المتاحة للطلب</h2>
          </div>

          {boxes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {boxes.map((box, index) => {
                const spineColors = ['bg-sage', 'bg-coral', 'bg-amber', 'bg-ink-soft'];
                const spineColor = spineColors[index % spineColors.length];

                return (
                  <div
                    key={box.id}
                    className="bg-white rounded-card overflow-hidden border border-paper-line shadow-card hover:shadow-brand transition-all duration-300 flex flex-col justify-between relative pl-2 pr-6 transform hover:-translate-y-2 hover:-rotate-[0.6deg]"
                  >
                    {/* Spine */}
                    <div className={`w-3 h-full absolute right-0 top-0 bottom-0 ${spineColor} z-10`} />

                    {/* Spiral Binding Rings */}
                    <div className="absolute right-[8px] top-8 bottom-8 flex flex-col justify-between pointer-events-none z-20">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full border-[1.5px] border-ink bg-paper shadow-sm" />
                      ))}
                    </div>

                    <div className="pr-4 flex flex-col h-full justify-between">
                      <div className="relative h-56 bg-paper-dark/20 rounded-bl-xl overflow-hidden">
                        {box.image ? (
                          <Image
                            src={box.image}
                            alt={box.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                            <Package size={48} />
                          </div>
                        )}
                        <span className="absolute top-4 left-4 bg-white text-ink-soft text-xs font-bold px-3 py-1 rounded-full border border-paper-line">
                          {getStageLabel(box.stage)}
                        </span>
                      </div>

                      <div className="p-5 flex-grow flex flex-col justify-between">
                        <div className="space-y-2">
                          <h3 className="font-extrabold text-base text-ink leading-snug">{box.name}</h3>
                          <p className="text-ink-soft/70 text-xs leading-relaxed line-clamp-2">
                            {box.description || 'باقة متكاملة تحوي أفضل المستلزمات لبدء العام الدراسي بقوة.'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-5 mt-4 border-t border-dashed border-paper-line">
                          <div className="font-numbers">
                            <span className="block text-[9px] text-ink-soft/40 font-cairo font-bold">سعر الباقة الأساسي</span>
                            <span className="text-coral-deep font-extrabold text-lg">
                              {box.base_price} <span className="text-xs font-cairo font-normal text-ink-soft">ج.م</span>
                            </span>
                          </div>

                          <Link
                            href={`/boxes/${box.id}`}
                            className="py-2 px-5 bg-coral hover:bg-coral-deep text-white font-bold text-xs rounded-cta transition-colors flex items-center gap-1 shadow-md shadow-coral/10"
                          >
                            <span>عرض وتعديل</span>
                            <ArrowLeft size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-card border border-paper-line p-16 text-center shadow-card max-w-lg mx-auto">
              <Package size={48} className="mx-auto text-ink-soft/20 mb-4 animate-pulse" />
              <p className="text-ink-soft/60 text-xs">لا تتوفر باقات جاهزة في قاعدة البيانات حالياً. ترقبوا انطلاق باقاتنا المدرسية قريباً!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
