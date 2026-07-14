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
        if (parsed.logo_url) setCurrentLogo(parsed.logo_url);
        if (parsed.store_name) setCurrentName(parsed.store_name);
        if (parsed.top_ribbon_text) setCurrentRibbon(parsed.top_ribbon_text);
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
    
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    { name: 'ارفع قائمتك', path: '/upload-list' },
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
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col shadow-sm">
      <div className="bg-gradient-to-r from-ink to-ink-soft text-white py-1 px-4 text-center text-xs font-bold shadow-sm flex items-center justify-center gap-2 relative z-50">
        <Sparkles size={12} className="animate-spin text-amber" />
        <span>{currentRibbon || 'عروض العودة للمدارس: شحن مجاني لكافة المحافظات للطلبات بقيمة 500 ج.م أو أكثر!'}</span>
      </div>

      <header
        className={`w-full transition-all duration-350 border-b border-paper-line bg-white ${
          scrolled
            ? 'shadow-brand py-2.5'
            : 'py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="flex items-center justify-between md:justify-between w-full">
            
            {/* Mobile Hamburger Trigger (Far Right on mobile, order-1) */}
            <div className="flex md:hidden w-12 justify-start order-1">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-full hover:bg-paper text-ink/80 border border-paper-line bg-white shadow-sm transition-all"
                aria-label="قائمة التنقل"
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>

            {/* Logo Section (Centered on mobile, order-2; left-aligned on desktop, order-1) */}
            <div className="flex-grow md:flex-grow-0 flex justify-center md:justify-start order-2 md:order-1">
              <Link href="/" className="flex items-center gap-2 md:gap-3 group">
                {currentLogo && currentLogo !== 'null' && currentLogo !== '' ? (
                  <img
                    src={currentLogo}
                    alt={currentName}
                    className="w-10 h-10 md:w-14 md:h-14 object-contain rounded-full shadow-brand border border-paper-line"
                  />
                ) : (
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-amber via-amber-deep to-ink-soft flex items-center justify-center text-white font-black text-lg md:text-2xl shadow-brand transform -rotate-6 group-hover:rotate-0 transition-transform duration-300 border border-amber/30">
                    خ
                  </div>
                )}
                <div className="flex flex-col text-right font-arabic">
                  <span className="text-sm md:text-lg font-black text-ink-soft leading-tight whitespace-nowrap">
                    مكتبة الخضري
                  </span>
                  <span className="text-[8px] md:text-[10px] font-bold text-amber font-english tracking-wider leading-none mt-0.5">
                    AL-KHOUDARY
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation (Hidden on mobile) */}
            <nav className="hidden md:flex items-center gap-8 order-2">
              {navLinks.map((link) => {
                const isActive =
                  link.path === '/'
                    ? pathname === '/'
                    : pathname?.startsWith(link.path);
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={`text-[15px] font-bold relative py-1 transition-colors group ${
                      isActive
                        ? 'text-ink-soft'
                        : 'text-ink-soft/80 hover:text-ink-soft'
                    }`}
                  >
                    {link.name}
                    {/* Scale expand gold border at bottom */}
                    <span 
                      className={`absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber rounded-full origin-center transition-transform duration-300 ${
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
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
                className={`relative p-2.5 rounded-full hover:bg-paper text-ink/80 hover:text-ink-soft transition-all border border-paper-line shadow-sm bg-white ${
                  animateCart ? 'animate-bounce shadow-glow scale-110 text-amber border-amber' : ''
                }`}
                aria-label="سلة التسوق"
              >
                <ShoppingBag size={18} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber text-white text-[10px] font-bold font-numbers rounded-full w-5 h-5 flex items-center justify-center border border-white shadow-sm pulse-badge">
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
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                      isActive
                        ? 'bg-paper text-ink-soft'
                        : 'text-ink-soft/80 hover:bg-paper/50 hover:text-ink-soft'
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
    </div>
  );
}
