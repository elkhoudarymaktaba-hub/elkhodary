'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ClipboardList, Search, Download, Trash2, Eye, 
  CheckCircle2, AlertCircle, Clock, Calendar, Phone, FileDown, RefreshCw 
} from 'lucide-react';
import Image from 'next/image';

interface SupplyList {
  id: string;
  name: string;
  phone: string;
  file_url: string;
  notes?: string;
  status: 'new' | 'fulfilled' | 'cancelled';
  created_at: string;
}

export default function AdminSupplyListsPage() {
  const [lists, setLists] = useState<SupplyList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected list detail view modal
  const [selectedList, setSelectedList] = useState<SupplyList | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchLists = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('supply_lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;
      setLists(data || []);
    } catch (err: any) {
      console.error('Error fetching supply lists:', err);
      setError('حدث خطأ أثناء تحميل قوائم المستلزمات الإدارية.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'new' | 'fulfilled' | 'cancelled') => {
    setStatusUpdating(true);
    try {
      const { error: dbError } = await supabase
        .from('supply_lists')
        .update({ status: newStatus })
        .eq('id', id);

      if (dbError) throw dbError;

      // Update state
      setLists(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      if (selectedList && selectedList.id === id) {
        setSelectedList(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: any) {
      console.error('Error updating supply list status:', err);
      alert('حدث خطأ أثناء تحديث حالة الطلب.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDeleteList = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الطلب نهائياً؟')) return;

    try {
      const { error: dbError } = await supabase
        .from('supply_lists')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      setLists(prev => prev.filter(item => item.id !== id));
      setSelectedList(null);
    } catch (err: any) {
      console.error('Error deleting supply list:', err);
      alert('حدث خطأ أثناء حذف الطلب.');
    }
  };

  const filteredLists = lists.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.phone.includes(searchTerm) ||
    (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'fulfilled':
        return { text: 'تم التجهيز', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
      case 'cancelled':
        return { text: 'ملغي', className: 'bg-rose-500/10 text-rose-600 border-rose-500/20' };
      default:
        return { text: 'جديد', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse' };
    }
  };

  const isImageFile = (url: string) => {
    if (!url) return false;
    return (
      url.startsWith('data:image/') ||
      url.includes('images.unsplash.com') ||
      /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(url)
    );
  };

  return (
    <div className="space-y-6 font-arabic text-right" dir="rtl">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink flex items-center gap-2">
            <ClipboardList className="text-[#1E90FF]" />
            <span>قوائم مستلزمات المدارس المرفوعة</span>
          </h1>
          <p className="text-xs text-ink-soft/60 mt-1 font-bold">
            هنا يمكنك مشاهدة طلبات أولياء الأمور الذين قاموا برفع قوائم المستلزمات لتجهيزها وتلبيتها.
          </p>
        </div>
        <button
          onClick={fetchLists}
          className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-ink-soft border border-paper-line rounded-lg text-xs font-bold transition-all shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>تحديث البيانات</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-card border border-paper-line shadow-card flex items-center justify-between">
          <div>
            <p className="text-[10px] text-ink-soft/50 font-bold">إجمالي الطلبات</p>
            <h3 className="text-xl font-black text-ink font-numbers mt-1">{lists.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#1E90FF]">
            <ClipboardList size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-card border border-paper-line shadow-card flex items-center justify-between">
          <div>
            <p className="text-[10px] text-ink-soft/50 font-bold">الطلبات الجديدة</p>
            <h3 className="text-xl font-black text-amber font-numbers mt-1">
              {lists.filter(l => l.status === 'new').length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-card border border-paper-line shadow-card flex items-center justify-between">
          <div>
            <p className="text-[10px] text-ink-soft/50 font-bold">تم تجهيزها</p>
            <h3 className="text-xl font-black text-emerald-500 font-numbers mt-1">
              {lists.filter(l => l.status === 'fulfilled').length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="bg-white rounded-card border border-paper-line shadow-card overflow-hidden">
        
        {/* Search bar */}
        <div className="p-4 border-b border-paper-line flex items-center gap-3">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="ابحث باسم العميل، رقم الهاتف أو الملاحظات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-11 py-2.5 bg-paper rounded-lg border border-paper-line focus:outline-none text-xs font-bold"
            />
            <Search size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-ink-soft/40" />
          </div>
        </div>

        {/* Loading / Error / Table */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <svg className="animate-spin h-8 w-8 text-amber mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xs text-ink-soft/50 font-bold">جاري تحميل الطلبات...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-rose-500 space-y-2">
            <AlertCircle size={36} className="mx-auto" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        ) : filteredLists.length === 0 ? (
          <div className="py-20 text-center text-ink-soft/40 space-y-2">
            <ClipboardList size={36} className="mx-auto" />
            <p className="text-sm font-bold">لم يتم العثور على أي طلبات تطابق بحثك.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-paper text-ink-soft/60 text-[10px] uppercase tracking-wider font-extrabold border-b border-paper-line">
                  <th className="px-6 py-4">العميل</th>
                  <th className="px-6 py-4">رقم الهاتف</th>
                  <th className="px-6 py-4">تاريخ التقديم</th>
                  <th className="px-6 py-4">الملاحظات</th>
                  <th className="px-6 py-4">الحالة</th>
                  <th className="px-6 py-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-line text-xs font-bold text-ink">
                {filteredLists.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">{item.name}</td>
                    <td className="px-6 py-4 font-numbers">{item.phone}</td>
                    <td className="px-6 py-4 font-numbers flex items-center gap-1.5 text-slate-500">
                      <Calendar size={12} />
                      <span>{new Date(item.created_at).toLocaleDateString('ar-EG', { dateStyle: 'short' })}</span>
                    </td>
                    <td className="px-6 py-4 max-w-[200px] truncate text-slate-500">
                      {item.notes || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${getStatusBadge(item.status).className}`}>
                        {getStatusBadge(item.status).text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedList(item)}
                          className="p-1.5 hover:bg-blue-50 text-[#1E90FF] rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          title="عرض التفاصيل والملف"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteList(item.id)}
                          className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                          title="حذف الطلب"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal View Detail Detail */}
      {selectedList && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card shadow-2xl border border-paper-line w-full max-w-3xl overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-paper-line bg-slate-50 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-ink flex items-center gap-2">
                <Eye className="text-ink-soft" />
                <span>تفاصيل طلب قائمة المستلزمات</span>
              </h3>
              <button
                onClick={() => setSelectedList(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Client Info Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-extrabold">الاسم بالكامل</p>
                  <p className="text-sm font-black text-ink">{selectedList.name}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-extrabold">رقم الهاتف</p>
                  <p className="text-sm font-black text-ink font-numbers flex items-center gap-2">
                    <Phone size={14} className="text-emerald-500" />
                    <span>{selectedList.phone}</span>
                  </p>
                </div>
              </div>

              {/* Status Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] text-slate-400 font-extrabold">حالة الطلب الحالية</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-black border mt-1.5 ${getStatusBadge(selectedList.status).className}`}>
                    {getStatusBadge(selectedList.status).text}
                  </span>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    disabled={statusUpdating}
                    onClick={() => handleUpdateStatus(selectedList.id, 'fulfilled')}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                  >
                    تحديد كـ "تم التجهيز"
                  </button>
                  <button
                    disabled={statusUpdating}
                    onClick={() => handleUpdateStatus(selectedList.id, 'new')}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                  >
                    تحديد كـ "جديد"
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-slate-400 font-extrabold">الملاحظات والتعليمات الخاصة بالعميل</p>
                <div className="p-3 bg-paper rounded-lg border border-paper-line text-xs font-bold text-ink leading-relaxed">
                  {selectedList.notes || 'لا يوجد ملاحظات إضافية.'}
                </div>
              </div>

              {/* File details details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-400 font-extrabold">ملف القائمة المرفق</p>
                  <a
                    href={selectedList.file_url}
                    download={`supply-list-${selectedList.name}.jpg`}
                    className="flex items-center gap-1.5 text-xs text-ink-soft hover:underline font-bold"
                  >
                    <Download size={14} />
                    <span>تحميل الملف بالكامل</span>
                  </a>
                </div>

                {/* File preview */}
                <div className="border border-paper-line rounded-card overflow-hidden bg-slate-50 flex items-center justify-center p-4 max-h-[300px]">
                  {isImageFile(selectedList.file_url) ? (
                    <img
                      src={selectedList.file_url}
                      alt="قائمة المستلزمات المرفوعة"
                      className="max-h-[280px] object-contain rounded border border-paper-line shadow-sm"
                    />
                  ) : (
                    <div className="py-12 text-center space-y-3">
                      <FileDown size={44} className="text-[#1E90FF] mx-auto animate-bounce" />
                      <p className="text-xs text-ink-soft font-bold">الملف المرفوع مستند (PDF أو غيره من الصيغ)</p>
                      <a
                        href={selectedList.file_url}
                        download={`supply-list-${selectedList.name}`}
                        className="inline-block px-5 py-2 bg-[#1E90FF] text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        تحميل المستند للمشاهدة
                      </a>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-paper-line flex justify-end gap-2">
              <button
                onClick={() => handleDeleteList(selectedList.id)}
                className="px-4 py-2 text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-lg text-xs font-bold transition-all"
              >
                حذف الطلب نهائياً
              </button>
              <button
                onClick={() => setSelectedList(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
