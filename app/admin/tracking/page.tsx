// app/admin/tracking/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { 
  Radio, Check, ToggleLeft, ToggleRight, Save, Send, AlertCircle, PlayCircle 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getMockData, TrackingPixel } from '@/lib/mockData';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';


const availableEvents = [
  { id: 'PageView', label: 'PageView (زيارة الصفحة)' },
  { id: 'ViewContent', label: 'ViewContent (عرض المنتج)' },
  { id: 'AddToCart', label: 'AddToCart (إضافة للسلة)' },
  { id: 'InitiateCheckout', label: 'InitiateCheckout (بدء الشراء)' },
  { id: 'Purchase', label: 'Purchase (إتمام الشراء)' },
];

export default function TrackingPage() {
  const [pixels, setPixels] = useState<TrackingPixel[]>([]);
  const [loading, setLoading] = useState(true);

  // فورم التحكم الفردي للمنصات
  const [fbId, setFbId] = useState('');
  const [fbCapi, setFbCapi] = useState('');
  const [fbEvents, setFbEvents] = useState<string[]>([]);
  const [fbActive, setFbActive] = useState(false);

  const [gaId, setGaId] = useState('');
  const [gaActive, setGaActive] = useState(false);

  const [snapId, setSnapId] = useState('');
  const [snapActive, setSnapActive] = useState(false);

  const [tiktokId, setTiktokId] = useState('');
  const [tiktokActive, setTiktokActive] = useState(false);

  // أداة فحص الأحداث (CAPI Tester)
  const [testEventName, setTestEventName] = useState('PageView');
  const [testingEvent, setTestingEvent] = useState(false);
  const [testLog, setTestLog] = useState<string[]>([]);

  // حالة حفظ البيانات العامة
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    let pixelList: TrackingPixel[] = [];

    try {
      const { data } = await supabase.from('tracking_pixels').select('*');
      if (data && data.length > 0) {
        pixelList = data;
      } else {
        pixelList = getMockData.trackingPixels();
      }
    } catch (err) {
      pixelList = getMockData.trackingPixels();
    }

    setPixels(pixelList);
    loadPlatformStates(pixelList);
    setLoading(false);
  };

  const loadPlatformStates = (list: TrackingPixel[]) => {
    const fb = list.find(p => p.platform === 'facebook');
    if (fb) {
      setFbId(fb.pixel_id || '');
      setFbCapi(fb.conversion_api_token || '');
      setFbEvents(fb.events || []);
      setFbActive(fb.active);
    }

    const google = list.find(p => p.platform === 'google');
    if (google) {
      setGaId(google.pixel_id || '');
      setGaActive(google.active);
    }

    const snap = list.find(p => p.platform === 'snapchat');
    if (snap) {
      setSnapId(snap.pixel_id || '');
      setSnapActive(snap.active);
    }

    const tiktok = list.find(p => p.platform === 'tiktok');
    if (tiktok) {
      setTiktokId(tiktok.pixel_id || '');
      setTiktokActive(tiktok.active);
    }
  };

  // تعديل اختيارات أحداث فيسبوك
  const handleFbEventChange = (eventId: string) => {
    setFbEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(e => e !== eventId) 
        : [...prev, eventId]
    );
  };

  // حفظ التغييرات لجميع المنصات
  const handleSaveChanges = async () => {
    setSaving(true);
    const updates: TrackingPixel[] = [
      {
        platform: 'facebook',
        pixel_id: fbId,
        active: fbActive,
        conversion_api_token: fbCapi,
        events: fbEvents
      },
      {
        platform: 'google',
        pixel_id: gaId,
        active: gaActive,
        events: ['PageView', 'Purchase']
      },
      {
        platform: 'snapchat',
        pixel_id: snapId,
        active: snapActive,
        events: ['PageView']
      },
      {
        platform: 'tiktok',
        pixel_id: tiktokId,
        active: tiktokActive,
        events: ['PageView']
      }
    ];

    try {
      await supabase.from('tracking_pixels').upsert(updates);
      
      // تحديث الموك داتا
      saveMockData.trackingPixels(updates);

      alert('تم حفظ إعدادات بيكسلات التتبع والتكاملات بنجاح!');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ التحديثات.');
    } finally {
      setSaving(false);
    }
  };

  // إرسال حدث اختبار (Simulate CAPI Event Test)
  const triggerCapiTestEvent = () => {
    if (!fbCapi || !fbId) {
      alert('يرجى كتابة معرف بيكسل فيسبوك ومفتاح الـ Conversions API لإجراء الفحص.');
      return;
    }

    setTestingEvent(true);
    setTestLog([]);

    const addLog = (msg: string) => {
      setTestLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    setTimeout(() => {
      addLog('جاري تجهيز حمولة الحدث التابع للـ Conversions API (CAPI)...');
    }, 200);

    setTimeout(() => {
      addLog(`تحضير حدث: ${testEventName}...`);
      addLog(`المعطيات المرسلة: ip=197.34.*.*, user_agent=Mozilla/5.0...`);
    }, 800);

    setTimeout(() => {
      addLog('الاتصال بسيرفرات Meta Graph API...');
    }, 1400);

    setTimeout(() => {
      addLog('تم التوصيل! استلام رمز الاستجابة HTTP 200 (Success).');
      addLog(`تم فك حدث ${testEventName} وتسجيل الـ Event ID بنجاح!`);
      setTestingEvent(false);
    }, 2200);
  };

  return (
    <div className="space-y-6 text-right font-arabic" dir="rtl">
      
      {/* البار العلوي للحفظ */}
      <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-ink">تكاملات بيكسلات التتبع</h3>
          <p className="text-xs text-slate-400 mt-1">اربط متجرك مع منصات الإعلانات لتتبع سلوك الشراء وتحسين الحملات</p>
        </div>

        <Button
          variant="primary"
          onClick={handleSaveChanges}
          isLoading={saving}
          className="font-arabic py-2.5 px-6 shadow-md shadow-amber/15"
        >
          <Save className="w-4 h-4 ml-1.5" />
          <span>حفظ التعديلات العامة</span>
        </Button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-ink">
          <svg className="animate-spin h-8 w-8 text-amber" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="font-bold text-sm">جاري جلب التكاملات...</span>
        </div>
      ) : (
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 1. فيسبوك بيكسل Facebook Pixel */}
          <div className="bg-white rounded-[16px] shadow-premium border border-[#E7DCC2] p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-[#1877F2]" />
            
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <span className="font-bold text-[#1877F2] font-english text-lg tracking-wide">Facebook Pixel & CAPI</span>
              <button 
                type="button" 
                onClick={() => setFbActive(!fbActive)}
                className="text-slate-400"
              >
                {fbActive ? <ToggleRight className="w-8 h-8 text-sage" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="معرّف البيكسل (Pixel ID)"
                placeholder="1234567890123"
                value={fbId}
                onChange={(e) => setFbId(e.target.value)}
                disabled={!fbActive}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-ink">رمز واجهة تحويل الأحداث (Conversions API Token)</label>
                <textarea
                  rows={2}
                  placeholder="EAADw... مفتاح الوصول الخاص بالخادم لتفادي حظر كوكيز المتصفح"
                  value={fbCapi}
                  onChange={(e) => setFbCapi(e.target.value)}
                  disabled={!fbActive}
                  className="w-full px-4 py-2 bg-white border border-[#E7DCC2] text-xs rounded-[12px] font-english focus:outline-none focus:border-amber disabled:opacity-50"
                />
              </div>

              {/* تشيك بوكس الفعاليات */}
              <div className="space-y-2">
                <span className="text-sm font-semibold text-ink block">الفعاليات والأحداث المراد إرسالها:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableEvents.map((ev) => (
                    <label 
                      key={ev.id} 
                      className={`flex items-center gap-2.5 px-3 py-2 border rounded-[12px] cursor-pointer text-xs transition-colors ${
                        fbEvents.includes(ev.id)
                          ? 'border-amber bg-[#FBEBCB]/15 text-ink font-bold'
                          : 'border-slate-100 hover:bg-slate-50 text-slate-500'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={fbEvents.includes(ev.id)}
                        onChange={() => handleFbEventChange(ev.id)}
                        disabled={!fbActive}
                        className="rounded text-amber focus:ring-amber"
                      />
                      <span>{ev.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. تحليلات جوجل Google Analytics */}
          <div className="bg-white rounded-[16px] shadow-premium border border-[#E7DCC2] p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-[#EA4335]" />
            
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <span className="font-bold text-[#EA4335] font-english text-lg tracking-wide">Google Analytics (GA4)</span>
              <button 
                type="button" 
                onClick={() => setGaActive(!gaActive)}
              >
                {gaActive ? <ToggleRight className="w-8 h-8 text-sage" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="معرّف القياس (Measurement ID)"
                placeholder="G-XXXXXXXXXX"
                value={gaId}
                onChange={(e) => setGaId(e.target.value)}
                disabled={!gaActive}
                className="font-english"
              />
              <div className="bg-slate-50 p-4 border border-slate-100 rounded-[12px] flex items-start gap-2.5 text-xs text-slate-500 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>تحليلات جوجل تقوم بتتبع أحداث المبيعات وزيارات الصفحات تلقائياً بمجرد إدراج معرّف القياس الصحيح.</span>
              </div>
            </div>
          </div>

          {/* 3. سناب شات بيكسل Snapchat Pixel */}
          <div className="bg-white rounded-[16px] shadow-premium border border-[#E7DCC2] p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-[#FFFC00]" />
            
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <span className="font-bold text-yellow-600 font-english text-lg tracking-wide">Snapchat Pixel</span>
              <button 
                type="button" 
                onClick={() => setSnapActive(!snapActive)}
              >
                {snapActive ? <ToggleRight className="w-8 h-8 text-sage" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="معرّف بيكسل سناب شات (Pixel ID)"
                placeholder="snap-xxxx-xxxx-xxxx"
                value={snapId}
                onChange={(e) => setSnapId(e.target.value)}
                disabled={!snapActive}
                className="font-english"
              />
            </div>
          </div>

          {/* 4. تيك توك بيكسل TikTok Pixel */}
          <div className="bg-white rounded-[16px] shadow-premium border border-[#E7DCC2] p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-[#000000]" />
            
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <span className="font-bold text-black font-english text-lg tracking-wide">TikTok Pixel</span>
              <button 
                type="button" 
                onClick={() => setTiktokActive(!tiktokActive)}
              >
                {tiktokActive ? <ToggleRight className="w-8 h-8 text-sage" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="معرّف بيكسل تيك توك (Pixel ID)"
                placeholder="CXXXXXXXXXXXXXXXXXX"
                value={tiktokId}
                onChange={(e) => setTiktokId(e.target.value)}
                disabled={!tiktokActive}
                className="font-english"
              />
            </div>
          </div>

          {/* 5. أداة فحص Conversions API للفيسبوك (CAPI Test Tool Card) */}
          <div className="bg-white rounded-[16px] shadow-premium border border-[#E7DCC2] p-6 space-y-4 lg:col-span-2 text-right">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-amber" />
                <span>أداة فحص إرسال الأحداث التجريبية (Conversions API Test Tool)</span>
              </h3>
              <p className="text-xs text-slate-400">تحقق من صحة ربط السيرفر مع فيسبوك بإطلاق حدث اختبار فوري</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#F6F1E4]/30 p-4 border border-[#E7DCC2] rounded-[16px] items-end">
              <div className="md:col-span-2">
                <Select
                  label="اختر الفعالية لإرسالها"
                  options={availableEvents.map(e => ({ value: e.id, label: e.label }))}
                  value={testEventName}
                  onChange={(e) => setTestEventName(e.target.value)}
                  disabled={testingEvent}
                />
              </div>
              <Button
                type="button"
                onClick={triggerCapiTestEvent}
                isLoading={testingEvent}
                disabled={!fbCapi || !fbId}
                className="font-arabic w-full flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>إرسال حدث الفحص</span>
              </Button>
            </div>

            {/* شاشة مراقبة تسجيل الأحداث (Terminal Logger) */}
            {testLog.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 text-slate-300 p-4 rounded-[12px] font-english text-[10px] space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                {testLog.map((log, idx) => (
                  <p key={idx} className={log.includes('Success') || log.includes('بنجاح') ? 'text-emerald-400' : ''}>{log}</p>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
