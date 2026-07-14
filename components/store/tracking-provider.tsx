'use client';

import { useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initPixels, trackPageView, PixelConfig } from '@/lib/tracking';

interface TrackingProviderProps {
  pixels: PixelConfig[];
  children: React.ReactNode;
}

function TrackingHandler({ pixels }: { pixels: PixelConfig[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views on route changes and trigger scroll reveal
  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    trackPageView(pixels, url);

    // Scroll Reveal (IntersectionObserver)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    // Give Next.js a tiny fraction of a second to render the DOM elements
    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal').forEach((el) => {
        observer.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [pathname, searchParams, pixels]);

  return null;
}

export default function TrackingProvider({ pixels, children }: TrackingProviderProps) {
  const initialized = useRef(false);

  // Initialize pixels once on mount
  useEffect(() => {
    if (!initialized.current) {
      initPixels(pixels);
      initialized.current = true;
    }
  }, [pixels]);

  // Expose pixels to window context so pages can access them for event firing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).activePixels = pixels;
    }
  }, [pixels]);

  return (
    <>
      <Suspense fallback={null}>
        <TrackingHandler pixels={pixels} />
      </Suspense>
      {children}
    </>
  );
}
