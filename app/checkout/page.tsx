import { supabase } from '@/lib/supabase';
import { getMockData } from '@/lib/mockData';
import CheckoutClient from './checkout-client';

export const dynamic = 'force-dynamic';

async function getShippingZones() {
  try {
    const { data, error } = await supabase
      .from('shipping_zones')
      .select('*')
      .eq('active', true)
      .order('governorate_name');

    if (error) throw error;
    if (data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.error('Error fetching shipping zones from DB:', err);
  }

  // Fallback to mock shipping rates mapped to ShippingZone format
  try {
    const mockRates = getMockData.shippingRates();
    return mockRates
      .filter((r: any) => r.is_active !== false)
      .map((r: any, idx: number) => ({
        id: r.id || String(idx),
        governorate_name: r.governorate,
        price: Number(r.shipping_fee),
        delivery_days: r.delivery_time,
        free_shipping_threshold: r.free_shipping_threshold !== undefined ? r.free_shipping_threshold : null
      }));
  } catch (e) {
    console.error('Error fetching fallback shipping zones:', e);
    return [];
  }
}

export const metadata = {
  title: 'إتمام الطلب والدفع',
  description: 'أدخل بيانات التوصيل واختر المحافظة لتوصيل مستلزماتك المدرسية لباب منزلك مع خدمة الدفع عند الاستلام.',
};

export default async function CheckoutPage() {
  const shippingZones = await getShippingZones();

  return (
    <div className="bg-brand-bg/40 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-brand-text mb-2">
            تأكيد الطلب والتوصيل
          </h1>
          <p className="text-brand-text/60 text-sm max-w-lg mx-auto">
            يرجى تعبئة حقول الشحن لتوصيل طلبك في أسرع وقت. نوفر خدمة الشحن لجميع محافظات مصر والدفع عند الاستلام.
          </p>
        </div>

        {/* Client side checkout handler */}
        <CheckoutClient shippingZones={shippingZones} />

      </div>
    </div>
  );
}
