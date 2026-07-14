'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, PhoneCall, MapPin, Clock } from 'lucide-react';

interface FooterProps {
  storeName: string;
}

export default function Footer({ storeName }: FooterProps) {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const [currentName, setCurrentName] = React.useState<string>(storeName);
  const [currentLogo, setCurrentLogo] = React.useState<string | null>(null);
  const [contactData, setContactData] = React.useState({
    phone: '19000',
    email: 'info@alkhodary.eg',
    address: 'القاهرة، جمهورية مصر العربية',
    work_hours: 'يومياً من 9:00 ص إلى 10:00 م',
  });

  React.useEffect(() => {
    const localSettings = localStorage.getItem('kh_settings');
    if (localSettings) {
      try {
        const parsed = JSON.parse(localSettings);
        if (parsed.store_name) setCurrentName(parsed.store_name);
        if (parsed.logo_url) setCurrentLogo(parsed.logo_url);
      } catch (e) {
        console.error(e);
      }
    }

    const localPages = localStorage.getItem('kh_pages');
    if (localPages) {
      try {
        const pages = JSON.parse(localPages);
        if (Array.isArray(pages)) {
          const contactPage = pages.find(p => p.slug === 'contact');
          const contactBlock = contactPage?.blocks?.find((b: any) => b.type === 'contact_section');
          if (contactBlock && contactBlock.content) {
            setContactData({
              phone: contactBlock.content.phone || '19000',
              email: contactBlock.content.email || 'info@alkhodary.eg',
              address: contactBlock.content.address || 'القاهرة، جمهورية مصر العربية',
              work_hours: contactBlock.content.work_hours || 'يومياً من 9:00 ص إلى 10:00 م',
            });
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  return (
    <footer className="bg-ink text-white/80 border-t border-ink-soft/40 relative overflow-hidden mt-auto">
      {/* Decorative subtle gradient background */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-sage-deep/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Logo & Intro */}
          <div className="space-y-4 text-center md:text-right">
            <Link href="/" className="flex items-center justify-center md:justify-start gap-2.5 group">
              {currentLogo && currentLogo !== 'null' && currentLogo !== '' ? (
                <img
                  src={currentLogo}
                  alt={currentName}
                  className="w-10 h-10 object-contain rounded-full shadow-brand border border-slate-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber via-amber-deep to-coral flex items-center justify-center text-white font-black text-sm">
                  خ
                </div>
              )}
              <div className="flex flex-col text-right font-arabic">
                <span className="text-base font-black text-ink-soft leading-tight whitespace-nowrap">
                  مكتبة الخضري
                </span>
                <span className="text-[8px] font-bold text-amber font-english tracking-wider leading-none mt-0.5">
                  AL-KHOUDARY
                </span>
              </div>
            </Link>
            <p className="text-slate-300 text-xs leading-relaxed hidden md:block">
              شريككم الدراسي الأول في مصر لتوفير كافة الأدوات والمستلزمات المدرسية المتميزة وتخصيص الباقات المدرسية الذكية لكل مرحلة دراسية.
            </p>
            <div className="flex flex-col items-center md:items-start gap-3 pt-2">
              <a
                href={`tel:${contactData.phone}`}
                className="flex items-center gap-2 text-amber font-extrabold text-base font-numbers hover:text-white transition-colors"
              >
                <PhoneCall size={14} className="text-sage" />
                <span>{contactData.phone}</span>
              </a>
              <a 
                href={`mailto:${contactData.email}`} 
                className="flex items-center gap-2 text-slate-300 hover:text-amber font-numbers text-xs transition-colors"
              >
                <Mail size={14} className="text-amber" />
                <span>{contactData.email}</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4 text-center md:text-right">
            <h4 className="text-white font-extrabold text-sm relative inline-block pb-1.5 mx-auto md:mx-0">
              روابط سريعة
              <span className="absolute bottom-0 right-0 left-0 md:left-8 h-[2px] bg-amber/60 rounded-full" />
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/products" className="text-slate-300 text-xs hover:text-amber transition-colors">
                  كافة المنتجات
                </Link>
              </li>
              <li>
                <Link href="/boxes" className="text-slate-300 text-xs hover:text-amber transition-colors">
                  الباقات المدرسية
                </Link>
              </li>
              <li className="md:hidden">
                <Link href="/about" className="text-slate-300 text-xs hover:text-amber transition-colors">
                  من نحن
                </Link>
              </li>
              <li className="md:hidden">
                <Link href="/contact" className="text-slate-300 text-xs hover:text-amber transition-colors">
                  اتصل بنا
                </Link>
              </li>
            </ul>
          </div>

          {/* About & Support (Desktop Only) */}
          <div className="hidden md:block space-y-4">
            <h4 className="text-white font-extrabold text-sm relative inline-block pb-1.5">
              الدعم والروابط
              <span className="absolute bottom-0 right-0 left-8 h-[2px] bg-amber/60 rounded-full" />
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-slate-300 text-xs hover:text-amber transition-colors">
                  من نحن
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-300 text-xs hover:text-amber transition-colors">
                  تواصل معنا
                </Link>
              </li>
              <li>
                <span className="text-slate-400 text-xs cursor-default">
                  سياسة التوصيل والاسترجاع
                </span>
              </li>
            </ul>
          </div>

          {/* Contact Information (Desktop Only) */}
          <div className="hidden md:block space-y-4">
            <h4 className="text-white font-extrabold text-sm relative inline-block pb-1.5">
              بيانات التواصل
              <span className="absolute bottom-0 right-0 left-8 h-[2px] bg-amber/60 rounded-full" />
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-slate-200 text-xs">
                <MapPin size={14} className="text-amber shrink-0 mt-0.5" />
                <span>{contactData.address}</span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-200 text-xs">
                <Clock size={14} className="text-amber shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p>{contactData.work_hours}</p>
                  <p className="text-slate-400 text-[10px]">ما عدا الجمعة</p>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom strip */}
        <div className="border-t border-slate-700/50 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-xs">
          <p className="text-center sm:text-right font-numbers">
            &copy; {currentYear} {storeName}. جميع الحقوق محفوظة. تم التطوير بواسطة APEX.
          </p>
          <div className="flex gap-4">
            <span>الدفع عند الاستلام (COD)</span>
            <span>|</span>
            <span>شحن سريع ومضمون</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
