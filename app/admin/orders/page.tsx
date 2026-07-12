// app/admin/orders/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { 
  Search, Calendar, MapPin, Eye, Filter, RefreshCw, X, ChevronRight, ChevronLeft 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getMockData, Order, ShippingRate } from '@/lib/mockData';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import OrderDrawer from '@/components/admin/order-drawer';
import { CustomDatePicker } from '@/components/ui/custom-date-picker';

const statusTabs = [
  { id: 'all', label: 'الكل' },
  { id: 'new', label: 'جديد' },
  { id: 'confirmed', label: 'مؤكد' },
  { id: 'shipping', label: 'مع شركة الشحن' },
  { id: 'delivered', label: 'تم التسليم' },
  { id: 'cancelled', label: 'ملغي' },
];

const statusColors: Record<string, string> = {
  new: 'bg-[#FBEBCB] text-[#C9862A] border border-[#E7A537]/20 rounded-full',
  confirmed: 'bg-[#EAE1F3] text-[#7A5C9E] border border-[#7A5C9E]/20 rounded-full',
  shipping: 'bg-indigo-50 text-[#2E3E63] border border-[#2E3E63]/20 rounded-full',
  delivered: 'bg-[#DCEEE5] text-[#396A56] border border-[#4F8F73]/20 rounded-full',
  cancelled: 'bg-[#FBE1DB] text-[#C43F2B] border border-[#E4573F]/20 rounded-full',
};

