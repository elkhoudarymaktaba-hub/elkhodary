// app/admin/api-keys/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { 
  Key, Plus, Trash2, Clipboard, Check, ChevronDown, ChevronUp, Code, ShieldCheck, Database 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getMockData, ApiKey } from '@/lib/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

interface Endpoint {
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  description: string;
  authRequired: boolean;
  exampleResponse: any;
}

const apiEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/v1/products',
    description: 'جلب قائمة بجميع المنتجات النشطة بالمتجر مع إمكانية التصفية بحسب معرّف القسم.',
    authRequired: false,
    exampleResponse: [
      { id: "prod-1", name: "سلاح التلميذ - اللغة العربية", price_unit: 145, price_box: 1620, stock: 120, is_active: true }
    ]
  },
  {
    method: 'GET',
    path: '/api/v1/products/:id',
    description: 'عرض البيانات التفصيلية لمنتج واحد محدد عبر معرّفه الفريد.',
    authRequired: false,
    exampleResponse: {
      id: "prod-1",
      name: "سلاح التلميذ - اللغة العربية - الصف السادس الابتدائي",
      description: "كتاب الشرح الخارجي لمادة اللغة العربية...",
      price_unit: 145,
      price_box: 1620,
      images: ["https://images.unsplash.com/..."],
      stock: 120,
      is_active: true
    }
  },
  {
    method: 'GET',
    path: '/api/v1/boxes',
    description: 'جلب قائمة بجميع البوكسات التعليمية النشطة بالمتجر والمعدّة للبيع كباقات مجمّعة.',
    authRequired: false,
    exampleResponse: [
      { id: "box-1", name: "بوكس انطلاق الروضة (KG)", stage: "kg", base_price: 380, products: [{ product_id: "prod-3", quantity: 1 }] }
    ]
  },
  {
    method: 'GET',
    path: '/api/v1/orders',
    description: 'جلب جميع طلبات المتجر مع إحصائياتها الماليّة لشركة الشحن أو التوزيع. (طلب آمن).',
    authRequired: true,
    exampleResponse: [
      { id: "ORD-1001", customer_name: "أحمد محمود", customer_phone: "01012345678", total_amount: 375, status: "delivered" }
    ]
  },
  {
    method: 'POST',
    path: '/api/v1/orders',
    description: 'إنشاء طلب شراء جديد في قاعدة البيانات لعميل المتجر وتصفية المنتجات وتوصيلها.',
    authRequired: false,
    exampleResponse: {
      success: true,
      message: "تم تسجيل الطلب بنجاح وتوليد فاتورة التوصيل",
      order_id: "ORD-1025",
      total_amount: 520
    }
  },
  {
    method: 'GET',
    path: '/api/v1/orders/:id',
    description: 'جلب تفاصيل طلب محدد وقائمة المنتجات وتكلفة شحن المحافظة الخاصة به.',
    authRequired: true,
    exampleResponse: {
      id: "ORD-1001",
      customer_name: "أحمد محمود العشري",
      customer_phone: "01012345678",
      governorate: "القاهرة",
      total_amount: 375,
      items: [{ id: "prod-1", name: "سلاح التلميذ", quantity: 2, price: 145 }],
      status: "delivered"
    }
  },
  {
    method: 'PATCH',
    path: '/api/v1/orders/:id/status',
    description: 'تحديث حالة الطلب (جديد ← مؤكد ← مع شركة الشحن ← تم التسليم / ملغي).',
    authRequired: true,
    exampleResponse: {
      success: true,
      order_id: "ORD-1001",
      new_status: "shipping",
      updated_at: "2026-07-08T01:17:00Z"
    }
  },
  {
    method: 'GET',
    path: '/api/v1/categories',
    description: 'جلب قائمة بالأقسام النشطة بالمتجر مع الأيقونات التعبرية المرتبطة بها.',
    authRequired: false,
    exampleResponse: [
      { id: "cat-1", name: "الكتب الدراسية", slug: "textbooks", icon: "📚", is_active: true }
    ]
  }
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  // توليد المفتاح
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keyLabel, setKeyLabel] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [keyCopied, setKeyCopied] = useState(false);

  // التحكم بانهيار تفاصيل التوثيق
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    let keyList: ApiKey[] = [];

    try {
      const { data } = await supabase.from('api_keys').select('*');
      if (data) keyList = data;
    } catch (err) {
      keyList = getMockData.apiKeys();
    }

    setKeys(keyList);
    setLoading(false);
  };

  // توليد مفتاح عشوائي للعميل
  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyLabel.trim()) return;

    // توليد المفتاح السري العشوائي
    const randPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const rawKey = `kh_live_${randPart}`;
    const previewHash = `${rawKey.substring(0, 11)}...${rawKey.substring(rawKey.length - 4)}`;

    const newKeyPayload = {
      label: keyLabel,
      key_hash: previewHash, // في النظام الحقيقي، يتم حفظ الهاش المشفر للتحقق
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('api_keys').insert([newKeyPayload]);
      
      // التعديل محلياً في الواجهة
      setKeys(prev => [
        ...prev, 
        { 
          id: `key-${Math.random().toString(36).substring(2, 9)}`, 
          ...newKeyPayload 
        }
      ]);

      // الاحتفاظ بالمفتاح الخام لعرضه مرة واحدة للمشرف لنسخه
      setGeneratedKey(rawKey);
      setKeyLabel('');
      setKeyCopied(false);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إنشاء مفتاح الـ API.');
    }
  };

  const copyKeyToClipboard = () => {
    navigator.clipboard.writeText(generatedKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  // حذف مفتاح API
  const handleDeleteKey = async (id: string) => {
    if (!confirm('هل تريد إلغاء تنشيط وحذف مفتاح الـ API هذا؟ سيتم قطع الاتصال البرمجي المرتبط به فوراً.')) return;
    try {
      await supabase.from('api_keys').delete().eq('id', id);
      setKeys(prev => prev.filter(k => k.id !== id));
      alert('تم إبطال وحذف المفتاح بنجاح.');
    } catch (err) {
      console.error(err);
    }
  };

  // تبديل وفتح نهايات التوثيق
  const toggleEndpoint = (index: number) => {
    setExpandedEndpoints(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right" dir="rtl">
      
      {/* 1. إدارة مفاتيح API (Keys Manager Panel) */}
      <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] h-fit space-y-4 lg:col-span-1">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-ink font-arabic flex items-center gap-1.5">
            <Key className="w-5 h-5 text-amber" />
            <span>مفاتيح الـ API للمطورين</span>
          </h3>
          <p className="text-xs text-slate-400 font-arabic">أنشئ مفاتيح لربط المتجر ببرامج الأتمتة الخارجية مثل Zapier أو شركات الشحن</p>
        </div>

        {/* نموذج إنشاء مفتاح جديد */}
        <form onSubmit={handleGenerateKey} className="space-y-3 pt-2">
          <Input
            label="اسم / تسمية المفتاح البرمجي"
            placeholder="مثال: لوحة تحليلات المدير الخارجية"
            value={keyLabel}
            onChange={(e) => setKeyLabel(e.target.value)}
            required
          />
          <Button
            type="submit"
            className="w-full font-arabic text-xs py-2.5 flex items-center justify-center gap-2 shadow-md shadow-amber/20"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء API Key جديد</span>
          </Button>
        </form>

        <div className="h-px bg-[#E7DCC2] my-4" />

        {/* قائمة المفاتيح الفعالة حالياً */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-ink font-arabic">مفاتيح API النشطة حالياً:</span>
          {loading ? (
            <p className="text-xs text-slate-400 font-arabic text-center py-4">جاري تحميل المفاتيح...</p>
          ) : keys.length > 0 ? (
            <div className="space-y-2.5">
              {keys.map((k) => (
                <div key={k.id} className="bg-slate-50 border border-[#E7DCC2] p-3 rounded-[12px] flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 font-arabic">{k.label}</p>
                    <code className="text-[10px] font-english text-slate-400 select-all block bg-white px-1 py-0.5 rounded border border-[#E7DCC2] w-fit">{k.key_hash}</code>
                    <span className="text-[9px] text-slate-400 block font-arabic">أنشئ: {new Date(k.created_at).toLocaleDateString('ar-EG')}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteKey(k.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                    title="حذف وإبطال المفتاح"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-arabic text-center py-4">لا توجد مفاتيح نشطة بعد.</p>
          )}
        </div>
      </div>

      {/* 2. التوثيق البرمجي التفاعلي (Interactive API Docs Panel) */}
      <div className="bg-white p-6 rounded-[16px] shadow-premium border border-[#E7DCC2] lg:col-span-2 flex flex-col gap-5">
        <div className="space-y-1 border-b border-[#E7DCC2] pb-3">
          <h3 className="text-base font-bold text-ink font-arabic flex items-center gap-1.5">
            <Code className="w-5 h-5 text-amber" />
            <span>توثيق الواجهة البرمجية (API Documentation)</span>
          </h3>
          <p className="text-xs text-slate-400 font-arabic">استخدم هذه النهايات الطرفية لتبادل البيانات البرمجية بحرّية وأمان</p>
        </div>

        {/* تنبيه الحماية البرمجية */}
        <div className="bg-[#F6F1E4] border border-[#E7DCC2] p-4 rounded-[12px] flex items-start gap-2.5 text-xs text-ink leading-relaxed">
          <ShieldCheck className="w-5 h-5 text-amber shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold font-arabic">رأس المصادقة المطلوب (Authentication Header):</p>
            <p className="font-arabic text-slate-500">
              يجب إرفاق مفتاح الـ API الخاص بك في الهيدر لجميع المسارات التي تحمل شارة <span className="bg-rose-50 text-rose-500 px-1 py-0.5 rounded font-bold">مطلوب</span> كالتالي:
            </p>
            <code className="block bg-white border border-amber/20 p-2 rounded-[8px] font-english font-semibold text-amber mt-1 select-all">
              x-api-key: YOUR_API_KEY
            </code>
          </div>
        </div>

        {/* نهايات التوثيق الـ 8 */}
        <div className="space-y-3.5">
          {apiEndpoints.map((endpoint, idx) => {
            const isExpanded = !!expandedEndpoints[idx];
            const isGet = endpoint.method === 'GET';
            const isPost = endpoint.method === 'POST';

            return (
              <div key={idx} className="border border-[#E7DCC2] rounded-[12px] overflow-hidden shadow-sm">
                
                {/* رأس النهاية الطرفية */}
                <button
                  type="button"
                  onClick={() => toggleEndpoint(idx)}
                  className="w-full px-4 py-3.5 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between text-right transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2.5 flex-1">
                    {/* وسم الميثود */}
                    <span className={`px-2.5 py-1 rounded-[6px] text-[10px] font-black font-english ${
                      isGet 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : isPost 
                          ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                          : 'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                      {endpoint.method}
                    </span>
                    
                    {/* المسار البرمجي */}
                    <code className="text-xs font-english font-bold text-slate-700 select-all">
                      {endpoint.path}
                    </code>

                    {/* متطلب الحماية */}
                    {endpoint.authRequired ? (
                      <span className="bg-rose-50 text-rose-600 border border-rose-100 text-[9px] px-1.5 py-0.5 rounded font-bold font-arabic">
                        مفتاح API مطلوب
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-400 text-[9px] px-1.5 py-0.5 rounded font-arabic">
                        عام (Public)
                      </span>
                    )}
                  </div>
                  
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {/* تفاصيل التوثيق المفتوحة */}
                {isExpanded && (
                  <div className="p-4 bg-white border-t border-[#E7DCC2] space-y-3.5 animate-in slide-in-from-top-1 duration-200">
                    <p className="text-xs text-slate-600 font-arabic leading-relaxed">
                      {endpoint.description}
                    </p>

                    {/* الـ JSON response */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-ink font-arabic block flex items-center gap-1">
                        <Database className="w-3.5 h-3.5 text-amber" />
                        <span>مثال لرد الاستجابة (Example JSON Response):</span>
                      </span>
                      <pre className="bg-[#16233F] border border-[#E7DCC2] text-amber p-3 rounded-[8px] font-english text-[10px] overflow-x-auto select-all max-h-40 scrollbar-thin">
                        {JSON.stringify(endpoint.exampleResponse, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>

      </div>

      {/* مودال المفتاح المولد لمرة واحدة */}
      <Dialog
        isOpen={!!generatedKey}
        onClose={() => setGeneratedKey('')}
        title="تهانينا! تم توليد مفتاح API بنجاح"
        size="md"
      >
        <div className="space-y-4 text-right">
          
          <div className="bg-rose-50 border border-rose-100 text-rose-600 rounded-[12px] p-4 text-xs font-arabic leading-relaxed">
            <strong>تنبيه أمان هام جداً:</strong>
            <p className="mt-1">
              انسخ مفتاح الـ API الخاص بك الآن واحفظه في مكان آمن. لن نتمكن من إظهار هذا المفتاح لك مرة أخرى لحماية أمان حسابك وتفادي الاختراقات.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-ink font-arabic">مفتاح API الخاص بك:</span>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-50 border border-[#E7DCC2] p-3 rounded-[12px] font-english font-bold text-slate-800 select-all text-xs tracking-wide">
                {generatedKey}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyKeyToClipboard}
                className="py-3 pr-4 pl-4 shrink-0 font-arabic text-xs"
              >
                {keyCopied ? <Check className="w-4 h-4 text-sage" /> : <Clipboard className="w-4 h-4 text-amber" />}
              </Button>
            </div>
            {keyCopied && <p className="text-[10px] text-emerald-600 font-bold">تم نسخ المفتاح بنجاح!</p>}
          </div>

          <div className="flex justify-end pt-2 border-t border-[#E7DCC2]">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setGeneratedKey('')}
              className="font-arabic text-xs"
            >
              فهمت، وقمت بنسخ المفتاح
            </Button>
          </div>

        </div>
      </Dialog>

    </div>
  );
}
