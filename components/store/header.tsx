'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Menu, X, PhoneCall, Sparkles } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';

interface HeaderProps {
  storeName: string;
  logoUrl: string | null;
  topRibbonText?: string;
  pages?: { slug: string; title: string }[];
}

export default function Header({ storeName, logoUrl, topRibbonText, pages }: HeaderProps) {
  const pathname = usePathname();
  
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const items = useCartStore((state) => state.items);
  const [mounted, setMounted] = useState(false);

  const [currentLogo, setCurrentLogo] = useState<string | null>(logoUrl);
  const [currentName, setCurrentName] = useState<string>(storeName);
  const [currentRibbon, setCurrentRibbon] = useState<string>(topRibbonText || '');
  const [pagesList, setPagesList] = useState<{ slug: string; title: string }[]>(pages || []);

  useEffect(() => {
    setMounted(true);

    const localSettings = localStorage.getItem('kh_settings');
    if (localSettings) {
      try {
        const parsed = JSON.parse(localSettings);
        if (parsed.logo_url !== undefined) setCurrentLogo(parsed.logo_url);
        if (parsed.store_name !== undefined) setCurrentName(parsed.store_name);
        if (parsed.top_ribbon_text !== undefined) setCurrentRibbon(parsed.top_ribbon_text);
      } catch (e) {
        console.error(e);
      }
    }

    const localPages = localStorage.getItem('kh_pages');
    if (localPages) {
      try {
        const parsed = JSON.parse(localPages);
        if (Array.isArray(parsed)) {
          setPagesList(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    const handleSettingsUpdated = () => {
      const updated = localStorage.getItem('kh_settings');
      if (updated) {
        try {
          const parsed = JSON.parse(updated);
          if (parsed.logo_url !== undefined) setCurrentLogo(parsed.logo_url);
          if (parsed.store_name !== undefined) setCurrentName(parsed.store_name);
          if (parsed.top_ribbon_text !== undefined) setCurrentRibbon(parsed.top_ribbon_text);
        } catch (e) {}
      }
    };

    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('settingsUpdated', handleSettingsUpdated);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('settingsUpdated', handleSettingsUpdated);
    };
  }, []);

  const [animateCart, setAnimateCart] = useState(false);

  const cartCount = mounted
    ? items.reduce((sum, item) => sum + item.qty, 0)
    : 0;

  useEffect(() => {
    if (!mounted) return;
    if (cartCount > 0) {
      setAnimateCart(true);
      const timer = setTimeout(() => setAnimateCart(false), 600);
      return () => clearTimeout(timer);
    }
  }, [cartCount, mounted]);

  const getPageTitle = (slug: string, defaultTitle: string) => {
    const page = pagesList.find((p) => p.slug.toLowerCase() === slug.toLowerCase());
    return page?.title || defaultTitle;
  };

  const coreSlugs = ['home', 'products', 'packages', 'box-builder', 'about', 'contact'];

  // Base links
  const navLinks = [
    { name: getPageTitle('home', 'الرئيسية'), path: '/' },
    { name: getPageTitle('products', 'المنتجات'), path: '/products' },
    { name: getPageTitle('packages', 'الباقات المدرسية'), path: '/boxes' },
  ];

  // Append any user-created custom pages dynamically
  pagesList.forEach((page) => {
    const slug = page.slug.toLowerCase().trim();
    if (!coreSlugs.includes(slug)) {
      navLinks.push({
        name: page.title,
        path: `/${page.slug}`,
      });
    }
  });

  // Append about and contact at the end
  navLinks.push(
    { name: getPageTitle('about', 'من نحن'), path: '/about' },
    { name: getPageTitle('contact', 'اتصل بنا'), path: '/contact' }
  );

  return (
    <>
      {currentRibbon && currentRibbon.trim() !== '' && (
        <div className="bg-gradient-to-r from-ink to-ink-soft text-white py-2 px-4 text-center text-xs font-bold shadow-sm flex items-center justify-center gap-2 relative z-50">
          <Sparkles size={12} className="animate-spin text-amber shrink-0" />
          <span className="leading-tight">{currentRibbon}</span>
        </div>
      )}

      <header
        className={`sticky top-0 left-0 right-0 z-40 transition-all duration-200 border-b border-paper-line bg-white ${
          scrolled
            ? 'shadow-brand py-2 sm:py-3'
            : 'py-3.5 sm:py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="flex items-center justify-between md:justify-between w-full">
            
            {/* Mobile Hamburger Trigger (Far Right on mobile, order-1) */}
            <div className="flex md:hidden w-12 justify-start order-1">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-full hover:bg-paper text-ink/80 border border-paper-line bg-white shadow-sm transition-all active:scale-95"
                aria-label="قائمة التنقل"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

            {/* Logo Section (Larger logo and prominent brand title) */}
            <div className="flex-grow md:flex-grow-0 flex justify-center md:justify-start order-2 md:order-1">
              <Link href="/" prefetch={true} className="flex items-center gap-3 md:gap-4 group">
                {currentLogo && currentLogo !== 'null' && currentLogo !== '' ? (
                  <img
                    src={currentLogo}
                    alt={currentName}
                    className="h-14 w-auto max-w-[170px] sm:h-20 sm:max-w-[240px] md:h-24 md:max-w-[280px] object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-amber via-amber-deep to-ink-soft flex items-center justify-center text-white font-black text-2xl sm:text-4xl md:text-5xl shadow-md transform -rotate-2 group-hover:rotate-0 transition-transform duration-300">
                    خ
                  </div>
                )}
                <div className="flex flex-col text-right font-arabic">
                  <span className="text-lg sm:text-2xl md:text-3xl font-black text-ink-soft leading-none tracking-tight whitespace-nowrap">
                    مكتبة الخضري
                  </span>
                  <span className="text-[10px] sm:text-xs md:text-sm font-black text-amber font-english tracking-widest leading-none mt-1">
                    AL-KHOUDARY
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation (Fast prefetching & zero lag) */}
            <nav className="hidden md:flex items-center gap-8 lg:gap-10 order-2">
              {navLinks.map((link) => {
                const isActive =
                  link.path === '/'
                    ? pathname === '/'
                    : pathname?.startsWith(link.path);
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    prefetch={true}
                    className={`text-base lg:text-lg font-extrabold relative py-1.5 transition-all duration-150 active:scale-95 ${
                      isActive
                        ? 'text-amber font-black'
                        : 'text-slate-700 hover:text-amber'
                    }`}
                  >
                    {link.name}
                    {/* Scale expand gold border at bottom */}
                    <span 
                      className={`absolute bottom-0 left-0 right-0 h-[3px] bg-amber rounded-full origin-center transition-transform duration-200 ${
                        isActive ? 'scale-x-100' : 'scale-x-0 hover:scale-x-100'
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Action Area / Cart Trigger (Far Left on mobile, order-3) */}
            <div className="flex items-center justify-end w-12 md:w-auto order-3 md:order-3">
              <Link
                href="/cart"
                prefetch={true}
                className={`relative p-3 rounded-full hover:bg-paper text-ink/80 hover:text-ink-soft transition-all border border-paper-line shadow-sm bg-white active:scale-95 ${
                  animateCart ? 'animate-bounce shadow-glow scale-110 text-amber border-amber' : ''
                }`}
                aria-label="سلة التسوق"
              >
                <ShoppingBag size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber text-white text-xs font-black font-numbers rounded-full w-5.5 h-5.5 flex items-center justify-center border-2 border-white shadow-sm pulse-badge">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-lg border-t border-paper-line shadow-brand animate-fade-in-down">
            <div className="px-4 pt-3 pb-6 space-y-1.5">
              {navLinks.map((link) => {
                const isActive =
                  link.path === '/'
                    ? pathname === '/'
                    : pathname?.startsWith(link.path);
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    prefetch={true}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-base font-bold transition-colors ${
                      isActive
                        ? 'bg-amber/10 text-amber font-black'
                        : 'text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}

            </div>
          </div>
        )}
      </header>
    </>
  );
}
