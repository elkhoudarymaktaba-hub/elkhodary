'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getMockData } from '@/lib/mockData';
import { Mail, PhoneCall, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [pageData, setPageData] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const { data } = await supabase
          .from('pages')
          .select('*')
          .eq('slug', 'contact')
          .single();
        if (data) {
          setPageData(data);
        } else {
          const mockPages = getMockData.pages();
          setPageData(mockPages.find((p) => p.slug === 'contact'));
        }
      } catch (e) {
        const mockPages = getMockData.pages();
        setPageData(mockPages.find((p) => p.slug === 'contact'));
      }
    };
    fetchPageData();
  }, []);

  const contactBlock = pageData?.blocks?.find((b: any) => b.type === 'contact_section');
  const headerBlock = pageData?.blocks?.find((b: any) => b.type === 'hero' || b.type === 'about_header' || b.type === 'contact_header');

  const pageTitle = headerBlock?.content?.title || 'تواصل معنا';
  const pageSubtitle = headerBlock?.content?.subtitle || 'يسعدنا استقبال استفساراتكم واقتراحاتكم. تواصلوا معنا عبر الاستمارة وسنقوم بالرد عليكم في أسرع وقت.';

  const contactPhone = contactBlock?.content?.phone || '19000';
  const contactEmail = contactBlock?.content?.email || 'info@alkhodary.eg';
  const contactAddress = contactBlock?.content?.address || 'القاهرة، جمهورية مصر العربية';
  const contactWorkHours = contactBlock?.content?.work_hours || 'يومياً من 9:00 ص إلى 10:00 م';
  const contactPhoneSubtext = contactBlock?.content?.phone_subtext || 'متاح طوال ساعات العمل للمكالمات السريعة.';
  const contactEmailSubtext = contactBlock?.content?.email_subtext || 'للمراسلات العامة والاستفسارات التجارية.';
  const contactAddressSubtext = contactBlock?.content?.address_subtext || 'يخدم المقر كافة عمليات الشحن والتعبئة.';
  const contactWorkHoursSubtext = contactBlock?.content?.work_hours_subtext || 'ما عدا يوم الجمعة والعطلات الرسمية.';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError('يرجى كتابة الاسم بالكامل');
    if (!phone.trim()) return setError('يرجى كتابة رقم التليفون للتواصل');
    if (!message.trim()) return setError('يرجى كتابة نص الرسالة');

    setLoading(true);

    try {
      const { error: insertError } = await supabase
        .from('contact_submissions')
        .insert({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          message: message.trim(),
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      console.error('Error inserting contact submission:', err);
      setError('حدث خطأ أثناء إرسال رسالتك. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-paper-dark/30 min-h-screen py-16 pt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Page Header */}
        <div className="text-center space-y-1.5">
          <h1 className="text-3xl font-black text-ink text-center">{pageTitle}</h1>
          <p className="text-ink-soft/60 text-xs sm:text-sm max-w-lg mx-auto text-center">
            {pageSubtitle}
          </p>
        </div>

        {/* 2-Column layout: Info Cards & Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Info cards */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-6 order-2 lg:order-1">
            
            {/* Hotline */}
            <div className="bg-white rounded-card p-6 border border-paper-line shadow-card flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-sage/10 flex items-center justify-center text-sage-deep shrink-0 border border-sage/10">
                <PhoneCall size={20} />
              </div>
              <div className="space-y-1 text-right w-full" dir="rtl">
                <h4 className="font-extrabold text-xs text-ink-soft/50 font-cairo">الخط الساخن</h4>
                <a href={`tel:${contactPhone}`} className="text-lg font-black text-coral-deep hover:underline font-numbers block">
                  {contactPhone}
                </a>
                <p className="text-ink-soft/40 text-[10px] font-bold">{contactPhoneSubtext}</p>
              </div>
            </div>

            {/* Email */}
            <div className="bg-white rounded-card p-6 border border-paper-line shadow-card flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-coral/10 flex items-center justify-center text-coral-deep shrink-0 border border-coral/10">
                <Mail size={20} />
              </div>
              <div className="space-y-1 text-right w-full" dir="rtl">
                <h4 className="font-extrabold text-xs text-ink-soft/50 font-cairo">البريد الإلكتروني</h4>
                <a href={`mailto:${contactEmail}`} className="text-sm font-bold text-sage-deep hover:underline font-numbers block">
                  {contactEmail}
                </a>
                <p className="text-ink-soft/40 text-[10px] font-bold">{contactEmailSubtext}</p>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-card p-6 border border-paper-line shadow-card flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber/10 flex items-center justify-center text-amber-deep shrink-0 border border-amber/10">
                <MapPin size={20} />
              </div>
              <div className="space-y-1 text-right w-full" dir="rtl">
                <h4 className="font-extrabold text-xs text-ink-soft/50 font-cairo">المقر الرئيسي</h4>
                <p className="text-sm text-ink-soft font-bold">{contactAddress}</p>
                <p className="text-ink-soft/40 text-[10px] font-bold">{contactAddressSubtext}</p>
              </div>
            </div>

            {/* Hours */}
            <div className="bg-white rounded-card p-6 border border-paper-line shadow-card flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-paper flex items-center justify-center text-ink-soft shrink-0 border border-paper-line">
                <Clock size={20} />
              </div>
              <div className="space-y-1 text-right w-full" dir="rtl">
                <h4 className="font-extrabold text-xs text-ink-soft/50 font-cairo">مواعيد العمل الرسمية</h4>
                <p className="text-sm text-ink-soft font-bold">{contactWorkHours}</p>
                <p className="text-ink-soft/40 text-[10px] font-bold">{contactWorkHoursSubtext}</p>
              </div>
            </div>

          </div>

          {/* Form */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="bg-white rounded-card shadow-card border border-paper-line p-4 sm:p-8">
              <h2 className="font-extrabold text-xl text-ink mb-6 text-right">
                {contactBlock?.content?.form_title || 'أرسل لنا رسالة'}
              </h2>

              {success ? (
                <div className="text-center py-8 space-y-4 animate-fade-in-up">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="font-extrabold text-lg text-ink">تم إرسال رسالتك بنجاح!</h3>
                  <p className="text-ink-soft/70 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed font-medium">
                    شكراً لتواصلك معنا. سنقوم بمراجعة رسالتك والتواصل معك في أقرب فرصة عبر رقم الهاتف أو البريد الإلكتروني.
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="px-6 py-2 bg-paper border border-paper-line hover:border-coral text-ink-soft font-bold text-xs rounded-cta transition-colors"
                  >
                    إرسال رسالة أخرى
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name */}
                  <div>
                    <label htmlFor="contact_name" className="block text-xs font-extrabold text-ink-soft/75 mb-2 text-right">
                      {contactBlock?.content?.name_label || 'الاسم بالكامل *'}
                    </label>
                    <input
                      id="contact_name"
                      type="text"
                      required
                      placeholder="اكتب اسمك هنا..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-paper rounded-input border border-paper-line focus:outline-none focus:border-amber text-sm font-bold text-right"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="contact_phone" className="block text-xs font-extrabold text-ink-soft/75 mb-2 text-right">
                      {contactBlock?.content?.phone_label || 'رقم التليفون للتواصل *'}
                    </label>
                    <input
                      id="contact_phone"
                      type="tel"
                      required
                      placeholder="مثال: 01012345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-paper rounded-input border border-paper-line focus:outline-none focus:border-amber text-sm font-numbers text-right font-bold"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="contact_email" className="block text-xs font-extrabold text-ink-soft/75 mb-2 text-right">
                      {contactBlock?.content?.email_label || 'البريد الإلكتروني (اختياري)'}
                    </label>
                    <input
                      id="contact_email"
                      type="email"
                      placeholder="مثال: user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-paper rounded-input border border-paper-line focus:outline-none focus:border-amber text-sm font-numbers text-right font-bold"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="contact_message" className="block text-xs font-extrabold text-ink-soft/75 mb-2 text-right">
                      {contactBlock?.content?.message_label || 'الرسالة *'}
                    </label>
                    <textarea
                      id="contact_message"
                      required
                      rows={4}
                      placeholder="اكتب استفسارك أو تفاصيل الرسالة هنا..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-4 py-3 bg-paper rounded-input border border-paper-line focus:outline-none focus:border-amber text-sm leading-relaxed font-bold text-right"
                    />
                  </div>

                  {/* Error Notification */}
                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold text-right">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3.5 px-6 text-white font-bold text-base shadow-glow flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span>جاري الإرسال...</span>
                    ) : (
                      <>
                        <span>{contactBlock?.content?.submit_label || 'إرسال الرسالة الآن'}</span>
                        <Send size={16} className="text-white" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
