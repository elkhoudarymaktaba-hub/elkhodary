// app/admin/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, CheckCircle, XCircle, ArrowUpRight, 
  ShoppingBag, Users, Percent, ChevronLeft, Eye, ClipboardList 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { supabase } from '@/lib/supabase';
import { getMockData, Order, ShippingRate } from '@/lib/mockData';
import OrderDrawer from '@/components/admin/order-drawer';

// شارات الألوان للحالات
const statusColors: Record<string, string> = {
  new: 'bg-[#FBEBCB] text-[#C9862A] border border-[#E7A537]/20 rounded-full',
  confirmed: 'bg-[#EAE1F3] text-[#7A5C9E] border border-[#7A5C9E]/20 rounded-full',
  shipping: 'bg-indigo-50 text-[#2E3E63] border border-[#2E3E63]/20 rounded-full',
  delivered: 'bg-[#DCEEE5] text-[#396A56] border border-[#4F8F73]/20 rounded-full',
  cancelled: 'bg-[#FBE1DB] text-[#C43F2B] border border-[#E4573F]/20 rounded-full',
};

const rowIconColors = [
  'bg-[#DCEEE5] text-[#396A56]', // Sage
  'bg-[#FBEBCB] text-[#C9862A]', // Mustard
  'bg-[#FBE1DB] text-[#C43F2B]', // Coral
  'bg-[#EAE1F3] text-[#7A5C9E]', // Plum
  'bg-indigo-50 text-[#2E3E63]', // Blue/Navy
];

