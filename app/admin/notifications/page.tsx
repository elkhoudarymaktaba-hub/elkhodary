// app/admin/notifications/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { 
  Bell, Check, Trash2, Calendar, ShoppingBag, UserCheck, Tag, Info, 
  AlertTriangle, MessageSquare, ShieldAlert, Phone, Mail, MessageCircle, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/lib/toast';

interface NotificationItem {
  id: string;
  text: string;
  time: string;
  type: 'order' | 'warning' | 'coupon' | 'user' | 'payment';
  read: boolean;
}

interface ContactSubmission {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  created_at: string;
  read: boolean;
}

interface AdminLogItem {
  id: string;
  text: string;
  time: string;
  adminName: string;
  action: string;
  read: boolean;
}

const initialNotifications: NotificationItem[] = [
  { id: '1', text: 'طلب جديد ORD-1011 من العميل سليمان الصاوي بقيمة 365 ج.م', time: 'منذ 5 دقائق', type: 'order', read: false },
  { id: '5', text: 'تم استلام الدفعة المالية للطلب ORD-1006 بقيمة 775 ج.م', time: 'منذ 3 ساعات', type: 'payment', read: true },
];

const initialAdminLogs: AdminLogItem[] = [
  { id: '2', text: 'تحذير المخزون: كتاب سلاح التلميذ لغة عربية قارب على النفاد (المخزون: 3 قطع)', time: 'منذ 25 دقيقة', adminName: 'النظام الآلي', action: 'المخزون', read: false },
  { id: '3', text: 'استخدم كوبون WELCOME للطلب ORD-1010 بقيمة 200 ج.م', time: 'منذ ساعة', adminName: 'النظام الآلي', action: 'كوبونات', read: true },
  { id: '4', text: 'تسجيل عميل جديد: كريم أشرف من محافظة المنوفية', time: 'منذ ساعتين', adminName: 'النظام الآلي', action: 'العملاء', read: false },
  { id: '7', text: 'كوبون الخصم FREE50 وصل إلى الحد الأقصى للاستخدام اليومي', time: 'منذ يومين', adminName: 'النظام الآلي', action: 'كوبونات', read: true },
  { id: '8', text: 'مخزون منخفض: مقلمة الروضة KG قاربت على الانتهاء', time: 'منذ يومين', adminName: 'النظام الآلي', action: 'المخزون', read: true },
  { id: 'l-1', text: 'تم تحديث صفحة "من نحن" بنجاح بواسطة المشرف الرئيسي', time: 'منذ يوم واحد', adminName: 'أحمد الخضري (المالك)', action: 'تعديل الصفحات', read: true },
  { id: 'l-2', text: 'تعديل حالة المدير "محمد علي" إلى مشرف بصلاحيات محدودة', time: 'منذ يومين', adminName: 'أحمد الخضري (المالك)', action: 'صلاحيات المدراء', read: true },
  { id: 'l-3', text: 'تغيير إعدادات الشحن: إضافة تسعيرة شحن جديدة لمحافظة الإسكندرية', time: 'منذ 3 أيام', adminName: 'أحمد الخضري (المالك)', action: 'إعدادات الشحن', read: true },
  { id: 'l-4', text: 'تحديث لوجو المتجر وشعار الشريط العلوي', time: 'منذ 4 أيام', adminName: 'أحمد الخضري (المالك)', action: 'إعدادات المتجر', read: true },
];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'messages' | 'admin_updates'>('orders');
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [adminLogs, setAdminLogs] = useState<AdminLogItem[]>(initialAdminLogs);
  const [messages, setMessages] = useState<ContactSubmission[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching contact messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // 1. إدارة الإشعارات والطلبات
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    showToast('تم التحديد كمقروء', 'success');
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    showToast('تم حذف الإشعار', 'success');
  };

  // 2. إدارة الرسائل الواردة
  const handleMarkMessageRead = async (id: string, currentRead: boolean) => {
    if (currentRead) return;
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ read: true })
        .eq('id', id);
      
      if (error) throw error;
      setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
      showToast('تم تمييز الرسالة كمقروءة', 'success');
    } catch (err) {
      console.error(err);
      showToast('فشل تحديث حالة الرسالة', 'error');
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذه الرسالة نهائياً؟')) return;
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== id));
      showToast('تم حذف الرسالة بنجاح', 'success');
    } catch (err) {
      console.error(err);
      showToast('فشل حذف الرسالة', 'error');
    }
  };

  // 3. إدارة تحديثات المدراء
  const handleMarkLogRead = (id: string) => {
    setAdminLogs(prev => prev.map(l => l.id === id ? { ...l, read: true } : l));
    showToast('تم التحديد كمقروء', 'success');
  };

  const handleDeleteLog = (id: string) => {
    setAdminLogs(prev => prev.filter(l => l.id !== id));
    showToast('تم حذف السجل', 'success');
  };

  // عمليات عامة
  const handleMarkAllAsRead = async () => {
    if (activeTab === 'orders') {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showToast('تم تحديد كل الإشعارات كمقروءة', 'success');
    } else if (activeTab === 'messages') {
      const unreadIds = messages.filter(m => !m.read).map(m => m.id);
      if (unreadIds.length === 0) return;
      try {
        const { error } = await supabase
          .from('contact_submissions')
          .update({ read: true })
          .in('id', unreadIds);
        if (error) throw error;
        setMessages(prev => prev.map(m => ({ ...m, read: true })));
        showToast('تم تحديد كل الرسائل كمقروءة', 'success');
      } catch (e) {
        console.error(e);
      }
    } else {
      setAdminLogs(prev => prev.map(l => ({ ...l, read: true })));
      showToast('تم تحديد كل السجلات كمقروءة', 'success');
    }
  };

  const handleClearAll = () => {
    if (!confirm('هل أنت متأكد من رغبتك في إفراغ كافة العناصر في هذا القسم؟')) return;
    if (activeTab === 'orders') {
      setNotifications([]);
    } else if (activeTab === 'messages') {
      // Clear messages mock delete
      setMessages([]);
    } else {
      setAdminLogs([]);
    }
    showToast('تم إفراغ القسم بنجاح', 'success');
  };

  const formatMessageTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* هيدر الصفحة */}
      <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-ink font-arabic flex items-center gap-2">
            <Bell className="w-5.5 h-5.5 text-amber" />
            <span>مركز الإشعارات والتنبيهات والرسائل</span>
          </h3>
          <p className="text-xs text-slate-400 font-arabic mt-1">تتبع نشاطات المتجر، رسائل تواصل العملاء، وسجلات مدراء النظام</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="font-arabic text-xs hover:bg-slate-50 border border-slate-200"
          >
            <Check className="w-4 h-4 ml-1.5" />
            <span>تعليم الكل كمقروء</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="font-arabic text-xs text-rose-500 hover:bg-rose-50 border border-rose-100"
          >
            <Trash2 className="w-4 h-4 ml-1.5" />
            <span>إفراغ القسم</span>
          </Button>
        </div>
      </div>

      {/* التبويبات الثلاثية الرئيسية */}
      <div className="grid grid-cols-3 gap-2 bg-[#F6F1E4] p-1.5 rounded-[16px] border border-[#E7DCC2] shadow-sm">
        <button
          onClick={() => { setActiveTab('orders'); setFilter('all'); }}
          className={`py-3 rounded-[12px] font-bold font-arabic text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-white text-ink shadow-md border border-[#E7DCC2]'
              : 'text-slate-500 hover:bg-white/50'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-amber shrink-0" />
          <span>الطلبات ({notifications.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('messages'); setFilter('all'); }}
          className={`py-3 rounded-[12px] font-bold font-arabic text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'messages'
              ? 'bg-white text-ink shadow-md border border-[#E7DCC2]'
              : 'text-slate-500 hover:bg-white/50'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-coral shrink-0" />
          <span>رسائل العملاء ({messages.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('admin_updates'); setFilter('all'); }}
          className={`py-3 rounded-[12px] font-bold font-arabic text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'admin_updates'
              ? 'bg-white text-ink shadow-md border border-[#E7DCC2]'
              : 'text-slate-500 hover:bg-white/50'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-sage shrink-0" />
          <span>التحديثات والتنبيهات ({adminLogs.length})</span>
        </button>
      </div>

      {/* التصفية الفرعية: مقروء / غير مقروء */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-xs font-bold font-arabic rounded-[12px] border transition-all ${
            filter === 'all'
              ? 'bg-ink text-white border-ink'
              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
          }`}
        >
          عرض الكل
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 text-xs font-bold font-arabic rounded-[12px] border transition-all ${
            filter === 'unread'
              ? 'bg-ink text-white border-ink'
              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
          }`}
        >
          عرض غير المقروء فقط
        </button>
      </div>

      {/* قائمة العناصر للتبويب النشط */}
      <div className="space-y-4">
        
        {/* 1. تبويب الطلبات والتنبيهات */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {notifications.filter(n => filter === 'all' || !n.read).length > 0 ? (
              notifications
                .filter(n => filter === 'all' || !n.read)
                .map((notif) => {
                  const getIcon = (type: string) => {
                    switch (type) {
                      case 'order': return <ShoppingBag className="w-5 h-5 text-amber" />;
                      case 'warning': return <AlertTriangle className="w-5 h-5 text-coral" />;
                      case 'coupon': return <Tag className="w-5 h-5 text-plum" />;
                      case 'user': return <UserCheck className="w-5 h-5 text-sage" />;
                      default: return <Info className="w-5 h-5 text-slate-500" />;
                    }
                  };

                  return (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-[16px] border shadow-sm transition-all flex items-start gap-4 hover:shadow-premium-hover ${
                        notif.read 
                          ? 'bg-white border-[#E7DCC2] opacity-80' 
                          : 'bg-[#FBEBCB]/15 border-[#E7DCC2]'
                      }`}
                    >
                      <div className="p-2.5 rounded-[12px] bg-white border border-[#E7DCC2] shadow-sm shrink-0">
                        {getIcon(notif.type)}
                      </div>

                      <div className="flex-1 space-y-1 mt-0.5">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-sm font-arabic font-bold text-slate-800 leading-snug">{notif.text}</p>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            {!notif.read && (
                              <button
                                onClick={() => handleMarkAsRead(notif.id)}
                                className="p-1 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded"
                                title="تعليم كمقروء"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(notif.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded"
                              title="حذف الإشعار"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="font-english">{notif.time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="bg-white py-16 text-center text-slate-400 font-arabic text-sm rounded-[16px] shadow-premium border border-[#E7DCC2] flex flex-col items-center justify-center gap-3">
                <Bell className="w-8 h-8 text-slate-300 animate-bounce" />
                <span>لا توجد تنبيهات أو طلبات مطابقة للفلتر المختار.</span>
              </div>
            )}
          </div>
        )}

        {/* 2. تبويب رسائل العملاء */}
        {activeTab === 'messages' && (
          <div className="space-y-3">
            {loadingMessages ? (
              <div className="text-center py-12 text-slate-400 font-arabic">جاري جلب الرسائل من قاعدة البيانات...</div>
            ) : messages.filter(m => filter === 'all' || !m.read).length > 0 ? (
              messages
                .filter(m => filter === 'all' || !m.read)
                .map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-5 rounded-[16px] border shadow-sm transition-all flex flex-col gap-4 hover:shadow-premium-hover ${
                      msg.read 
                        ? 'bg-white border-[#E7DCC2] opacity-85' 
                        : 'bg-white border-coral/30 border-r-4 border-r-coral'
                    }`}
                  >
                    {/* رأس الرسالة: اسم العميل والوقت */}
                    <div className="flex justify-between items-start border-b border-dashed border-paper-line pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-coral/10 text-coral-deep flex items-center justify-center font-bold text-sm shrink-0">
                          {msg.name[0] || 'ع'}
                        </div>
                        <div className="text-right">
                          <h4 className="font-extrabold text-sm text-ink">{msg.name}</h4>
                          <span className="text-[10px] text-slate-400">{formatMessageTime(msg.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* رد سريع عبر واتساب */}
                        <a
                          href={`https://wa.me/20${msg.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold transition-colors"
                          title="تواصل واتساب مباشرة"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>رد واتساب</span>
                        </a>

                        {!msg.read && (
                          <button
                            onClick={() => handleMarkMessageRead(msg.id, msg.read)}
                            className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-slate-50 rounded border border-slate-100 shadow-sm bg-white"
                            title="تحديد كمقروء"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-50 rounded border border-slate-100 shadow-sm bg-white"
                          title="حذف الرسالة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* محتوى الرسالة */}
                    <div className="bg-[#F6F1E4]/30 p-4 rounded-[12px] border border-paper-line text-sm text-slate-700 leading-relaxed font-arabic">
                      {msg.message}
                    </div>

                    {/* بيانات الاتصال */}
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-numbers pt-1">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{msg.phone}</span>
                      </div>
                      {msg.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{msg.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <div className="bg-white py-16 text-center text-slate-400 font-arabic text-sm rounded-[16px] shadow-premium border border-[#E7DCC2] flex flex-col items-center justify-center gap-3">
                <MessageSquare className="w-8 h-8 text-slate-300 animate-pulse" />
                <span>لا توجد رسائل واردة من العملاء حالياً.</span>
              </div>
            )}
          </div>
        )}

        {/* 3. تبويب تحديثات المدراء */}
        {activeTab === 'admin_updates' && (
          <div className="space-y-3">
            {adminLogs.filter(l => filter === 'all' || !l.read).length > 0 ? (
              adminLogs
                .filter(l => filter === 'all' || !l.read)
                .map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-[16px] border shadow-sm transition-all flex items-start gap-4 hover:shadow-premium-hover ${
                      log.read 
                        ? 'bg-white border-[#E7DCC2] opacity-80' 
                        : 'bg-[#4F8F73]/5 border-[#E7DCC2]'
                    }`}
                  >
                    <div className="p-2.5 rounded-[12px] bg-white border border-[#E7DCC2] shadow-sm shrink-0">
                      <ShieldAlert className="w-5 h-5 text-sage" />
                    </div>

                    <div className="flex-1 space-y-1 mt-0.5">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-sm font-arabic font-bold text-slate-800 leading-snug">{log.text}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1">بواسطة: {log.adminName} | القسم: {log.action}</p>
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          {!log.read && (
                            <button
                              onClick={() => handleMarkLogRead(log.id)}
                              className="p-1 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded"
                              title="تعليم كمقروء"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded"
                            title="حذف السجل"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="font-english">{log.time}</span>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="bg-white py-16 text-center text-slate-400 font-arabic text-sm rounded-[16px] shadow-premium border border-[#E7DCC2] flex flex-col items-center justify-center gap-3">
                <ShieldAlert className="w-8 h-8 text-slate-300 animate-spin" />
                <span>لا توجد سجلات تعديل مطابقة للفلتر المختار.</span>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
