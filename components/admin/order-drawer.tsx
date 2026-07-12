// components/admin/order-drawer.tsx
'use client';

import React, { useState } from 'react';
import { X, Phone, MessageCircle, Calendar, MapPin, Clipboard, DollarSign, Package, Share2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { Order, ShippingRate } from '@/lib/mockData';
import { supabase } from '@/lib/supabase';
import { useRole } from '@/lib/useRole';

interface OrderDrawerProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: (orderId: string, newStatus: string) => void;
  shippingRates: ShippingRate[];
}

const statusLabels: Record<string, string> = {
  new: 'جديد',
  confirmed: 'مؤكد',
  shipping: 'مع شركة الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

const statusColors: Record<string, string> = {
  new: 'bg-[#FBEBCB] text-[#C9862A] border border-[#E7A537]/20 rounded-full',
  confirmed: 'bg-[#EAE1F3] text-[#7A5C9E] border border-[#7A5C9E]/20 rounded-full',
  shipping: 'bg-indigo-50 text-[#2E3E63] border border-[#2E3E63]/20 rounded-full',
  delivered: 'bg-[#DCEEE5] text-[#396A56] border border-[#4F8F73]/20 rounded-full',
  cancelled: 'bg-[#FBE1DB] text-[#C43F2B] border border-[#E4573F]/20 rounded-full',
};

export default function OrderDrawer({
  order,
  isOpen,
  onClose,
  onStatusUpdated,
  shippingRates,
}: OrderDrawerProps) {
  const { checkPermission } = useRole();
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<string>('');

  React.useEffect(() => {
    if (order) {
      setStatus(order.status);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  // إيجاد سعر الشحن لهذه المحافظة
  const rate = shippingRates.find((r) => r.governorate === order.governorate);
  const shippingFee = rate ? Number(rate.shipping_fee) : 0;
  
  // حساب المجموع الكلي للسلع
  const itemsSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // تحديث حالة الطلب
  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (!checkPermission(['order_manager'], 'تحديث حالة الطلب')) return;
    setUpdating(true);
    try {
      // تعديل حالة الطلب في سوبابيس
      await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
      setStatus(newStatus);
      onStatusUpdated(order.id, newStatus);
    } catch (err) {
      console.error('Error updating order status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`تم نسخ ${label} إلى الحافظة!`);
  };

  const shareInvoiceAsImage = () => {
    if (!order) return;

    // 1. Create a canvas dynamically
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Define dimensions
    const width = 600;
    const itemHeight = 40;
    const itemsCount = order.items.length;
    const height = 540 + (itemsCount * itemHeight);
    
    // Support High DPI displays
    canvas.width = width;
    canvas.height = height;

    // 2. Draw background (Cream Paper style)
    ctx.fillStyle = '#F6F1E4';
    ctx.fillRect(0, 0, width, height);

    // Inner border
    ctx.strokeStyle = '#E7DCC2';
    ctx.lineWidth = 10;
    ctx.strokeRect(15, 15, width - 30, height - 30);

    ctx.strokeStyle = '#16233F';
    ctx.lineWidth = 1;
    ctx.strokeRect(25, 25, width - 50, height - 50);

    // 3. Draw Header Title: مكتبة الخضري
    ctx.fillStyle = '#16233F';
    ctx.textAlign = 'center';
    
    // Title
    ctx.font = 'bold 28px Cairo, Arial, sans-serif';
    ctx.fillText('مكتبة الخضري', width / 2, 75);

    // Subtitle
    ctx.font = '14px Cairo, Arial, sans-serif';
    ctx.fillStyle = '#6B7796';
    ctx.fillText('فاتورة شراء رقمية للمستلم', width / 2, 105);

    // Separator line
    ctx.strokeStyle = '#E7DCC2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 125);
    ctx.lineTo(width - 40, 125);
    ctx.stroke();

    // 4. Draw Invoice Metadata (RTL align)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#16233F';
    ctx.font = 'bold 13px Cairo, Arial, sans-serif';
    
    // Order ID
    ctx.fillText(`رقم الفاتورة: #${order.id}`, width - 50, 160);
    // Date
    const formattedDate = new Date(order.created_at).toLocaleDateString('ar-EG', { dateStyle: 'long' });
    ctx.fillText(`التاريخ: ${formattedDate}`, width - 50, 185);

    // Round rect helper for older canvas
    const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
    };

    // 5. Draw Customer Box
    ctx.fillStyle = '#FFFFFF';
    drawRoundRect(40, 210, width - 80, 100, 12);
    ctx.strokeStyle = '#E7DCC2';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#16233F';
    ctx.font = 'bold 13px Cairo, Arial, sans-serif';
    ctx.fillText('تفاصيل المستلم:', width - 60, 240);

    ctx.font = '12px Cairo, Arial, sans-serif';
    ctx.fillStyle = '#2E3E63';
    ctx.fillText(`اسم العميل: ${order.customer_name}`, width - 60, 265);
    ctx.fillText(`رقم الهاتف: ${order.customer_phone}  |  المحافظة: ${order.governorate}`, width - 60, 290);

    // 6. Draw Items Box
    ctx.fillStyle = '#16233F';
    ctx.font = 'bold 13px Cairo, Arial, sans-serif';
    ctx.fillText('محتويات الأوردر:', width - 50, 340);

    // Table Header
    let currentY = 360;
    ctx.fillStyle = '#FFFFFF';
    drawRoundRect(40, currentY, width - 80, 30, 8);
    ctx.strokeStyle = '#E7DCC2';
    ctx.stroke();

    ctx.fillStyle = '#16233F';
    ctx.font = 'bold 11px Cairo, Arial, sans-serif';
    // Draw columns headers (RTL aligned x offsets)
    ctx.fillText('اسم المنتج / الباقة', width - 60, currentY + 20);
    ctx.textAlign = 'center';
    ctx.fillText('الكمية', width / 2 + 30, currentY + 20);
    ctx.textAlign = 'left';
    ctx.fillText('السعر', 180, currentY + 20);
    ctx.fillText('الإجمالي', 65, currentY + 20);

    // Draw item rows
    order.items.forEach((item, idx) => {
      currentY += itemHeight;
      ctx.fillStyle = '#FFFFFF';
      drawRoundRect(40, currentY, width - 80, 35, 6);
      ctx.strokeStyle = '#E7DCC2';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.fillStyle = '#16233F';
      ctx.font = 'bold 11px Cairo, Arial, sans-serif';
      ctx.fillText(item.name, width - 60, currentY + 22);

      ctx.textAlign = 'center';
      ctx.font = '11px Arial, sans-serif';
      ctx.fillText(String(item.quantity), width / 2 + 30, currentY + 22);

      ctx.textAlign = 'left';
      ctx.fillText(`${item.price} ج.م`, 180, currentY + 22);
      ctx.fillText(`${item.price * item.quantity} ج.م`, 65, currentY + 22);
    });

    // 7. Draw Totals Box
    currentY += 55;
    ctx.fillStyle = '#FFFFFF';
    drawRoundRect(40, currentY, width - 80, 110, 12);
    ctx.strokeStyle = '#E7DCC2';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'right';
    ctx.fillStyle = '#6B7796';
    ctx.font = '12px Cairo, Arial, sans-serif';
    ctx.fillText('إجمالي المنتجات:', width - 60, currentY + 30);
    ctx.fillText('سعر الشحن والتوصيل:', width - 60, currentY + 55);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#16233F';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillText(`${itemsSubtotal} ج.م`, 60, currentY + 30);
    ctx.fillText(shippingFee === 0 ? 'شحن مجاني' : `${shippingFee} ج.م`, 60, currentY + 55);

    // Final total row
    ctx.strokeStyle = '#E7DCC2';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, currentY + 70);
    ctx.lineTo(width - 50, currentY + 70);
    ctx.stroke();

    ctx.textAlign = 'right';
    ctx.fillStyle = '#16233F';
    ctx.font = 'bold 13px Cairo, Arial, sans-serif';
    ctx.fillText('الإجمالي النهائي المطلوب:', width - 60, currentY + 95);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#C43F2B'; // Coral red
    ctx.font = 'black 16px Arial, sans-serif';
    ctx.fillText(`${order.total_amount} ج.م`, 60, currentY + 95);

    // 8. Footer brand message
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6B7796';
    ctx.font = 'bold 10px Cairo, Arial, sans-serif';
    ctx.fillText('شكراً لثقتكم واختياركم مكتبة الخضري!', width / 2, currentY + 145);
    ctx.font = '9px Arial, sans-serif';
    ctx.fillText('info@alkhodary.eg  |  19000  |  alkhodary.eg', width / 2, currentY + 160);

    // 9. Convert to Blob & share
    canvas.toBlob(async (blob) => {
      if (!blob) {
        alert('حدث خطأ أثناء توليد الفاتورة كصورة.');
        return;
      }
      try {
        const file = new File([blob], `invoice-${order.id}.png`, { type: 'image/png' });
        
        // Check if Web Share API is available and supports files
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `فاتورة طلب مكتبة الخضري #${order.id}`,
            text: `فاتورة شراء العميل ${order.customer_name} من مكتبة الخضري`,
          });
        } else {
          // Fallback: download the image
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `invoice-${order.id}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          alert('تم تحميل صورة الفاتورة بنجاح لعدم دعم متصفحك للمشاركة المباشرة.');
        }
      } catch (err) {
        console.error('Error sharing invoice:', err);
        alert('تم إلغاء عملية مشاركة الصورة.');
      }
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-start p-0 overflow-hidden" dir="rtl">
      {/* الخلفية المظلمة */}
      <div 
        className="fixed inset-0 bg-[#16233F]/45 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* لوحة الدرج الجانبي */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-[0_4px_32px_rgba(22,35,63,0.18)] flex flex-col border-r border-[#E7DCC2] animate-in slide-in-from-left duration-300 z-10">
        
        {/* الهيدر */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-[#F6F1E4]/40">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-ink font-arabic">تفاصيل الطلب</h3>
              <span className="text-sm font-english text-ink-muted font-bold">#{order.id}</span>
            </div>
            <p className="text-xs text-ink-muted font-arabic mt-1">
              تم التسجيل في {new Date(order.created_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* المحتوى */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-right scrollbar-thin">
          
          {/* حالة الطلب وتغييرها */}
          <div className="bg-[#FBEBCB]/15 p-4 rounded-[16px] border border-[#E7A537]/20 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-ink font-arabic">حالة الطلب الحالية</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold font-arabic ${statusColors[status]}`}>
                {statusLabels[status]}
              </span>
            </div>
            
            <div className="h-px bg-[#E7DCC2]" />

            <Select
              label="تغيير حالة الطلب"
              value={status}
              onChange={handleStatusChange}
              disabled={updating}
              options={[
                { value: 'new', label: 'جديد' },
                { value: 'confirmed', label: 'مؤكد' },
                { value: 'shipping', label: 'مع شركة الشحن' },
                { value: 'delivered', label: 'تم التسليم' },
                { value: 'cancelled', label: 'ملغي' }
              ]}
            />
          </div>

          {/* بيانات العميل */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-ink border-r-4 border-amber pr-2 font-arabic">
              بيانات العميل والتوصيل
            </h4>
            <div className="bg-white border border-[#E7DCC2] rounded-[16px] p-4 shadow-sm space-y-3.5">
              
              {/* اسم العميل */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-arabic">اسم العميل:</span>
                <span className="font-bold text-slate-800 font-arabic">{order.customer_name}</span>
              </div>

              {/* الهاتف مع أزرار الإجراء السريع */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-arabic">رقم الهاتف:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 font-english">{order.customer_phone}</span>
                  <a 
                    href={`tel:${order.customer_phone}`}
                    className="p-1 text-amber bg-[#FBEBCB]/30 rounded-[8px] hover:bg-amber hover:text-white transition-colors"
                    title="اتصال مباشر"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <a 
                    href={`https://wa.me/2${order.customer_phone}`}
                    target="_blank"
                    className="p-1 text-sage bg-[#DCEEE5] rounded-[8px] hover:bg-[#4F8F73]/10 transition-colors"
                    title="مراسلة عبر واتساب"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* المحافظة */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-arabic">المحافظة / التوصيل:</span>
                <div className="flex items-center gap-1.5 text-slate-800 font-bold font-arabic">
                  <MapPin className="w-4 h-4 text-coral" />
                  <span>{order.governorate}</span>
                </div>
              </div>

            </div>
          </div>

          {/* محتويات الطلب (المنتجات) */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-ink border-r-4 border-[#E7A537] pr-2 font-arabic">
              المنتجات المشتراة
            </h4>
            <div className="bg-white border border-[#E7DCC2] rounded-[16px] overflow-hidden shadow-sm">
              <div className="divide-y divide-[#E7DCC2]">
                {order.items.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 border border-[#E7DCC2] rounded-[8px] flex items-center justify-center text-xl">
                        {item.type === 'box' ? '📬' : '📖'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 font-arabic leading-snug">{item.name}</p>
                        <p className="text-xs text-ink-muted font-arabic mt-1">
                          الكمية: {item.quantity} × <span className="font-english font-medium">{item.price} ج.م</span>
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-800 font-english shrink-0">
                      {item.price * item.quantity} ج.م
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* تفاصيل الحساب والتكلفة */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-ink border-r-4 border-[#E7A537] pr-2 font-arabic">
              تفصيل الفاتورة المالية
            </h4>
            <div className="bg-white border border-[#E7DCC2] rounded-[16px] p-4 shadow-sm space-y-3">
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-arabic">إجمالي المنتجات:</span>
                <span className="font-semibold text-slate-700 font-english">{itemsSubtotal} ج.م</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-arabic">سعر التوصيل للمحافظة:</span>
                <span className="font-semibold text-slate-700 font-english">
                  {shippingFee === 0 ? 'مجاني' : `${shippingFee} ج.م`}
                </span>
              </div>

              {/* إذا كان المجموع لا يساوي إجمالي الطلب، فهناك كود خصم مطبق */}
              {order.total_amount < itemsSubtotal + shippingFee && (
                <div className="flex justify-between items-center text-sm text-emerald-600">
                  <span className="font-arabic">قيمة الخصم (كوبون):</span>
                  <span className="font-semibold font-english">
                    -{(itemsSubtotal + shippingFee) - order.total_amount} ج.م
                  </span>
                </div>
              )}

              <div className="h-px bg-[#E7DCC2]" />

              <div className="flex justify-between items-center">
                <span className="font-bold text-ink font-arabic">الإجمالي النهائي:</span>
                <span className="text-lg font-black text-coral font-english">{order.total_amount} ج.م</span>
              </div>

            </div>
          </div>

        </div>

        {/* الفوتر وأزرار الطباعة */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2 flex-wrap sm:flex-nowrap">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 font-arabic text-xs py-2.5" 
            onClick={() => copyToClipboard(`
الطلب #${order.id}
العميل: ${order.customer_name}
الهاتف: ${order.customer_phone}
المحافظة: ${order.governorate}
المنتجات: ${order.items.map(i => `${i.name} (${i.quantity})`).join(', ')}
الإجمالي: ${order.total_amount} ج.م
            `, 'بيانات الشحن')}
          >
            <Clipboard className="w-4 h-4 ml-1.5" />
            <span>نسخ البوليصة</span>
          </Button>

          <Button 
            variant="primary" 
            size="sm" 
            className="flex-1 font-arabic text-xs py-2.5"
            onClick={shareInvoiceAsImage}
          >
            <Share2 className="w-4 h-4 ml-1.5" />
            <span>مشاركة كصورة</span>
          </Button>

          <Button 
            variant="secondary" 
            size="sm" 
            className="flex-1 font-arabic text-xs py-2.5"
            onClick={() => window.print()}
          >
            <DollarSign className="w-4 h-4 ml-1.5" />
            <span>طباعة الفاتورة</span>
          </Button>
        </div>

      </div>

      {/* 🧾 بوليصة الفاتورة الرسمية للطباعة فقط (Hidden in Web, Visible in Print) */}
      <div id="invoice-print-area" className="hidden print:block text-right p-10 font-arabic bg-white text-slate-800" style={{ direction: 'rtl' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            /* إخفاء العناصر الكبرى غير الطباعية فقط (تجنب إخفاء main لأن الدرج جزء منه) */
            aside, header, nav, footer, button, .no-print {
              display: none !important;
            }
            html, body, main {
              height: auto !important;
              min-height: auto !important;
              overflow: visible !important;
              background-color: white !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            body * {
              visibility: hidden !important;
            }
            #invoice-print-area, #invoice-print-area * {
              visibility: visible !important;
            }
            #invoice-print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              display: block !important;
              margin: 0 !important;
              padding: 0 !important;
              background-color: white !important;
            }
            /* تهيئة البوابات لـ Radix */
            div[data-radix-portal], [role="dialog"], [data-state="open"] {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              min-height: auto !important;
              overflow: visible !important;
              background: transparent !important;
              box-shadow: none !important;
              border: none !important;
            }
          }
        ` }} />
        
        {/* هيدر الفاتورة */}
        <div className="text-center border-b-2 border-slate-900 pb-5 mb-6">
          <h1 className="text-2xl font-bold text-slate-900">مكتبة الخضري</h1>
          <p className="text-sm text-slate-500 mt-1">فاتورة شراء رقمية - لوحة الإشراف</p>
          <div className="mt-4 flex justify-between text-xs text-slate-600 font-english">
            <span>رقم الفاتورة: #{order.id}</span>
            <span>التاريخ: {new Date(order.created_at).toLocaleDateString('ar-EG', { dateStyle: 'long' })}</span>
          </div>
        </div>

        {/* بيانات العميل */}
        <div className="bg-slate-50 p-5 rounded-[12px] mb-6 text-sm border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-3 text-base">تفاصيل المستلم:</h3>
          <p className="mb-2"><strong>اسم العميل:</strong> {order.customer_name}</p>
          <p className="mb-2"><strong>رقم الهاتف:</strong> {order.customer_phone}</p>
          <p><strong>المحافظة / العنوان:</strong> {order.governorate}</p>
        </div>

        {/* جدول المنتجات */}
        <div className="mb-8">
          <h3 className="font-bold text-slate-900 mb-3 text-base">تفاصيل الأوردر (محتويات الطلب):</h3>
          <table className="w-full border-collapse text-sm text-right">
            <thead>
              <tr className="border-b border-slate-900 text-slate-700 bg-slate-100/50">
                <th className="py-2.5 px-3">المنتج / الباقة</th>
                <th className="py-2.5 px-3 text-center">الكمية</th>
                <th className="py-2.5 px-3 text-left">سعر القطعة</th>
                <th className="py-2.5 px-3 text-left">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 px-3 font-bold">{item.name}</td>
                  <td className="py-3 px-3 text-center font-english">{item.quantity}</td>
                  <td className="py-3 px-3 text-left font-english">{item.price} ج.م</td>
                  <td className="py-3 px-3 text-left font-english">{item.price * item.quantity} ج.م</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* الحساب المالي النهائي */}
        <div className="border-t border-slate-900 pt-5 flex flex-col items-end text-sm space-y-2.5">
          <div className="flex gap-4">
            <span className="text-slate-500">إجمالي المنتجات:</span>
            <span className="font-english font-bold">{itemsSubtotal} ج.م</span>
          </div>
          <div className="flex gap-4">
            <span className="text-slate-500">تكلفة التوصيل الشحن:</span>
            <span className="font-english font-bold">{shippingFee === 0 ? 'شحن مجاني' : `${shippingFee} ج.م`}</span>
          </div>
          {order.total_amount < itemsSubtotal + shippingFee && (
            <div className="text-emerald-600 flex gap-4">
              <span>الخصومات المطبقة (كوبون):</span>
              <span className="font-english font-bold">-{(itemsSubtotal + shippingFee) - order.total_amount} ج.م</span>
            </div>
          )}
          <div className="h-px bg-slate-900 w-48 my-2" />
          <div className="text-xl font-bold text-slate-900 flex gap-4">
            <span>الإجمالي النهائي المطلوب:</span>
            <span className="font-english font-black text-2xl text-coral">{order.total_amount} ج.م</span>
          </div>
        </div>

        {/* فوتر الفاتورة المطبوعة */}
        <div className="text-center border-t border-slate-200 pt-6 mt-20 text-xs text-slate-400">
          <p className="font-bold">شكراً لثقتكم واختياركم مكتبة الخضري!</p>
          <p className="mt-1 font-english">info@alkhodary.eg | 19000 | alkhodary.eg</p>
        </div>
      </div>

    </div>
  );
}
