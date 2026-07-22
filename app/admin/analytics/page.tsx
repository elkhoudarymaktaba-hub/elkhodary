// app/admin/analytics/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { 
  Calendar, ArrowUpRight, DollarSign, ClipboardCheck, 
  XOctagon, RefreshCw, BarChart, Percent, Users 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart as RechartsBarChart, Bar, Legend, CartesianGrid 
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { getMockData, Order, Product, Category } from '@/lib/mockData';
import { Input } from '@/components/ui/input';

const statusLabels: Record<string, string> = {
  new: 'جديد',
  confirmed: 'مؤكد',
  shipping: 'مع شركة الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

const colorsPalette = ['#0073E6', '#E7A537', '#E4573F', '#10B981', '#8B5CF6', '#F97316', '#06B6D4'];
const statusColors = {
  new: '#E7A537',
  confirmed: '#8B5CF6',
  shipping: '#0073E6',
  delivered: '#10B981',
  cancelled: '#E4573F',
};

const CustomYAxisTick = (props: any) => {
  const { x, y, payload } = props;
  return (
    <text
      x={x + 10}
      y={y}
      dy={4}
      textAnchor="end"
      fill="var(--ink)"
      fontSize={11}
      fontWeight="bold"
      fontFamily="var(--font-cairo)"
      style={{ direction: 'rtl' }}
    >
      {payload.value.length > 28 ? payload.value.slice(0, 28) + '...' : payload.value}
    </text>
  );
};

const wrapText = (text: string, maxCharsPerLine = 12): string[] => {
  let line1 = '';
  let line2 = '';
  
  if (text.includes(' - ')) {
    const parts = text.split(' - ');
    line1 = parts[0].trim();
    line2 = parts.slice(1).join(' - ').trim();
  } else {
    if (text.length <= maxCharsPerLine) {
      return [text];
    }
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      if ((line1 + words[i]).length <= maxCharsPerLine) {
        line1 += (line1 ? ' ' : '') + words[i];
      } else {
        line2 = words.slice(i).join(' ');
        break;
      }
    }
  }
  
  // Truncate individual lines if they are still too long
  if (line1.length > 16) line1 = line1.slice(0, 15) + '..';
  if (line2.length > 16) line2 = line2.slice(0, 15) + '..';
  
  return [line1, line2].filter(Boolean);
};

