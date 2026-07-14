import type { Metadata } from 'next';
import { Cairo, Tajawal, Inter } from 'next/font/google';
import './globals.css';
import { supabase, cachedFetch } from '@/lib/supabase';
import TrackingProvider from '@/components/store/tracking-provider';
import Header from '@/components/store/header';
import Footer from '@/components/store/footer';

export const revalidate = 1; // Cache layout and revalidate every 1 second

const cairo = Cairo({
  subsets: ['arabic'],
  variable: '--font-cairo',
  weight: ['400', '600', '700', '800', '900'],
});

const tajawal = Tajawal({
  subsets: ['arabic'],
  variable: '--font-tajawal',
  weight: ['300', '400', '500', '700', '900'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});

async function getStoreData() {
  return cachedFetch('store-layout-data', async () => {
    try {
      const settingsPromise = supabase.from('site_settings').select('key, value');
      const pixelsPromise = supabase.from('tracking_pixels').select('platform, pixel_id, active').eq('active', true);
      const pagesPromise = supabase.from('pages').select('slug, title');
      const categoriesPromise = supabase.from('categories').select('id, name');

      const [settingsRes, pixelsRes, pagesRes, categoriesRes] = await Promise.all([
        settingsPromise, 
        pixelsPromise, 
        pagesPromise,
        categoriesPromise
      ]);

      const settings: Record<string, string> = {};
      settingsRes.data?.forEach((s: any) => {
        settings[s.key] = s.value;
      });

      return {
        storeName: settings.store_name || 'مكتبة الخضري',
        logoUrl: settings.logo_url || null,
        topRibbonText: settings.top_ribbon_text || 'عروض العودة للمدارس: شحن مجاني لكافة المحافظات للطلبات بقيمة 500 ج.م أو أكثر!',
        pixels: pixelsRes.data || [],
        pages: pagesRes.data || [],
        categories: categoriesRes.data || [],
      };
    } catch (error) {
      console.error('Error fetching layout data:', error);
      return {
        storeName: 'مكتبة الخضري',
        logoUrl: null,
        topRibbonText: 'عروض العودة للمدارس: شحن مجاني لكافة المحافظات للطلبات بقيمة 500 ج.م أو أكثر!',
        pixels: [],
        pages: [],
        categories: [],
      };
    }
  }, 5000);
}

export async function generateMetadata(): Promise<Metadata> {
  const { storeName } = await getStoreData();
  return {
    title: {
      default: `${storeName} - الأدوات والمستلزمات المدرسية`,
      template: `%s | ${storeName}`,
    },
    description: 'تسوّق الآن أفضل المستلزمات المدرسية وباقات الخضري المدرسية المخصصة لكل مرحلة تعليمية.',
    icons: {
      icon: '/favicon.ico',
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { storeName, logoUrl, topRibbonText, pixels, pages, categories } = await getStoreData();

  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable} ${inter.variable}`}>
      <body className="flex flex-col min-h-screen bg-paper text-ink selection:bg-amber/30">
        {/* Initialize categories array in localStorage on the client-side */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                localStorage.setItem('kh_categories', JSON.stringify(${JSON.stringify(categories)}));
              } catch (e) {
                console.error('Error writing categories to localStorage:', e);
              }
            `
          }}
        />
        <TrackingProvider pixels={pixels as any}>
          <Header storeName={storeName} logoUrl={logoUrl} topRibbonText={topRibbonText} pages={pages} />
          <main className="flex-grow">
            {children}
          </main>
          <Footer storeName={storeName} />
        </TrackingProvider>
      </body>
    </html>
  );
}
