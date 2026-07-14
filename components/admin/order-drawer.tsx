// components/admin/order-drawer.tsx
'use client';

import React, { useState } from 'react';
import { X, Phone, MessageCircle, Calendar, MapPin, Clipboard, DollarSign, Package, Download } from 'lucide-react';
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
  const [codInput, setCodInput] = useState<string>('');

  React.useEffect(() => {
    if (order) {
      setStatus(order.status);
      setCodInput(String(order.total_amount));
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

  const getWhatsAppMessage = () => {
    if (!order) return '';
    const name = order.customer_name;
    const orderId = order.id;
    const total = order.total_amount;
    const statusLabel = statusLabels[status] || status;

    let messageText = '';
    if (status === 'new') {
      messageText = `مرحباً يا ${name}، تم استلام طلبك رقم #${orderId} بنجاح في مكتبة الخضري بقيمة ${total} ج.م وجاري تجهيزه! شكراً لاختيارك لنا.`;
    } else if (status === 'confirmed') {
      messageText = `أهلاً يا ${name}، يسعدنا إعلامك بأنه تم تأكيد طلبك رقم #${orderId} من مكتبة الخضري. جاري تحضير الشحنة للتوصيل!`;
    } else if (status === 'shipping') {
      messageText = `مرحباً يا ${name}، طلبك رقم #${orderId} تم تسليمه لشركة الشحن ومندوب التوصيل سيتواصل معك قريباً لتسليم الشحنة.`;
    } else if (status === 'delivered') {
      messageText = `أهلاً يا ${name}، تم تسليم طلبك رقم #${orderId} بنجاح. نتمنى أن تعجبك المنتجات، شكراً لتعاملك مع مكتبة الخضري!`;
    } else if (status === 'cancelled') {
      messageText = `مرحباً يا ${name}، نود إعلامك بأنه تم إلغاء طلبك رقم #${orderId}. لمزيد من التفاصيل يرجى التواصل معنا.`;
    } else {
      messageText = `مرحباً يا ${name}، تحديث بخصوص طلبك رقم #${orderId}: حالة الطلب الحالية هي [${statusLabel}].`;
    }

    return encodeURIComponent(messageText);
  };

  const printInvoiceAsPDF = () => {
    if (!order) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('الرجاء السماح بالنوافذ المنبثقة لطباعة الفاتورة.');
      return;
    }

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 10px; font-weight: bold; text-align: right;">${item.name}</td>
        <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center;">${item.quantity}</td>
        <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: left;">${item.price} ج.م</td>
        <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-weight: bold;">${item.price * item.quantity} ج.م</td>
      </tr>
    `).join('');

    const invoiceHtml = `
      <html dir="rtl">
      <head>
        <title>فاتورة الطلب #${order.id}</title>
        <meta charset="utf-8" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Cairo', sans-serif; color: #1e293b; margin: 0; padding: 40px; background-color: #fff; }
          .invoice-box { max-w: 800px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 900; color: #0f172a; }
          .header p { margin: 5px 0 0 0; font-size: 14px; color: #64748b; }
          .meta-info { display: flex; justify-content: space-between; font-size: 12px; color: #475569; margin-top: 15px; }
          .customer-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; margin-bottom: 25px; }
          .customer-box h3 { margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #0f172a; }
          .customer-box p { margin: 5px 0; font-size: 13px; color: #334155; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
          th { background-color: #f1f5f9; font-weight: 700; text-align: right; border: 1px solid #e2e8f0; padding: 10px; }
          .footer { text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 50px; font-size: 11px; color: #94a3b8; }
          @media print {
            body { padding: 0; }
            .invoice-box { border: none; box-shadow: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <h1>مكتبة الخضري</h1>
            <p>فاتورة شراء للعميل</p>
            <div class="meta-info">
              <span>رقم الفاتورة: #${order.id}</span>
              <span>التاريخ: ${new Date(order.created_at).toLocaleDateString('ar-EG', { dateStyle: 'long' })}</span>
            </div>
          </div>
          
          <div class="customer-box">
            <h3>تفاصيل المستلم:</h3>
            <p><strong>اسم العميل:</strong> ${order.customer_name}</p>
            <p><strong>رقم الهاتف:</strong> ${order.customer_phone}</p>
            <p><strong>المحافظة / العنوان:</strong> ${order.governorate}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>المنتج / الباقة</th>
                <th style="text-align: center;">الكمية</th>
                <th style="text-align: left;">سعر القطعة</th>
                <th style="text-align: left;">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="display: flex; flex-direction: column; align-items: flex-end;">
            <div style="width: 250px; font-size: 13px; color: #475569;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>إجمالي المنتجات:</span>
                <strong>${itemsSubtotal} ج.م</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>تكلفة الشحن:</span>
                <strong>${shippingFee === 0 ? 'شحن مجاني' : `${shippingFee} ج.م`}</strong>
              </div>
              ${order.total_amount < itemsSubtotal + shippingFee ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #16a34a;">
                  <span>الخصم (كوبون):</span>
                  <strong>-${(itemsSubtotal + shippingFee) - order.total_amount} ج.م</strong>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 10px; margin-top: 10px; font-size: 15px; font-weight: bold; color: #0f172a;">
                <span>المبلغ المطلوب:</span>
                <span style="color: #c2410c; font-size: 18px;">${order.total_amount} ج.م</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>شكراً لثقتكم واختياركم مكتبة الخضري!</p>
            <p>info@alkhodary.eg  |  19000  |  alkhodary.eg</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  };

  const printShippingLabel = () => {
    if (!order) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('الرجاء السماح بالنوافذ المنبثقة لطباعة بوليصة الشحن.');
      return;
    }

    const itemsSummary = order.items.map(item => `
      <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding: 5px 0; font-size: 11px;">
        <span>${item.name}</span>
        <strong>× ${item.quantity}</strong>
      </div>
    `).join('');

    const labelHtml = `
      <html dir="rtl">
      <head>
        <title>بوليصة شحن #${order.id}</title>
        <meta charset="utf-8" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Cairo', sans-serif;
            color: #000;
            margin: 0;
            padding: 0;
            background-color: #fff;
            display: flex;
            justify-content: center;
            align-items: flex-start;
          }
          .label-container {
            width: 380px;
            padding: 18px;
            border: 2px dashed #000;
            border-radius: 8px;
            box-sizing: border-box;
            background-color: #fff;
            margin: 10px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .header h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 900;
          }
          .header p {
            margin: 2px 0 0 0;
            font-size: 11px;
            color: #333;
          }
          .section {
            border-bottom: 1px solid #000;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          .section-title {
            font-size: 10px;
            font-weight: bold;
            color: #555;
            margin-bottom: 3px;
            text-transform: uppercase;
          }
          .info-row {
            font-size: 13px;
            margin: 3px 0;
          }
          .bold-info {
            font-size: 15px;
            font-weight: 900;
          }
          .cod-box {
            background-color: #000;
            color: #fff;
            padding: 12px;
            text-align: center;
            border-radius: 6px;
            margin: 10px 0;
          }
          .cod-title {
            font-size: 11px;
            margin: 0 0 2px 0;
          }
          .cod-amount {
            font-size: 24px;
            font-weight: 900;
            margin: 0;
          }
          .barcode-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: 10px 0;
            border-bottom: 1px solid #000;
            padding-bottom: 10px;
          }
          .barcode-bars {
            display: flex;
            height: 40px;
            align-items: stretch;
          }
          .bar {
            background-color: #000;
            margin-right: 1px;
          }
          .packing-list {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 8px;
            border-radius: 6px;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .label-container { border: 2px dashed #000; margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <div class="header">
            <h1>مكتبة الخضري</h1>
            <p>بوليصة شحن طرد سريع</p>
          </div>

          <div class="barcode-container">
            <div class="barcode-bars">
              <!-- Simulated Barcode -->
              <div class="bar" style="width: 3px;"></div>
              <div class="bar" style="width: 1px; background-color: transparent;"></div>
              <div class="bar" style="width: 1px;"></div>
              <div class="bar" style="width: 2px; background-color: transparent;"></div>
              <div class="bar" style="width: 4px;"></div>
              <div class="bar" style="width: 1px; background-color: transparent;"></div>
              <div class="bar" style="width: 2px;"></div>
              <div class="bar" style="width: 3px; background-color: transparent;"></div>
              <div class="bar" style="width: 1px;"></div>
              <div class="bar" style="width: 2px; background-color: transparent;"></div>
              <div class="bar" style="width: 3px;"></div>
              <div class="bar" style="width: 1px; background-color: transparent;"></div>
              <div class="bar" style="width: 4px;"></div>
              <div class="bar" style="width: 2px; background-color: transparent;"></div>
              <div class="bar" style="width: 2px;"></div>
              <div class="bar" style="width: 1px; background-color: transparent;"></div>
              <div class="bar" style="width: 3px;"></div>
              <div class="bar" style="width: 2px; background-color: transparent;"></div>
              <div class="bar" style="width: 1px;"></div>
              <div class="bar" style="width: 4px; background-color: transparent;"></div>
              <div class="bar" style="width: 3px;"></div>
              <div class="bar" style="width: 1px; background-color: transparent;"></div>
              <div class="bar" style="width: 2px;"></div>
              <div class="bar" style="width: 1px; background-color: transparent;"></div>
              <div class="bar" style="width: 4px;"></div>
            </div>
            <div style="font-family: monospace; font-size: 11px; margin-top: 4px; font-weight: bold; letter-spacing: 2px;">
              KH-${order.id.toUpperCase()}
            </div>
          </div>

          <div class="section">
            <div class="section-title">الراسل (Sender)</div>
            <div class="info-row"><strong>مكتبة الخضري</strong></div>
            <div class="info-row">هاتف: 19000  |  موقع: alkhodary.eg</div>
          </div>

          <div class="section">
            <div class="section-title">المرسل إليه (Recipient)</div>
            <div class="info-row bold-info">${order.customer_name}</div>
            <div class="info-row bold-info">هاتف: ${order.customer_phone}</div>
            <div class="info-row"><strong>المحافظة:</strong> ${order.governorate}</div>
            <div class="info-row"><strong>العنوان بالتفصيل:</strong> ${order.governorate} - الاستلام من العنوان المسجل</div>
          </div>

          <div class="cod-box">
            <div class="cod-title">المبلغ المطلوب تحصيله عند الاستلام (COD)</div>
            <div class="cod-amount">${codInput || '0'} ج.م</div>
          </div>

          <div class="packing-list">
            <div class="section-title" style="margin-bottom: 5px;">محتويات الشحنة (Packing List)</div>
            ${itemsSummary}
          </div>

          <div style="text-align: center; font-size: 8px; margin-top: 15px; color: #555;">
            تطبع بواسطة نظام إدارة مكتبة الخضري الذكي
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(labelHtml);
    printWindow.document.close();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`تم نسخ ${label} إلى الحافظة!`);
  };

  const downloadInvoiceAsImage = () => {
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

    // 9. Convert to Blob & download directly
    canvas.toBlob((blob) => {
      if (!blob) {
        alert('حدث خطأ أثناء توليد الفاتورة كصورة.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${order.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
                    href={`https://wa.me/2${order.customer_phone}?text=${getWhatsAppMessage()}`}
                    target="_blank"
                    className="p-1 text-sage bg-[#DCEEE5] rounded-[8px] hover:bg-[#4F8F73]/10 transition-colors"
                    title="إرسال تحديث حالة الطلب عبر واتساب"
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
                        {(item as any).colors && (item as any).colors.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            <span className="text-[10px] text-slate-400 font-bold ml-1 font-arabic">الألوان:</span>
                            {(item as any).colors.map((c: string, idx: number) => (
                              <span key={idx} className="text-[9px] bg-amber/10 text-amber-deep font-bold px-1.5 py-0.5 rounded border border-amber/20 font-arabic">
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
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

            {/* تعديل مبلغ التحصيل عند الاستلام */}
            <div className="bg-[#FBEBCB]/15 p-4 rounded-[16px] border border-[#E7A537]/20 space-y-2 mt-3 text-right">
              <span className="block text-xs font-bold text-slate-600 font-arabic">المبلغ المطلوب تحصيله عند الاستلام (COD):</span>
              <div className="flex items-center gap-2.5">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={codInput}
                  onChange={(e) => {
                    const converted = e.target.value
                      .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632))
                      .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776));
                    const clean = converted.replace(/[^0-9]/g, '');
                    setCodInput(clean);
                  }}
                  className="py-2 px-3 bg-white rounded-input border border-[#E7DCC2] focus:border-[#E7A537] focus:outline-none text-xs font-english font-bold text-slate-800 w-28 text-center"
                />
                <span className="text-xs font-bold text-slate-600 font-arabic">ج.م</span>
                <span className="text-[10px] text-slate-400 font-arabic">(تغيير هذا المبلغ يؤثر على بوليصة الشحن المطبوعة فقط)</span>
              </div>
            </div>

          </div>

        </div>

        {/* الفوتر وأزرار الطباعة والتنبيهات */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 grid grid-cols-2 gap-2 shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="font-arabic text-xs py-2.5 flex items-center justify-center gap-1.5" 
            onClick={() => copyToClipboard(`
الطلب #${order.id}
العميل: ${order.customer_name}
الهاتف: ${order.customer_phone}
المحافظة: ${order.governorate}
المنتجات: ${order.items.map(i => `${i.name} (${i.quantity})`).join(', ')}
الإجمالي: ${order.total_amount} ج.م
            `, 'بيانات الشحن')}
          >
            <Clipboard className="w-4 h-4" />
            <span>نسخ البوليصة</span>
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="font-arabic text-xs py-2.5 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center gap-1.5"
            onClick={() => {
              const text = getWhatsAppMessage();
              window.open(`https://wa.me/2${order.customer_phone}?text=${text}`, '_blank');
            }}
          >
            <MessageCircle className="w-4 h-4" />
            <span>إرسال واتساب</span>
          </Button>

          <Button 
            variant="primary" 
            size="sm" 
            className="font-arabic text-xs py-2.5 flex items-center justify-center gap-1.5"
            onClick={downloadInvoiceAsImage}
          >
            <Download className="w-4 h-4" />
            <span>تنزيل كصورة</span>
          </Button>

          <Button 
            variant="secondary" 
            size="sm" 
            className="font-arabic text-xs py-2.5 flex items-center justify-center gap-1.5"
            onClick={printInvoiceAsPDF}
          >
            <DollarSign className="w-4 h-4" />
            <span>طباعة PDF</span>
          </Button>

          <Button 
            variant="primary" 
            size="sm" 
            className="col-span-2 font-arabic text-xs py-2.5 bg-amber hover:bg-amber-deep text-white border-amber hover:text-white flex items-center justify-center gap-1.5 shadow-sm"
            onClick={printShippingLabel}
          >
            <Package className="w-4 h-4" />
            <span>طباعة بوليصة الشحن (A6)</span>
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
