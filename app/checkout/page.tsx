import { supabase } from '@/lib/supabase';
import CheckoutClient from './checkout-client';

export const revalidate = 1; // Cache checkout page and revalidate every 1 second

async function getShippingZones() {
  try {
    const { data, error } = await supabase
      .from('shipping_zones')
      .select('*')
      .eq('active', true)
      .order('governorate_name');

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching shipping zones:', err);
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
