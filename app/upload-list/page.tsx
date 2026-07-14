'use client';

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowLeft, Paperclip } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { trackClientEvent } from '@/lib/tracking';

export default function UploadListPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    // Limit file size to 10MB (compression will shrink it anyway)
    if (file.size > 10 * 1024 * 1024) {
      setError('حجم الملف كبير جداً. الحد الأقصى هو 10 ميجابايت.');
      return;
    }

    setFileName(file.name);
    setError(null);

    // If it's an image, compress and convert to WebP/JPEG using Canvas
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            try {
              // Try WebP first
              const dataUrl = canvas.toDataURL('image/webp', 0.6);
              setFileBase64(dataUrl);
              setFileSize(((dataUrl.length * 0.75) / 1024 / 1024).toFixed(2) + ' MB (مضغوط)');
            } catch (e) {
              // Fallback to JPEG
              const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
              setFileBase64(dataUrl);
              setFileSize(((dataUrl.length * 0.75) / 1024 / 1024).toFixed(2) + ' MB (مضغوط)');
            }
          } else {
            setFileBase64(event.target?.result as string);
            setFileSize((file.size / 1024 / 1024).toFixed(2) + ' MB');
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      // PDF or other documents (no compression)
      setFileSize((file.size / 1024 / 1024).toFixed(2) + ' MB');
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFileBase64(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fileBase64) {
      setError('يرجى اختيار أو سحب ملف قائمة المستلزمات أولاً.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        name,
        phone,
        file_url: fileBase64,
        notes: notes || '',
        status: 'new',
        created_at: new Date().toISOString()
      };

      const { error: dbError } = await supabase.from('supply_lists').insert([payload]);

      if (dbError) throw dbError;

      // Track the conversion event
      trackClientEvent('Lead', {
        category: 'SupplyList',
        name: name,
        phone: phone
      });

      setSuccess(true);
      setName('');
      setPhone('');
      setNotes('');
      setFileBase64(null);
      setFileName(null);
      setFileSize(null);
    } catch (err: any) {
      console.error('Error uploading supply list:', err);
      setError('حدث خطأ أثناء إرسال طلبك. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper py-12 px-4 sm:px-6 lg:px-8 font-arabic">
      <div className="max-w-2xl mx-auto">
        
        {/* Back Link */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-ink-soft hover:text-ink transition-colors text-xs font-bold">
            <ArrowLeft size={14} className="rotate-180" />
            <span>العودة إلى الرئيسية</span>
          </Link>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-card shadow-card border border-paper-line overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-ink-soft to-[#1a5fdf] p-6 sm:p-8 text-white text-center relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <h1 className="text-xl sm:text-2xl font-black mb-2">ارفع قائمة مستلزمات طفلك</h1>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-md mx-auto">
              أرسل لنا ورقة المتطلبات المدرسية الخاصة بطفلك، وسنقوم بتجهيز الباقة بالكامل والتواصل معك لإتمام الشراء والتوصيل!
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {success ? (
              <div className="text-center py-10 space-y-6 animate-fade-in-up">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto border border-emerald-500/10">
                  <CheckCircle2 size={44} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-xl text-ink">تم استلام قائمتك بنجاح!</h3>
                  <p className="text-ink-soft/70 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                    شكراً لك. سنقوم بمراجعة قائمة المستلزمات المرفوعة وتجهيز الطلب بالكامل، وسيقوم أحد ممثلي خدمة العملاء بالتواصل معك عبر الهاتف خلال 24 ساعة.
                  </p>
                </div>
                <button
                  onClick={() => setSuccess(false)}
                  className="btn-primary px-8 py-3 text-white font-bold text-xs"
                >
                  رفع قائمة أخرى
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Name field */}
                <div>
                  <label htmlFor="name" className="block text-xs font-extrabold text-ink-soft/80 mb-2">
                    الاسم بالكامل *
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="اكتب اسمك هنا..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-paper rounded-input border border-paper-line focus:outline-none focus:border-amber text-sm font-bold"
                  />
                </div>

                {/* Phone field */}
                <div>
                  <label htmlFor="phone" className="block text-xs font-extrabold text-ink-soft/80 mb-2">
                    رقم التليفون للتواصل (واتساب) *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    placeholder="مثال: 01012345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-paper rounded-input border border-paper-line focus:outline-none focus:border-amber text-sm font-numbers font-bold"
                  />
                </div>

                {/* Drag and Drop File Uploader */}
                <div>
                  <label className="block text-xs font-extrabold text-ink-soft/80 mb-2">
                    قم برفع ملف المتطلبات (صور أو PDF) *
                  </label>
                  
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-card p-6 sm:p-8 flex flex-col items-center justify-center transition-all duration-300 ${
                      dragActive
                        ? 'border-amber bg-amber/5'
                        : fileBase64
                        ? 'border-emerald-500 bg-emerald-50/20'
                        : 'border-paper-line hover:border-ink-soft/40 bg-paper-dark'
                    }`}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {fileBase64 ? (
                      <div className="text-center space-y-3">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
                          <Paperclip size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-ink truncate max-w-xs sm:max-w-md">{fileName}</p>
                          <p className="text-[10px] text-ink-soft/50 font-bold font-numbers mt-0.5">{fileSize}</p>
                        </div>
                        <label
                          htmlFor="file-upload"
                          className="inline-block text-[10px] font-extrabold text-ink-soft hover:underline cursor-pointer"
                        >
                          تغيير الملف
                        </label>
                      </div>
                    ) : (
                      <label htmlFor="file-upload" className="w-full text-center cursor-pointer flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-ink-soft/60 shadow-sm border border-paper-line group-hover:scale-105 transition-transform">
                          <Upload size={22} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm font-bold text-ink">انقر هنا لاختيار ملف، أو اسحبه وأفلته هنا</p>
                          <p className="text-[10px] text-ink-soft/50 font-bold">يقبل ملفات الصور (PNG, JPG) وملفات PDF حتى 5 ميجابايت</p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {/* Notes field */}
                <div>
                  <label htmlFor="notes" className="block text-xs font-extrabold text-ink-soft/80 mb-2">
                    ملاحظات إضافية (اختياري)
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    placeholder="اكتب أي متطلبات خاصة بالصف الدراسي، ألوان معينة أو كتب محددة..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-paper rounded-input border border-paper-line focus:outline-none focus:border-amber text-sm font-bold leading-relaxed"
                  />
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-4 text-white font-bold text-sm shadow-glow flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>جاري الإرسال...</span>
                  ) : (
                    <>
                      <FileText size={16} className="text-white" />
                      <span>تقديم طلب تجهيز القائمة الآن</span>
                    </>
                  )}
                </button>

              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
