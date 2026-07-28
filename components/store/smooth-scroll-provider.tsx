'use client';

import { useEffect } from 'react';

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let lenisInstance: any = null;
    let animationFrameId: number | null = null;
    let isCancelled = false;

    async function initSmoothScroll() {
      try {
        // Attempt Lenis initialization
        const lenisModule = await import('lenis').catch(() => null);
        const Lenis = lenisModule?.default || lenisModule;

        if (Lenis && !isCancelled) {
          lenisInstance = new Lenis({
            duration: 1.2,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 1.8,
          });

          // Connect with GSAP ScrollTrigger if present
          try {
            const gsapModule = await import('gsap').catch(() => null);
            const scrollTriggerModule = await import('gsap/ScrollTrigger').catch(() => null);
            const gsap = gsapModule?.default || gsapModule;
            const ScrollTrigger = scrollTriggerModule?.default || scrollTriggerModule;

            if (gsap && ScrollTrigger) {
              gsap.registerPlugin(ScrollTrigger);
              lenisInstance.on('scroll', ScrollTrigger.update);
              gsap.ticker.add((time: number) => {
                lenisInstance?.raf(time * 1000);
              });
              gsap.ticker.lagSmoothing(0);
            }
          } catch (err) {}

          function raf(time: number) {
            if (lenisInstance) {
              lenisInstance.raf(time);
              animationFrameId = requestAnimationFrame(raf);
            }
          }

          animationFrameId = requestAnimationFrame(raf);
        } else {
          document.documentElement.style.scrollBehavior = 'smooth';
        }
      } catch (e) {
        document.documentElement.style.scrollBehavior = 'smooth';
      }
    }

    initSmoothScroll();

    return () => {
      isCancelled = true;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (lenisInstance) {
        lenisInstance.destroy();
      }
    };
  }, []);

  return <>{children}</>;
}
