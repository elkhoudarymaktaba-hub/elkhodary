'use client';

import React, { useState, useEffect } from 'react';
import { Star, Check, X, Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/lib/toast';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
  city?: string;
  is_verified?: boolean;
}

interface TestimonialsSectionProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  reviews?: Review[];
}

export default function TestimonialsSection({ title: propTitle, subtitle: propSubtitle, ctaText: propCtaText, reviews: propReviews }: TestimonialsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (propReviews && propReviews.length > 0) {
      setReviews(propReviews);
    } else {
      fetchGlobalReviews();
    }
  }, [propReviews]);

  const fetchGlobalReviews = async () => {
    try {
      // Fetch top 5-star reviews from Supabase
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('rating', 5)
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (!error && data && data.length > 0) {
        setReviews(data.slice(0, 3));
        return;
      }
    } catch (e) {
      console.error(e);
    }

    // Fallback: LocalStorage
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('kh_reviews');
      let allReviews = [];
      if (local) {
        try {
          allReviews = JSON.parse(local);
        } catch (e) {
          console.error(e);
        }
      }

      const topReviews = allReviews.filter((r: any) => r.rating === 5);
      
      if (topReviews.length === 0) {
        const defaultMock = [
          {
            id: 't-1',
            customer_name: 'مريم محمود',
            city: 'الإسكندرية',
            rating: 5,
            comment: 'الباقة المدرسية تجنن والتفاصيل والفرز نظيفة جداً. الأدوات جودتها عالية والشغل يستاهل كل قرش بجد.',
            created_at: new Date().toISOString(),
            is_verified: true
          },
          {
            id: 't-2',
            customer_name: 'سارة محمد',
            city: 'القاهرة',
            rating: 5,
            comment: 'طلبت الكتب المدرسية والمستلزمات، خامات ممتازة وتغليف فاخر ومنسق جداً، والتوصيل سريع لباب البيت.',
            created_at: new Date().toISOString(),
            is_verified: true
          },
          {
            id: 't-3',
            customer_name: 'ندى أحمد',
            city: 'دمياط',
            rating: 5,
            comment: 'الهدية كانت لابني في أول يوم دراسي، ملامحه وهو بيفتح العلبة وتفاصيل الأدوات لا تُقدر بثمن، متشكرة جداً.',
            created_at: new Date().toISOString(),
            is_verified: true
          }
        ];
        localStorage.setItem('kh_reviews', JSON.stringify([...allReviews, ...defaultMock]));
        setReviews(defaultMock);
      } else {
        setReviews(topReviews.slice(0, 3));
      }
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;
    setSubmitting(true);

    const newReview = {
      id: `rev-${Date.now()}`,
      product_id: 'global',
      product_name: 'المتجر العام',
      customer_name: name,
      city: city || 'مصر',
      rating: rating,
      comment: comment,
      created_at: new Date().toISOString(),
      is_verified: true
    };

    try {
      await supabase.from('reviews').insert([newReview]);
    } catch (e) {
      console.error(e);
    }

    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('kh_reviews');
      let allReviews = [];
      if (local) {
        try {
          allReviews = JSON.parse(local);
        } catch (e) {
          console.error(e);
        }
      }
      allReviews.unshift(newReview);
      localStorage.setItem('kh_reviews', JSON.stringify(allReviews));
    }

    setReviews(prev => [newReview, ...prev.slice(0, 2)]);
    setIsModalOpen(false);
    setName('');
    setCity('');
    setRating(5);
    setComment('');
    setSubmitting(false);
    showToast('شكراً لمشاركتنا تجربتك الجميلة!', 'success');
  };

  return (
    <section className="py-16 bg-white border-b border-paper-line overflow-hidden text-center" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="space-y-3">
          <span className="text-ink-soft font-extrabold text-xs sm:text-sm tracking-wider block font-arabic">
            {propSubtitle || 'قالوا عن مكتبة الخضري'}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-ink flex items-center justify-center gap-2 font-arabic">
            <span>{propTitle || 'آراء عائلتنا الدافئة 🎓'}</span>
          </h2>
          
          <div className="pt-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-ink-soft hover:bg-ink text-white font-extrabold text-xs sm:text-sm rounded-full transition-all duration-300 shadow-md shadow-ink-soft/15 hover:scale-[1.02] active:scale-95 font-arabic"
            >
              <span>{propCtaText || 'شاركينا تقييمك وتجربتك معنا ✍️'}</span>
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="flex md:grid overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 gap-6 pt-4 md:grid-cols-3 no-scrollbar snap-x" dir="rtl">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-card border border-paper-line p-6 shadow-card hover:border-ink-soft/40 hover:shadow-brand transition-all duration-300 flex flex-col justify-between text-right relative overflow-hidden group hover:-translate-y-1.5 w-[85vw] max-w-[320px] md:w-auto snap-start shrink-0"
            >
              {/* Quote Mark Watermark */}
              <span className="absolute -top-3 -right-2 text-paper-line/30 font-serif text-[120px] select-none pointer-events-none group-hover:text-ink-soft/10 transition-colors duration-300 leading-none">
                “
              </span>

              <div className="space-y-4 relative z-10">
                {/* Stars */}
                <div className="flex gap-0.5 justify-start">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <svg
                      key={idx}
                      className={`w-4 h-4 ${idx < rev.rating ? 'text-ink-soft fill-ink-soft' : 'text-paper-line'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                {/* Comment */}
                <p className="text-xs sm:text-sm text-ink-soft/90 leading-relaxed font-tajawal font-medium min-h-[64px]">
                  {rev.comment}
                </p>
              </div>

              {/* Footer */}
              <div className="border-t border-paper-line pt-4 mt-6 flex items-center justify-between z-10 relative">
                <div className="text-right">
                  <span className="font-extrabold text-xs text-ink block font-arabic">{rev.customer_name}</span>
                  {rev.city && (
                    <span className="text-[10px] text-ink/50 block font-tajawal font-bold mt-0.5">{rev.city}</span>
                  )}
                </div>
                
                <span className="text-ink-soft hover:scale-110 active:scale-90 transition-transform cursor-pointer">
                  <Heart className="w-4.5 h-4.5 fill-current" />
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* 📥 Modal Write Review */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0A1931]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in text-right">
          <div className="bg-white rounded-card border border-paper-line shadow-brand max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-paper-line flex items-center justify-between">
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-ink transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-black text-sm sm:text-base text-ink font-arabic">شاركينا تجربتك ورأيك 🎓</h3>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 font-arabic">الاسم الكريم:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أميرة أحمد"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-paper-line rounded-xl text-xs font-arabic bg-white text-right focus:outline-none focus:border-ink-soft"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 font-arabic">المحافظة / المدينة:</label>
                <input
                  type="text"
                  placeholder="مثال: القاهرة"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-paper-line rounded-xl text-xs font-arabic bg-white text-right focus:outline-none focus:border-ink-soft"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 font-arabic">درجة التقييم والنجوم:</label>
                <div className="flex gap-1.5 justify-end py-1" dir="ltr">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const val = idx + 1;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRating(val)}
                        className="p-0.5 text-slate-300 hover:scale-110 transition-transform"
                      >
                        <svg
                          className={`w-7 h-7 ${val <= rating ? 'text-ink-soft fill-ink-soft' : 'text-slate-200'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 font-arabic">تجربتك ورأيك بالتفصيل:</label>
                <textarea
                  required
                  rows={3}
                  placeholder="اكتب تجربتك الصادقة وملاحظاتك معنا..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-3.5 border border-paper-line rounded-xl text-xs font-arabic bg-white text-right focus:outline-none focus:border-ink-soft resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-ink-soft hover:bg-ink text-white font-extrabold text-xs rounded-xl shadow-md transition-all font-arabic"
                >
                  {submitting ? 'جاري الإرسال...' : 'إرسال التقييم 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