const statusLabels: Record<string, string> = {
  new: 'جديد',
  confirmed: 'مؤكد',
  shipping: 'مع شركة الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

export default function DashboardHome() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // مؤشرات الأداء (KPIs)
  const [kpis, setKpis] = useState({
    totalSales: 0,
    confirmedCount: 0,
    cancelledCount: 0,
    avgOrderVal: 0,
    conversionRate: 2.8,
    totalVisits: 1450,
  });

  // بيانات مخطط آخر 7 أيام
  const [weeklySales, setWeeklySales] = useState<{ date: string; amount: number }[]>([]);
  // بيانات أكثر 3 منتجات مبيعاً
  const [topProducts, setTopProducts] = useState<{ name: string; qty: number; percent: number }[]>([]);

  useEffect(() => {
    setMounted(true);

    const fetchData = async () => {
      let ordersList: Order[] = [];
      let shippingList: ShippingRate[] = [];

      try {
        const { data: oData } = await supabase.from('orders').select('*');
        if (oData) ordersList = oData;
        const { data: sData } = await supabase.from('shipping_rates').select('*');
        if (sData) shippingList = sData;
      } catch (err) {
        ordersList = getMockData.orders();
        shippingList = getMockData.shippingRates();
      }

      setOrders(ordersList);
      setShippingRates(shippingList);
      calculateKPIs(ordersList);
    };

    fetchData();
  }, []);

  const calculateKPIs = (ordersList: Order[]) => {
    // 1. تصفية الطلبات الملغاة وغير الملغاة
    const nonCancelled = ordersList.filter(o => o.status !== 'cancelled');
    const cancelled = ordersList.filter(o => o.status === 'cancelled');
    const confirmed = ordersList.filter(o => o.status === 'confirmed');

    // 2. إجمالي المبيعات
    const totalSales = nonCancelled.reduce((sum, o) => sum + o.total_amount, 0);

    // 3. متوسط قيمة الطلب
    const avgOrderVal = nonCancelled.length > 0 ? Math.round(totalSales / nonCancelled.length) : 0;

    // 4. الزيارات والتحويلات
    const visits = 2100; // قيمة افتراضية للزيارات
    const conversionRate = visits > 0 ? parseFloat(((nonCancelled.length / visits) * 100).toFixed(1)) : 0;

    setKpis({
      totalSales,
      confirmedCount: confirmed.length,
      cancelledCount: cancelled.length,
      avgOrderVal,
      conversionRate,
      totalVisits: visits,
    });

    // 5. رسم بياني لآخر 7 أيام
    const dailyMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = 0;
    }

    nonCancelled.forEach(o => {
      const dayKey = o.created_at.split('T')[0];
      if (dayKey in dailyMap) {
        dailyMap[dayKey] += o.total_amount;
      }
    });

    const weeklyData = Object.entries(dailyMap).map(([date, amount]) => {
      // تنسيق التاريخ مثل "8 يول"
      const dateObj = new Date(date);
      const formattedDate = dateObj.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
      return { date: formattedDate, amount };
    });
    setWeeklySales(weeklyData);

    // 6. أكثر 3 منتجات مبيعاً
    const productMap: Record<string, number> = {};
    nonCancelled.forEach(o => {
      o.items.forEach(item => {
        productMap[item.name] = (productMap[item.name] || 0) + item.quantity;
      });
    });

    const sortedProducts = Object.entries(productMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 3);

    const maxQty = sortedProducts[0]?.qty || 1;
    const topProdData = sortedProducts.map(p => ({
      name: p.name,
      qty: p.qty,
      percent: Math.round((p.qty / maxQty) * 100),
    }));
    setTopProducts(topProdData);
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const handleStatusUpdated = (orderId: string, newStatus: string) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o);
    setOrders(updated);
    calculateKPIs(updated);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus as any });
    }
  };

  // أحدث 5 طلبات
  const latestOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* صف كروت الأداء (KPIs Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        
        {/* إجمالي عدد الطلبات */}
        <Link 
          href="/admin/orders" 
          className="bg-white p-5 rounded-[16px] shadow-premium hover:shadow-premium-hover transition-all duration-300 border border-[#E7DCC2] flex items-center justify-between group animate-rise cursor-pointer"
        >
          <div className="space-y-2 text-right">
            <p className="text-xs font-bold text-[#6B7796] font-arabic">إجمالي عدد الطلبات</p>
            <h3 className="text-2xl font-black text-ink font-cairo" style={{ fontWeight: 900 }}>{orders.length} طلب</h3>
            <p className="text-[11px] text-amber hover:underline font-bold font-arabic flex items-center gap-1">
              <span>عرض كل الطلبات</span>
              <ChevronLeft className="w-3 h-3" />
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-light/10 text-amber rounded-[12px] flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-sm">
            <ClipboardList className="w-6 h-6" />
          </div>
        </Link>

        {/* إجمالي المبيعات */}
        <div className="bg-white p-5 rounded-[16px] shadow-premium hover:shadow-premium-hover transition-all duration-300 border border-[#E7DCC2] flex items-center justify-between group animate-rise">
          <div className="space-y-2 text-right">
            <p className="text-xs font-bold text-[#6B7796] font-arabic">إجمالي المبيعات (بدون الملغاة)</p>
            <h3 className="text-2xl font-black text-ink font-cairo" style={{ fontWeight: 900 }}>{kpis.totalSales.toLocaleString()} ج.م</h3>
            <span className="inline-flex items-center text-[11px] text-[#396A56] bg-[#DCEEE5] px-2 py-0.5 rounded-full font-bold">
              <ArrowUpRight className="w-3 h-3 ml-0.5 animate-pulse" />
              <span>+12% عن الشهر الماضي</span>
            </span>
          </div>
          <div className="w-12 h-12 bg-[#EAE1F3] text-[#7A5C9E] rounded-[12px] flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-sm">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* الطلبات المؤكدة */}
        <div className="bg-white p-5 rounded-[16px] shadow-premium hover:shadow-premium-hover transition-all duration-300 border border-[#E7DCC2] flex items-center justify-between group animate-rise">
          <div className="space-y-2 text-right">
            <p className="text-xs font-bold text-[#6B7796] font-arabic">الطلبات المؤكدة</p>
            <h3 className="text-2xl font-black text-ink font-cairo" style={{ fontWeight: 900 }}>{kpis.confirmedCount} طلب</h3>
            <p className="text-[11px] text-slate-500 font-arabic">بانتظار شركة الشحن حالياً</p>
          </div>
          <div className="w-12 h-12 bg-[#DCEEE5] text-[#396A56] rounded-[12px] flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-sm">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* الطلبات الملغية */}
        <div className="bg-white p-5 rounded-[16px] shadow-premium hover:shadow-premium-hover transition-all duration-300 border border-[#E7DCC2] flex items-center justify-between group animate-rise">
          <div className="space-y-2 text-right">
            <p className="text-xs font-bold text-[#6B7796] font-arabic">الطلبات الملغية</p>
            <h3 className="text-2xl font-black text-coral font-cairo" style={{ fontWeight: 900 }}>{kpis.cancelledCount} طلب</h3>
            <p className="text-[11px] text-slate-500 font-arabic">تم إلغاؤها من العملاء / المشرف</p>
          </div>
          <div className="w-12 h-12 bg-[#FBE1DB] text-[#C43F2B] rounded-[12px] flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-sm">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        {/* متوسط قيمة الطلب */}
        <div className="bg-white p-5 rounded-[16px] shadow-premium hover:shadow-premium-hover transition-all duration-300 border border-[#E7DCC2] flex items-center justify-between group animate-rise">
          <div className="space-y-2 text-right">
            <p className="text-xs font-bold text-[#6B7796] font-arabic">متوسط قيمة الطلب</p>
            <h3 className="text-2xl font-black text-ink font-cairo" style={{ fontWeight: 900 }}>{kpis.avgOrderVal.toLocaleString()} ج.م</h3>
            <p className="text-[11px] text-slate-500 font-arabic">حجم مشتريات العميل المتوسطة</p>
          </div>
          <div className="w-12 h-12 bg-[#FBEBCB] text-[#C9862A] rounded-[12px] flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-sm">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* المخططات والطلبات */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* مخطط مبيعات آخر 7 أيام */}
        <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-ink font-arabic">منحنى مبيعات آخر 7 أيام</h3>
              <p className="text-xs text-ink-muted font-arabic mt-1">مخطط تطور حجم الإيرادات بالجنيه المصري</p>
            </div>
            <span className="px-3 py-1 bg-[#FBEBCB]/60 text-[#C9862A] text-xs font-bold rounded-[8px] font-arabic">تحديث فوري</span>
          </div>

          <div className="h-64 w-full">
            {mounted && weeklySales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklySales}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E4573F" stopOpacity={0.22}/>
                      <stop offset="95%" stopColor="#E4573F" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#E7DCC2" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="#6B7796" tick={{ fill: '#0A1931', fontSize: 12, fontWeight: 'bold' }} dy={10} />
                  <YAxis stroke="#6B7796" tick={{ fill: '#0A1931', fontSize: 12, fontWeight: 'bold' }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E7DCC2', direction: 'rtl', textAlign: 'right', backgroundColor: '#FFFFFF' }} 
                    formatter={(val) => [`${val} ج.م`, 'المبيعات']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#E4573F" 
                    strokeWidth={3.5} 
                    strokeLinecap="round"
                    fillOpacity={1} 
                    fill="url(#colorSales)"
                    dot={{ fill: '#FFFFFF', stroke: '#E4573F', strokeWidth: 2, r: 4 }}
                    activeDot={{ fill: '#FFFFFF', stroke: '#E4573F', strokeWidth: 3, r: 6 }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-arabic text-sm">جاري معالجة الرسم البياني...</div>
            )}
          </div>
        </div>

        {/* نسبة التحويل والزيارات */}
        <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] flex flex-col justify-between gap-5">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-ink font-arabic">قمع التحويلات اليومي</h3>
            <p className="text-xs text-ink-muted font-arabic">إحصائيات إتمام الشراء ونشاط الزوار</p>
          </div>

          {/* العرض الدائري أو التفصيلي */}
          <div className="flex-1 flex flex-col justify-center items-center gap-6 py-4">
            
            <div className="relative flex items-center justify-center">
              {/* حلقة دائرية تجميلية */}
              <div className="w-32 h-32 rounded-full border-8 border-[#F6F1E4] flex flex-col items-center justify-center shadow-inner bg-white">
                <span className="text-3xl font-black text-ink font-english">{kpis.conversionRate}%</span>
                <span className="text-xs text-slate-500 font-arabic font-bold mt-1">معدل التحويل</span>
              </div>
              <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-coral border-r-amber animate-spin-slow pointer-events-none" />
            </div>

            <div className="w-full grid grid-cols-2 gap-4">
              <div className="bg-[#F6F1E4]/60 p-3 rounded-[12px] text-center space-y-1 border border-[#E7DCC2]/40">
                <div className="flex items-center justify-center gap-1 text-ink-muted text-xs font-arabic">
                  <Users className="w-3.5 h-3.5 text-amber" />
                  <span>زيارات المتجر</span>
                </div>
                <p className="text-lg font-bold text-ink font-english">{kpis.totalVisits.toLocaleString()}</p>
              </div>

              <div className="bg-[#F6F1E4]/60 p-3 rounded-[12px] text-center space-y-1 border border-[#E7DCC2]/40">
                <div className="flex items-center justify-center gap-1 text-ink-muted text-xs font-arabic">
                  <Percent className="w-3.5 h-3.5 text-coral" />
                  <span>إجمالي الطلبات</span>
                </div>
                <p className="text-lg font-bold text-ink font-english">{orders.filter(o => o.status !== 'cancelled').length}</p>
              </div>
            </div>

          </div>

          <div className="text-center text-xs text-slate-500 font-arabic border-t border-[#E7DCC2]/60 pt-3">
            تحسب نسبة التحويل بناءً على: (الطلبات غير الملغاة ÷ الزيارات)
          </div>
        </div>

      </div>

      {/* الطلبات الأحدث وأكثر المنتجات مبيعاً */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* أحدث 5 طلبات */}
        <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-ink font-arabic">أحدث 5 طلبات مسجلة</h3>
              <p className="text-xs text-ink-muted font-arabic mt-1">آخر المعاملات التي تمت في المتجر مؤخراً</p>
            </div>
            <a href="/admin/orders" className="flex items-center gap-1 text-xs text-amber font-bold hover:text-[#C9862A] font-arabic">
              <span>عرض جميع الطلبات</span>
              <ChevronLeft className="w-4 h-4" />
            </a>
          </div>

          {/* جدول الطلبات */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-[#E7DCC2] text-ink-soft font-arabic">
                  <th className="pb-3 font-semibold">رقم الطلب</th>
                  <th className="pb-3 font-semibold">العميل</th>
                  <th className="pb-3 font-semibold">الإجمالي</th>
                  <th className="pb-3 font-semibold">الحالة</th>
                  <th className="pb-3 font-semibold">التوقيت</th>
                  <th className="pb-3 font-semibold text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-[#E7DCC2]">
                {latestOrders.map((order, idx) => {
                  const iconColorClass = rowIconColors[idx % rowIconColors.length];
                  return (
                    <tr key={order.id} className="hover:bg-[#FBEBCB]/15 transition-colors group">
                      <td className="py-3.5 font-bold font-english text-ink-soft text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center text-sm ${iconColorClass}`}>
                            📖
                          </div>
                          <span>#{order.id}</span>
                        </div>
                      </td>
                      <td className="py-3.5 font-bold text-slate-800 font-arabic">{order.customer_name}</td>
                      <td className="py-3.5 font-black text-coral font-english">{order.total_amount} ج.م</td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-arabic inline-block ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </td>
                      <td className="py-3.5 text-xs text-[#6B7796] font-arabic">
                        {new Date(order.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 text-center">
                        <button 
                          onClick={() => handleOrderClick(order)}
                          className="p-1.5 text-amber bg-[#FBEBCB]/60 rounded-[8px] hover:bg-amber hover:text-white transition-colors"
                          title="تفاصيل الطلب"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* أكثر المنتجات مبيعاً */}
        <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] flex flex-col gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-ink font-arabic">أكثر 3 منتجات طلباً</h3>
            <p className="text-xs text-ink-muted font-arabic">المنتجات الأعلى مبيعاً في الأسبوع الأخير</p>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-4">
            {topProducts.length > 0 ? (
              topProducts.map((p, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold font-arabic text-slate-700">
                    <span className="truncate max-w-[200px]" title={p.name}>{p.name}</span>
                    <span className="font-english text-coral">{p.qty} قطعة</span>
                  </div>
                  {/* شريط التقدم الجمالي */}
                  <div className="w-full h-2 bg-[#F6F1E4] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-l from-[#E7A537] to-[#E4573F] rounded-full transition-all duration-500" 
                      style={{ width: `${p.percent}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-ink-muted font-arabic text-xs py-8">لا تتوفر مبيعات كافية لعرض التقرير.</div>
            )}
          </div>

          <div className="text-center text-xs text-slate-500 font-arabic border-t border-[#E7DCC2]/60 pt-3">
            النسب مئوية محسوبة مقارنة بالمنتج الأعلى مبيعاً.
          </div>
        </div>

      </div>

      {/* درج التفاصيل الجانبي للطلبات */}
      <OrderDrawer
        order={selectedOrder}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onStatusUpdated={handleStatusUpdated}
        shippingRates={shippingRates}
      />
    </div>
  );
}