const statusLabels: Record<string, string> = {
  new: 'جديد',
  confirmed: 'مؤكد',
  shipping: 'مع شركة الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);

  // التبويب المختار
  const [activeTab, setActiveTab] = useState<string>('all');

  // البحث والفلترة
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGov, setSelectedGov] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // تفاصيل الطلب المختار
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // الصفحات والترتيب
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
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

    // ترتيب المبيعات بالتاريخ التنازلي كوضع افتراضي
    ordersList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setOrders(ordersList);
    setShippingRates(shippingList);
    setLoading(false);
  };

  const handleStatusUpdated = (orderId: string, newStatus: string) => {
    // تحديث الحالة فورياً في الواجهة (Optimistic UI)
    const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o);
    setOrders(updated);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus as any });
    }
  };

  // تصفية الطلبات بناءً على البحث والفلتر والتبويب
  const filteredOrders = orders.filter(order => {
    // 1. تصفية التبويب
    if (activeTab !== 'all' && order.status !== activeTab) {
      return false;
    }

    // 2. تصفية البحث بالرقم، الاسم، أو الهاتف
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchId = order.id.toLowerCase().includes(q);
      const matchName = order.customer_name.toLowerCase().includes(q);
      const matchPhone = order.customer_phone.includes(q);
      if (!matchId && !matchName && !matchPhone) return false;
    }

    // 3. تصفية المحافظة
    if (selectedGov !== 'all' && order.governorate !== selectedGov) {
      return false;
    }

    // 4. تصفية نطاق التاريخ
    if (startDate) {
      const orderDate = new Date(order.created_at);
      const start = new Date(startDate);
      if (orderDate < start) return false;
    }
    if (endDate) {
      const orderDate = new Date(order.created_at);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (orderDate > end) return false;
    }

    return true;
  });

  // حساب ترقيم الصفحات (Pagination)
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedGov('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* 1. أشرطة تبويب الحالات (Status Tabs) */}
      <div className="w-full overflow-x-auto scrollbar-none flex border-b border-[#E7DCC2] gap-2 bg-white px-4 pt-2 rounded-t-[16px] shadow-sm">
        {statusTabs.map((tab) => {
          const tabCount = tab.id === 'all' 
            ? orders.length 
            : orders.filter(o => o.status === tab.id).length;
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              className={`pb-4 px-4 text-sm font-semibold transition-all duration-200 border-b-2 font-arabic whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-[#E7A537] text-ink font-bold'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold font-english ${
                activeTab === tab.id 
                  ? 'bg-amber text-white' 
                  : 'bg-[#F6F1E4] text-ink-soft'
              }`}>
                {tabCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. البحث والفلترة المتقدمة (Filters Bar) */}
      <div className="bg-white p-5 rounded-b-[16px] shadow-premium border-x border-b border-[#E7DCC2] space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* حقل البحث */}
          <div className="relative md:col-span-2">
            <Input
              placeholder="ابحث برقم الطلب، اسم العميل، أو الهاتف..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>

          {/* فلتر المحافظة */}
          <div>
            <Select
              value={selectedGov}
              onChange={(e) => {
                setSelectedGov(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'كل المحافظات' },
                ...Array.from(new Set(orders.map(o => o.governorate))).map(gov => ({
                  value: gov,
                  label: gov
                }))
              ]}
            />
          </div>

          {/* أزرار تفريغ وفلترة */}
          <div className="flex gap-2">
            <button
              onClick={resetFilters}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-[12px] text-sm font-bold transition-all duration-200 font-arabic"
            >
              <X className="w-4 h-4" />
              <span>تفريغ الفلاتر</span>
            </button>
            <button
              onClick={fetchOrders}
              className="p-2.5 bg-amber-light hover:bg-amber/10 text-amber rounded-[12px] border border-amber/15 transition-all duration-200"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* فلاتر تاريخ مخصصة */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 bg-[#F6F1E4]/50 p-3.5 rounded-[16px] border border-[#E7DCC2]">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4.5 h-4.5 text-amber" />
            <span className="font-bold font-arabic text-xs text-ink">نطاق تاريخ التسجيل:</span>
          </div>
          <div className="flex items-center gap-3">
            <CustomDatePicker
              value={startDate}
              onChange={(val) => { setStartDate(val); setCurrentPage(1); }}
              label="من تاريخ"
              placeholder="اختر البداية"
            />

            <CustomDatePicker
              value={endDate}
              onChange={(val) => { setEndDate(val); setCurrentPage(1); }}
              label="إلى تاريخ"
              placeholder="اختر النهاية"
            />
          </div>
        </div>
      </div>

      {/* 3. جدول الطلبات (Orders Table Card) */}
      <div className="bg-white rounded-[16px] shadow-premium border border-[#E7DCC2] overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-ink">
            <svg className="animate-spin h-8 w-8 text-amber" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-bold font-arabic text-sm">جاري جلب الطلبات...</span>
          </div>
        ) : paginatedOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="bg-[#F6F1E4]/30 border-b border-[#E7DCC2] text-ink-soft font-arabic">
                  <th className="py-4 px-6 font-bold">رقم الطلب</th>
                  <th className="py-4 px-6 font-bold">اسم العميل</th>
                  <th className="py-4 px-6 font-bold">الهاتف</th>
                  <th className="py-4 px-6 font-bold">المحافظة</th>
                  <th className="py-4 px-6 font-bold">المنتجات</th>
                  <th className="py-4 px-6 font-bold">الإجمالي</th>
                  <th className="py-4 px-6 font-bold">الحالة</th>
                  <th className="py-4 px-6 font-bold">تاريخ التسجيل</th>
                  <th className="py-4 px-6 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-[#E7DCC2]">
                {paginatedOrders.map((order) => {
                  const productsSummary = order.items
                    .map(item => `${item.name} (${item.quantity})`)
                    .join(' - ');

                  return (
                    <tr key={order.id} className="hover:bg-[#FBEBCB]/15 transition-colors group">
                      <td className="py-4 px-6 font-bold font-english text-ink-soft text-xs">
                        #{order.id}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800 font-arabic">
                        {order.customer_name}
                      </td>
                      <td className="py-4 px-6 font-semibold font-english text-slate-600">
                        {order.customer_phone}
                      </td>
                      <td className="py-4 px-6 font-arabic text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {order.governorate}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-arabic max-w-xs truncate" title={productsSummary}>
                        {productsSummary}
                      </td>
                      <td className="py-4 px-6 font-black text-coral font-english">
                        {order.total_amount} ج.م
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={order.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            handleStatusUpdated(order.id, newStatus);
                            try {
                              await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-[12px] text-xs font-bold font-arabic focus:outline-none outline-none border cursor-pointer transition-colors ${statusColors[order.status]}`}
                        >
                          <option value="new">جديد</option>
                          <option value="confirmed">مؤكد</option>
                          <option value="shipping">مع الشحن</option>
                          <option value="delivered">تم التسليم</option>
                          <option value="cancelled">ملغي</option>
                        </select>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400 font-arabic">
                        {new Date(order.created_at).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDrawerOpen(true);
                          }}
                          className="px-3 py-1.5 bg-amber-light text-amber hover:bg-amber hover:text-white rounded-[8px] text-xs font-bold transition-all duration-200 font-arabic flex items-center justify-center gap-1 mx-auto"
                        >
                          <Eye className="w-4 h-4" />
                          <span>التفاصيل</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-slate-400 font-arabic text-sm space-y-2">
            <p>لا توجد أي طلبات تتطابق مع معايير البحث والفلترة.</p>
            <button onClick={resetFilters} className="text-amber hover:underline font-bold text-xs">تفريغ كل الفلاتر</button>
          </div>
        )}

        {/* أزرار التنقل بين الصفحات (Pagination) */}
        {totalPages > 1 && (
          <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-arabic">
              عرض الطلبات من {startIndex + 1} إلى {Math.min(startIndex + itemsPerPage, filteredOrders.length)} من إجمالي {filteredOrders.length} طلب
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 bg-white border border-slate-200 rounded-[8px] text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              <span className="text-xs font-bold text-ink font-english">
                {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1.5 bg-white border border-slate-200 rounded-[8px] text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* شريط التفاصيل الجانبي (Order Drawer) */}
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