const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const text = payload.value;
  const lines = wrapText(text, 12);
  
  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, idx) => (
        <text
          key={idx}
          x={0}
          y={idx * 14}
          dy={12}
          textAnchor="middle"
          fill="#94A3B8"
          fontSize={10}
          fontWeight="bold"
          fontFamily="var(--font-cairo)"
        >
          {line}
        </text>
      ))}
    </g>
  );
};

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // تصفية التاريخ
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // المؤشرات المحسوبة
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    confirmedCount: 0,
    cancelledCount: 0,
    avgOrderVal: 0,
    orderVisitsRatio: '-',
    conversionRate: 0,
  });

  // المخططات
  const [salesProgressData, setSalesProgressData] = useState<{ date: string; revenue: number }[]>([]);
  const [statusDonutData, setStatusDonutData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [topProductsData, setTopProductsData] = useState<{ name: string; qty: number }[]>([]);
  const [cartEventsData, setCartEventsData] = useState<{ name: string; count: number }[]>([]);
  const [visitSourcesData, setVisitSourcesData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [govOrdersData, setGovOrdersData] = useState<{ governorate: string; orders: number }[]>([]);
  const [avgOrderOverTime, setAvgOrderOverTime] = useState<{ date: string; avg: number }[]>([]);
  const [govView, setGovView] = useState<'chart' | 'rank'>('chart');

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      calculateAnalytics();
    }
  }, [period, startDate, endDate, orders, products]);

  const fetchData = async () => {
    let ordersList: Order[] = [];
    let productsList: Product[] = [];
    try {
      const { data: oData } = await supabase.from('orders').select('*');
      if (oData) ordersList = oData;
      const { data: pData } = await supabase.from('products').select('*');
      if (pData) productsList = pData;
    } catch (err) {
      ordersList = getMockData.orders();
      productsList = getMockData.products();
    }
    setOrders(ordersList);
    setProducts(productsList);
  };

  const calculateAnalytics = () => {
    // 1. التصفية حسب التاريخ
    let filtered = [...orders];
    const now = new Date();
    
    if (period === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      filtered = orders.filter(o => o.created_at.startsWith(todayStr));
    } else if (period === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      filtered = orders.filter(o => new Date(o.created_at) >= oneWeekAgo);
    } else if (period === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(now.getDate() - 30);
      filtered = orders.filter(o => new Date(o.created_at) >= oneMonthAgo);
    } else if (period === 'year') {
      const oneYearAgo = new Date();
      oneYearAgo.setDate(now.getDate() - 365);
      filtered = orders.filter(o => new Date(o.created_at) >= oneYearAgo);
    } else if (period === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = orders.filter(o => {
        const d = new Date(o.created_at);
        return d >= start && d <= end;
      });
    }

    // 2. إيجاد الطلبات النشطة والملغاة
    const nonCancelled = filtered.filter(o => o.status !== 'cancelled');
    const cancelled = filtered.filter(o => o.status === 'cancelled');
    const confirmed = filtered.filter(o => o.status === 'confirmed');

    // 3. حساب مؤشرات الأداء الأساسية
    const totalSales = nonCancelled.reduce((sum, o) => sum + o.total_amount, 0);
    const avgOrderVal = nonCancelled.length > 0 ? Math.round(totalSales / nonCancelled.length) : 0;
    
    // نسبة الطلب (مخصصة ومحاكاة)
    const mockVisits = period === 'today' ? 120 : (period === 'week' ? 840 : (period === 'month' ? 3600 : 42000));
    const conversionRate = mockVisits > 0 ? parseFloat(((nonCancelled.length / mockVisits) * 100).toFixed(1)) : 0;
    
    setMetrics({
      totalSales,
      confirmedCount: confirmed.length,
      cancelledCount: cancelled.length,
      avgOrderVal,
      orderVisitsRatio: `${nonCancelled.length} / ${mockVisits}`,
      conversionRate,
    });

    // -------------------------------------------------------------
    // المخطط 1: تطور حجم المبيعات والمخطط 7: متوسط قيمة الطلب بمرور الوقت
    // -------------------------------------------------------------
    const dateGroups: Record<string, { total: number; count: number }> = {};
    
    // تأمين نطاق تاريخ افتراضي للمحاكاة لتعبئة الفجوات
    const daysToShow = period === 'today' ? 1 : (period === 'week' ? 7 : (period === 'month' ? 15 : 12));
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date();
      if (period === 'month') d.setDate(now.getDate() - i * 2); // قفزات 2 يوم للشهر
      else d.setDate(now.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dateGroups[key] = { total: 0, count: 0 };
    }

    nonCancelled.forEach(o => {
      const key = o.created_at.split('T')[0];
      if (key in dateGroups) {
        dateGroups[key].total += o.total_amount;
        dateGroups[key].count += 1;
      } else {
        // لو لم يكن في المجموعة الأساسية نضيفه
        dateGroups[key] = { total: o.total_amount, count: 1 };
      }
    });

    const progression = Object.entries(dateGroups).map(([date, data]) => {
      const dateObj = new Date(date);
      const formatted = dateObj.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
      return { 
        date: formatted, 
        revenue: data.total,
        avg: data.count > 0 ? Math.round(data.total / data.count) : 0
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setSalesProgressData(progression.map(p => ({ date: p.date, revenue: p.revenue })));
    setAvgOrderOverTime(progression.map(p => ({ date: p.date, avg: p.avg })));

    // -------------------------------------------------------------
    // المخطط 2: توزيع الطلبات حسب الحالة (شامل الملغاة)
    // -------------------------------------------------------------
    const statusCounts: Record<string, number> = { new: 0, confirmed: 0, shipping: 0, delivered: 0, cancelled: 0 };
    filtered.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    const statusDonut = Object.entries(statusCounts).map(([status, count]) => ({
      name: statusLabels[status] || status,
      value: count,
      color: statusColors[status as keyof typeof statusColors] || '#ccc'
    })).filter(item => item.value > 0);
    setStatusDonutData(statusDonut);

    // -------------------------------------------------------------
    // المخطط 3: المنتجات الأكثر مبيعاً (Top 10)
    // -------------------------------------------------------------
    const productQuantities: Record<string, number> = {};
    nonCancelled.forEach(o => {
      o.items.forEach(item => {
        productQuantities[item.name] = (productQuantities[item.name] || 0) + item.quantity;
      });
    });

    const topProducts = Object.entries(productQuantities)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
    setTopProductsData(topProducts);

    // -------------------------------------------------------------
    // المخطط 4: إضافات السلة (cart_events)
    // -------------------------------------------------------------
    const cartEvents = getMockData.cartEvents();
    const cartData = cartEvents.map(event => {
      const prodName = products.find(p => p.id === event.product_id)?.name || 'منتج غير معروف';
      return {
        name: prodName,
        count: event.count
      };
    });
    setCartEventsData(cartData);

    // -------------------------------------------------------------
    // المخطط 5: مصادر الزيارات (visit_sources)
    // -------------------------------------------------------------
    const visitSources = getMockData.visitSources();
    const sourceData = visitSources.map((s, idx) => ({
      name: s.source,
      value: s.count,
      color: colorsPalette[idx % colorsPalette.length]
    }));
    setVisitSourcesData(sourceData);

    // -------------------------------------------------------------
    // المخطط 6: توزيع المحافظات الأكثر طلباً (governorates)
    // -------------------------------------------------------------
    const govCounts: Record<string, number> = {};
    nonCancelled.forEach(o => {
      govCounts[o.governorate] = (govCounts[o.governorate] || 0) + 1;
    });

    const govOrders = Object.entries(govCounts)
      .map(([governorate, count]) => ({ governorate, orders: count }))
      .sort((a, b) => b.orders - a.orders);
    setGovOrdersData(govOrders);
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* فلتر المدى الزمني والتحديث */}
      <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* أزرار الفلترة السريعة */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-ink font-arabic ml-2">فلترة البيانات:</span>
          {(['today', 'week', 'month', 'year', 'custom'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-xs font-bold rounded-[24px] font-arabic transition-all duration-200 ${
                period === p 
                  ? 'bg-amber text-white shadow-sm'
                  : 'bg-[#FBEBCB]/50 text-ink hover:bg-slate-100'
              }`}
            >
              {p === 'today' ? 'اليوم' : p === 'week' ? 'الأسبوع' : p === 'month' ? 'الشهر' : p === 'year' ? 'السنة' : 'مخصص (نطاق)'}
            </button>
          ))}
        </div>

        {/* اختيار نطاق التواريخ المخصص */}
        {period === 'custom' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-200">
            <Input 
              type="date" 
              className="py-1 px-3 text-xs" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              label="من تاريخ"
            />
            <Input 
              type="date" 
              className="py-1 px-3 text-xs" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              label="إلى تاريخ"
            />
          </div>
        )}

        {/* زر التحديث اليدوي */}
        <button 
          onClick={fetchData}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-light text-amber-deep hover:bg-amber/15 rounded-[12px] text-xs font-bold transition-all duration-200 font-arabic border border-amber/15"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>تحديث</span>
        </button>

      </div>

      {/* صف كروت الأداء للإحصائيات (KPIs Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        
        {/* إجمالي المبيعات */}
        <div className="bg-white p-4 rounded-[16px] shadow-premium border border-[#E7DCC2] space-y-1.5 text-right">
          <p className="text-xs font-bold text-slate-500 font-arabic">المبيعات الإجمالية</p>
          <h3 className="text-xl font-black text-ink font-english">{metrics.totalSales.toLocaleString()} ج.م</h3>
          <p className="text-[11px] font-medium text-slate-500 font-arabic">بدون الطلبات الملغية</p>
        </div>

        {/* الطلبات المؤكدة */}
        <div className="bg-white p-4 rounded-[16px] shadow-premium border border-[#E7DCC2] space-y-1.5 text-right">
          <p className="text-xs font-bold text-slate-500 font-arabic">الطلبات المؤكدة</p>
          <h3 className="text-xl font-black text-[#8B5CF6] font-english">{metrics.confirmedCount} طلب</h3>
          <p className="text-[11px] font-medium text-slate-500 font-arabic">بانتظار الشحن والتوصيل</p>
        </div>

        {/* الطلبات الملغية */}
        <div className="bg-white p-4 rounded-[16px] shadow-premium border border-[#E7DCC2] space-y-1.5 text-right">
          <p className="text-xs font-bold text-slate-500 font-arabic">الطلبات الملغية</p>
          <h3 className="text-xl font-black text-coral font-english">{metrics.cancelledCount} طلب</h3>
          <p className="text-[11px] font-medium text-slate-500 font-arabic">تم إلغاؤها بالكامل</p>
        </div>

        {/* متوسط قيمة الطلب */}
        <div className="bg-white p-4 rounded-[16px] shadow-premium border border-[#E7DCC2] space-y-1.5 text-right">
          <p className="text-xs font-bold text-slate-500 font-arabic">متوسط الطلب</p>
          <h3 className="text-xl font-black text-coral font-english">{metrics.avgOrderVal.toLocaleString()} ج.م</h3>
          <p className="text-[11px] font-medium text-slate-500 font-arabic">القيمة المالية الوسطى للعميل</p>
        </div>

        {/* نسبة الطلب إلى الزيارات */}
        <div className="bg-white p-4 rounded-[16px] shadow-premium border border-[#E7DCC2] space-y-1.5 text-right">
          <p className="text-xs font-bold text-slate-500 font-arabic">نسبة الطلب (الطلبات/الزيارات)</p>
          <h3 className="text-xl font-black text-slate-700 font-english">{metrics.orderVisitsRatio}</h3>
          <p className="text-[11px] font-medium text-slate-500 font-arabic">الزيارات محسوبة من البيكسل</p>
        </div>

        {/* نسبة التحويل */}
        <div className="bg-white p-4 rounded-[16px] shadow-premium border border-[#E7DCC2] space-y-1.5 text-right">
          <p className="text-xs font-bold text-slate-500 font-arabic">نسبة التحويل</p>
          <h3 className="text-xl font-black text-sage-deep font-english">{metrics.conversionRate}%</h3>
          <p className="text-[11px] font-medium text-slate-500 font-arabic">معدل تحويل الزائر لمشترٍ</p>
        </div>

      </div>

      {/* قسم المخططات البيانية السبعة (7 Charts Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. تطور حجم المبيعات */}
        <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] space-y-4">
          <h4 className="text-sm font-bold text-ink font-arabic pr-2 border-r-4 border-[#E7A537]">تطور حجم المبيعات</h4>
          <div className="h-64">
            {mounted && salesProgressData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesProgressData}>
                  <XAxis dataKey="date" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 'bold', fontFamily: 'var(--font-cairo)' }} dy={5} />
                  <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 'bold' }} dx={-5} />
                  <Tooltip formatter={(v) => [`${v} ج.م`, 'المبيعات']} />
                  <Line type="monotone" dataKey="revenue" stroke="#0073E6" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-arabic">لا توجد بيانات</div>
            )}
          </div>
        </div>

        {/* 2. الطلبات حسب الحالة */}
        <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] space-y-4">
          <h4 className="text-sm font-bold text-ink font-arabic pr-2 border-r-4 border-[#E7A537]">توزيع الطلبات حسب الحالة</h4>
          <div className="h-64 flex items-center justify-center">
            {mounted && statusDonutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} طلب`, 'الحجم']} />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconSize={12}
                    formatter={(val) => <span className="text-[13px] font-bold text-ink font-arabic">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-xs font-arabic">لا توجد بيانات كافية</div>
            )}
          </div>
        </div>

        {/* 3. المنتجات الأكثر مبيعاً */}
        <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] space-y-4 lg:col-span-2">
          <h4 className="text-sm font-bold text-ink font-arabic pr-2 border-r-4 border-[#E7A537]">أفضل 10 منتجات مبيعاً بالكمية</h4>
          <div className="h-72">
            {mounted && topProductsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart 
                  layout="vertical" 
                  data={topProductsData}
                  margin={{ right: 10, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.25} horizontal={false} />
                  <XAxis type="number" stroke="#94A3B8" reversed={true} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 'bold' }} />
                  <YAxis dataKey="name" type="category" stroke="#94A3B8" orientation="right" tick={<CustomYAxisTick />} width={180} />
                  <Tooltip formatter={(v) => [`${v} قطعة`, 'الكمية']} />
                  <Bar dataKey="qty" fill="#E7A537" radius={[8, 0, 0, 8]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-arabic">لا توجد بيانات</div>
            )}
          </div>
        </div>

        {/* 4. إضافات السلة */}
        <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] space-y-4">
          <h4 className="text-sm font-bold text-ink font-arabic pr-2 border-r-4 border-[#E7A537]">المنتجات الأكثر إضافة إلى السلة</h4>
          <div className="h-64">
            {mounted && cartEventsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={cartEventsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.25} />
                  <XAxis dataKey="name" stroke="#94A3B8" height={55} interval={0} tick={<CustomXAxisTick />} />
                  <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 'bold' }} />
                  <Tooltip formatter={(v) => [`${v} مرة`, 'إضافة للسلة']} />
                  <Bar dataKey="count" fill="#E4573F" radius={[8, 8, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-arabic">لا توجد بيانات</div>
            )}
          </div>
        </div>

        {/* 5. مصادر الزيارات */}
        <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] space-y-4">
          <h4 className="text-sm font-bold text-ink font-arabic pr-2 border-r-4 border-[#E7A537]">مصادر الزيارات ونشاط القنوات</h4>
          <div className="h-64 flex items-center justify-center">
            {mounted && visitSourcesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={visitSourcesData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    labelLine={false}
                    dataKey="value"
                  >
                    {visitSourcesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} زائر`, 'عدد الزيارات']} />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconSize={12}
                    formatter={(val) => <span className="text-[13px] font-bold text-ink font-arabic">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-xs font-arabic">لا توجد بيانات</div>
            )}
          </div>
        </div>

        {/* 6. المحافظات الأكثر طلباً */}
        <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-ink font-arabic pr-2 border-r-4 border-[#E7A537]">المحافظات الأكثر طلباً</h4>
            <div className="flex gap-1 bg-slate-100 p-0.5 rounded-full border border-slate-200">
              <button
                onClick={() => setGovView('chart')}
                className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all duration-200 ${
                  govView === 'chart' ? 'bg-white text-ink shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                رسم بياني
              </button>
              <button
                onClick={() => setGovView('rank')}
                className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all duration-200 ${
                  govView === 'rank' ? 'bg-white text-ink shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                ترتيب المحافظات
              </button>
            </div>
          </div>
          <div className="h-64">
            {mounted && govOrdersData.length > 0 ? (
              govView === 'chart' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={govOrdersData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.25} />
                    <XAxis dataKey="governorate" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 'bold', fontFamily: 'var(--font-cairo)' }} />
                    <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 'bold' }} />
                    <Tooltip formatter={(v) => [`${v} طلب`, 'الطلبات']} />
                    <Bar dataKey="orders" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="space-y-2 h-full overflow-y-auto pr-1 no-scrollbar">
                  {govOrdersData.map((item, idx) => {
                    const totalGovOrders = govOrdersData.reduce((sum, g) => sum + g.orders, 0);
                    const pct = totalGovOrders > 0 ? Math.round((item.orders / totalGovOrders) * 100) : 0;
                    const progressColor = idx === 0 ? 'bg-[#E7A537]' : (idx === 1 ? 'bg-[#8B5CF6]' : (idx === 2 ? 'bg-[#0073E6]' : 'bg-slate-400'));
                    const rankBadge = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `${idx + 1}`));
                    
                    return (
                      <div key={item.governorate} className="flex flex-col gap-1 p-2 rounded-[12px] hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all duration-200">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center font-bold font-arabic bg-slate-100 rounded-full text-slate-600 text-[10px]">
                              {rankBadge}
                            </span>
                            <span className="font-bold text-slate-800 font-arabic">{item.governorate}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-bold font-numbers">
                            <span className="text-ink">{item.orders} طلب</span>
                            <span className="text-slate-400">({pct}%)</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${progressColor} rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-arabic">لا توجد طلبات كافية بعد</div>
            )}
          </div>
        </div>

        {/* 7. متوسط قيمة الطلب بمرور الوقت */}
        <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] space-y-4">
          <h4 className="text-sm font-bold text-ink font-arabic pr-2 border-r-4 border-[#E7A537]">تطور متوسط قيمة الطلب (AOV)</h4>
          <div className="h-64">
            {mounted && avgOrderOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={avgOrderOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.25} />
                  <XAxis dataKey="date" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 'bold', fontFamily: 'var(--font-cairo)' }} />
                  <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 'bold' }} />
                  <Tooltip formatter={(v) => [`${v} ج.م`, 'متوسط القيمة']} />
                  <Line type="linear" dataKey="avg" stroke="#E4573F" strokeWidth={2} dot={{ fill: '#E7A537' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-arabic">لا توجد بيانات</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
