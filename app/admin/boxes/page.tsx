// app/admin/boxes/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { 
  Grid, List, Table as TableIcon, Plus, Search, Edit2, Trash2, 
  Image as ImageIcon, ToggleLeft, ToggleRight, Check, X, ShieldAlert, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { getMockData, Box, Product, Category } from '@/lib/mockData';
import { useRole } from '@/lib/useRole';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const stageLabels: Record<string, string> = {
  kg: 'الروضة (KG)',
  primary: 'المرحلة الابتدائية',
  middle: 'المرحلة الإعدادية',
  high: 'المرحلة الثانوية',
};

const stageColors: Record<string, string> = {
  kg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  primary: 'bg-blue-50 text-blue-600 border border-blue-100',
  middle: 'bg-purple-50 text-purple-600 border border-purple-100',
  high: 'bg-amber-50 text-amber-600 border border-amber-100',
};

export default function BoxesPage() {
  const { checkPermission } = useRole();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // المراحل التعليمية الديناميكية
  const [stages, setStages] = useState<Array<{ value: string; label: string }>>([
    { value: 'kg', label: 'الروضة (KG)' },
    { value: 'primary', label: 'المرحلة الابتدائية' },
    { value: 'middle', label: 'المرحلة الإعدادية' },
    { value: 'high', label: 'المرحلة الثانوية' }
  ]);
  const [showAddStageDialog, setShowAddStageDialog] = useState(false);
  const [newStageValue, setNewStageValue] = useState('');
  const [newStageLabel, setNewStageLabel] = useState('');

  const getStageLabel = (stage: string) => {
    const found = stages.find(s => s.value === stage);
    return found ? found.label : stage;
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'kg': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'primary': return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'middle': return 'bg-purple-50 text-purple-600 border border-purple-100';
      case 'high': return 'bg-amber-50 text-amber-600 border border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border border-slate-100';
    }
  };

  // أنماط العرض: grid / table / list
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'list'>('grid');

  // نوافذ التحكم
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBox, setEditingBox] = useState<Box | null>(null);

  // حقول نموذج البوكس
  const [formName, setFormName] = useState('');
  const [formStage, setFormStage] = useState<string>('kg');
  const [formBasePrice, setFormBasePrice] = useState(0);
  const [formDesc, setFormDesc] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  
  // المنتجات المضافة للبوكس حالياً
  const [boxProducts, setBoxProducts] = useState<{ product_id: string; quantity: number }[]>([]);

  // كتالوج تصفح المتجر
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('all');

  // محرك البحث الداخلي عن منتجات لإضافتها
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    let boxesList: Box[] = [];
    let productsList: Product[] = [];
    let categoriesList: Category[] = [];

    // Fetch custom stages first
    try {
      const { data: sData } = await supabase.from('site_settings').select('value').eq('key', 'custom_stages').single();
      if (sData && sData.value) {
        setStages(JSON.parse(sData.value));
      } else {
        const local = localStorage.getItem('kh_custom_stages');
        if (local) setStages(JSON.parse(local));
      }
    } catch (e) {
      const local = localStorage.getItem('kh_custom_stages');
      if (local) setStages(JSON.parse(local));
    }

    try {
      const { data: bData } = await supabase.from('boxes').select('*');
      if (bData) boxesList = bData;
      const { data: pData } = await supabase.from('products').select('*');
      if (pData) productsList = pData;
      const { data: cData } = await supabase.from('categories').select('*');
      if (cData) categoriesList = cData;
    } catch (err) {
      boxesList = getMockData.boxes();
      productsList = getMockData.products();
      categoriesList = getMockData.categories();
    }

    setBoxes(boxesList);
    setProducts(productsList);
    setCategories(categoriesList);
    setLoading(false);
  };

  const handleAddStage = async () => {
    if (!newStageLabel.trim()) return;
    const val = newStageValue.trim() || `stage_${Date.now()}`;
    const newStage = { value: val, label: newStageLabel.trim() };
    const updatedStages = [...stages, newStage];
    setStages(updatedStages);
    localStorage.setItem('kh_custom_stages', JSON.stringify(updatedStages));
    try {
      await supabase.from('site_settings').upsert({ key: 'custom_stages', value: JSON.stringify(updatedStages) });
    } catch (e) {
      console.error(e);
    }
    setNewStageValue('');
    setNewStageLabel('');
    setShowAddStageDialog(false);
  };

  // فتح فورم الإضافة
  const handleAddClick = () => {
    setEditingBox(null);
    setFormName('');
    setFormStage('kg');
    setFormBasePrice(0);
    setFormDesc('');
    setFormImageUrl('');
    setFormIsActive(true);
    setBoxProducts([]);
    setIsFormOpen(true);
  };

  // فتح فورم التعديل
  const handleEditClick = (box: Box) => {
    setEditingBox(box);
    setFormName(box.name);
    
    // Parse custom stage if present in description
    const desc = box.description || '';
    const stageMatch = desc.match(/\[STAGE\]:\s*(.+)$/m);
    let resolvedStage = box.stage;
    let cleanDesc = desc;
    if (stageMatch && stageMatch[1]) {
      resolvedStage = stageMatch[1].trim();
      cleanDesc = desc.replace(/\[STAGE\]:\s*(.+)$/m, '').trim();
    }
    
    setFormStage(resolvedStage);
    setFormBasePrice(box.base_price);
    setFormDesc(cleanDesc);
    setFormImageUrl(box.image_url || '');
    setFormIsActive(box.is_active);
    setBoxProducts(box.products || []);
    setIsFormOpen(true);
  };

  // رفع صورة البوكس محاكاة أو حقيقي
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `boxes/${fileName}`;

      const { error } = await supabase.storage.from('boxes').upload(filePath, file);
      if (error) throw error;

      const { data: publicData } = supabase.storage.from('boxes').getPublicUrl(filePath);
      if (publicData?.publicUrl) {
        setFormImageUrl(publicData.publicUrl);
        alert('تم رفع صورة البوكس بنجاح!');
      }
    } catch (err) {
      // محاكاة
      setFormImageUrl('https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&auto=format&fit=crop&q=60');
      alert('تم إدراج رابط صورة تجريبي للبوكس.');
    }
  };

  // البحث عن المنتجات داخل الكتالوج
  const searchResults = products.filter(p => 
    p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) &&
    !boxProducts.some(bp => bp.product_id === p.id) // استبعاد المضاف بالفعل
  ).slice(0, 5);

  // إضافة منتج للعلبة
  const addProductToBox = (product: Product) => {
    setBoxProducts(prev => [...prev, { product_id: product.id, quantity: 1 }]);
    setSearchProductQuery('');
    setShowSearchResults(false);
  };

  // تعديل كمية منتج في العلبة
  const updateProductQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeProductFromBox(productId);
      return;
    }
    setBoxProducts(prev => prev.map(item => 
      item.product_id === productId ? { ...item, quantity: qty } : item
    ));
  };

  // حذف منتج من العلبة
  const removeProductFromBox = (productId: string) => {
    setBoxProducts(prev => prev.filter(item => item.product_id !== productId));
  };

  // حساب التكلفة المجمعة الجارية لجميع السلع المضافة للبوكس
  const runningTotalPrice = boxProducts.reduce((sum, item) => {
    const p = products.find(prod => prod.id === item.product_id);
    return sum + (p ? p.price_unit * item.quantity : 0);
  }, 0);

  // المنتجات المفلترة للكتالوج المفتوح داخل البوكس
  const catalogProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchesCat = catalogCategory === 'all' || p.category_id === catalogCategory;
    return matchesSearch && matchesCat;
  });

  // حفظ البوكس
  const handleSaveBox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPermission(['product_manager'], editingBox ? 'تعديل البوكس' : 'إنشاء بوكس جديد')) return;
    if (boxProducts.length === 0) {
      alert('يجب إضافة منتج واحد على الأقل داخل البوكس التعليمي!');
      return;
    }

    let finalDesc = formDesc.trim();
    let dbStage = formStage;

    const defaultStages = ['kg', 'primary', 'middle', 'high'];
    if (!defaultStages.includes(formStage)) {
      finalDesc += `\n\n[STAGE]: ${formStage}`;
      dbStage = 'primary'; // fallback to database CHECK enum stage values
    }

    const boxPayload = {
      name: formName,
      stage: dbStage,
      base_price: Number(formBasePrice),
      description: finalDesc,
      image_url: formImageUrl,
      is_active: formIsActive,
      products: boxProducts
    };

    try {
      if (editingBox) {
        await supabase.from('boxes').update(boxPayload).eq('id', editingBox.id);
        
        // Update local state with the actual stage name
        const localPayload = { ...boxPayload, stage: formStage };
        setBoxes(prev => prev.map(b => b.id === editingBox.id ? { ...b, ...localPayload } : b));
        alert('تم تعديل البوكس بنجاح!');
      } else {
        await supabase.from('boxes').insert([boxPayload]);
        fetchData();
        alert('تم إنشاء البوكس بنجاح!');
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ البوكس.');
    }
  };

  // تفعيل / تعطيل البوكس سريعاً
  const toggleActive = async (box: Box) => {
    if (!checkPermission(['product_manager'], 'تعديل حالة البوكس')) return;
    const newVal = !box.is_active;
    setBoxes(prev => prev.map(b => b.id === box.id ? { ...b, is_active: newVal } : b));
    try {
      await supabase.from('boxes').update({ is_active: newVal }).eq('id', box.id);
    } catch (err) {
      console.error(err);
    }
  };

  // حذف البوكس
  const handleDeleteBox = async (boxId: string) => {
    if (!checkPermission(['product_manager'], 'حذف البوكس التعليمي')) return;
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا البوكس التعليمي؟')) return;
    try {
      await supabase.from('boxes').delete().eq('id', boxId);
      setBoxes(prev => prev.filter(b => b.id !== boxId));
      alert('تم حذف البوكس بنجاح.');
    } catch (err) {
      console.error(err);
    }
  };

  if (isFormOpen) {
    return (
      <BoxFormPage
        editingBox={editingBox}
        formName={formName} setFormName={setFormName}
        formStage={formStage} setFormStage={setFormStage}
        formBasePrice={formBasePrice} setFormBasePrice={setFormBasePrice}
        formDesc={formDesc} setFormDesc={setFormDesc}
        formImageUrl={formImageUrl}
        formIsActive={formIsActive} setFormIsActive={setFormIsActive}
        boxProducts={boxProducts} setBoxProducts={setBoxProducts}
        products={products} categories={categories}
        handleImageUpload={handleImageUpload}
        handleSaveBox={handleSaveBox}
        searchProductQuery={searchProductQuery} setSearchProductQuery={setSearchProductQuery}
        showSearchResults={showSearchResults} setShowSearchResults={setShowSearchResults}
        searchResults={searchResults}
        addProductToBox={addProductToBox}
        removeProductFromBox={removeProductFromBox}
        updateProductQty={updateProductQty}
        runningTotalPrice={runningTotalPrice}
        isCatalogOpen={isCatalogOpen} setIsCatalogOpen={setIsCatalogOpen}
        catalogSearch={catalogSearch} setCatalogSearch={setCatalogSearch}
        catalogCategory={catalogCategory} setCatalogCategory={setCatalogCategory}
        catalogProducts={catalogProducts}
        onCancel={() => setIsFormOpen(false)}
        stages={stages}
        setShowAddStageDialog={setShowAddStageDialog}
      />
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* شريط التحكم وطريقة العرض */}
      <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* أزرار طريقة العرض */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-ink font-arabic ml-2">طريقة العرض:</span>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-[8px] transition-colors ${viewMode === 'grid' ? 'bg-amber text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
            title="عرض الشبكة"
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-[8px] transition-colors ${viewMode === 'table' ? 'bg-amber text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
            title="عرض الجدول"
          >
            <TableIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-[8px] transition-colors ${viewMode === 'list' ? 'bg-amber text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
            title="عرض القائمة"
          >
            <List className="w-5 h-5" />
          </button>
        </div>

        {/* زر الإضافة */}
        <Button 
          variant="primary" 
          onClick={handleAddClick}
          className="shadow-md shadow-amber/20 font-arabic flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>إنشاء بوكس تعليمي جديد</span>
        </Button>

      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-ink">
          <svg className="animate-spin h-8 w-8 text-amber" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="font-bold font-arabic text-sm">جاري جلب البوكسات المدرسية...</span>
        </div>
      ) : boxes.length > 0 && (
        
        <>
        <AnimatePresence mode="wait">
          {/* 1. عرض الشبكة (GRID VIEW) */}
          {viewMode === 'grid' && (
            <motion.div 
              key="grid"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-right"
            >
              {boxes.map((box) => (
                <motion.div 
                  layout
                  key={box.id} 
                  className="bg-white rounded-[16px] shadow-premium overflow-hidden border border-[#E7DCC2] flex flex-col justify-between group hover:shadow-premium-hover hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] bg-slate-50 border-b border-[#E7DCC2] overflow-hidden">
                    {box.image_url ? (
                      <img 
                        src={box.image_url} 
                        alt={box.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=60';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full text-slate-300 flex items-center justify-center"><ImageIcon className="w-12 h-12" /></div>
                    )}
                    
                    {/* شارة المرحلة */}
                    <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold font-arabic ${getStageColor(box.stage)}`}>
                      {getStageLabel(box.stage)}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between gap-4 text-right">
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-base text-ink font-arabic">{box.name}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 font-arabic leading-relaxed">{box.description}</p>
                    </div>

                    <div className="flex justify-between items-center bg-[#FBEBCB]/15 px-3 py-2 rounded-[12px] text-xs">
                      <span className="text-slate-500 font-arabic">عدد الأدوات والمجلدات:</span>
                      <span className="font-bold font-english text-ink bg-white px-2 py-0.5 rounded border border-[#E7DCC2]">{box.products?.length || 0} قطع</span>
                    </div>

                    <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-[12px] border border-[#E7DCC2] max-h-24 overflow-y-auto scrollbar-thin text-right">
                      <span className="text-[10px] font-bold text-ink block font-arabic border-b border-[#E7DCC2] pb-1 mb-1">📋 قائمة المحتويات والترتيب:</span>
                      {box.products && box.products.length > 0 ? (
                        box.products.map((item, idx) => {
                          const p = products.find(prod => prod.id === item.product_id);
                          return (
                            <div key={item.product_id} className="flex justify-between items-center text-[10px] text-slate-600 font-arabic leading-tight">
                              <span className="truncate max-w-[170px]">{idx + 1}. {p ? p.name : 'منتج غير معروف'}</span>
                              <span className="font-english text-[9px] font-bold text-slate-500 shrink-0">({item.quantity}×)</span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-[10px] text-slate-400 font-arabic">لا توجد منتجات مضمنة.</div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-[#E7DCC2] pt-4 mt-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-arabic">سعر الحزمة:</span>
                        <span className="text-lg font-black text-coral font-english">{box.base_price} ج.م</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* تفعيل */}
                        <button onClick={() => toggleActive(box)} className="text-slate-400 hover:text-sage">
                          {box.is_active ? <ToggleRight className="w-8 h-8 text-sage" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
                        </button>
                        
                        {/* تعديل وحذف */}
                        <div className="h-6 w-px bg-slate-200 mx-1" />
                        <button onClick={() => handleEditClick(box)} className="p-1.5 bg-slate-50 text-slate-500 hover:text-amber rounded-[8px] transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteBox(box.id)} className="p-1.5 bg-slate-50 text-slate-500 hover:text-rose-500 rounded-[8px] transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* 2. عرض الجدول (TABLE VIEW) */}
          {viewMode === 'table' && (
            <motion.div 
              key="table"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-[16px] shadow-premium border border-[#E7DCC2] overflow-hidden"
            >
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-[#F6F1E4]/30 border-b border-[#E7DCC2] text-ink-soft font-arabic">
                    <th className="py-4 px-6 font-bold">البوكس</th>
                    <th className="py-4 px-6 font-bold">المرحلة</th>
                    <th className="py-4 px-6 font-bold">المواد المكونة</th>
                    <th className="py-4 px-6 font-bold">السعر للبيع</th>
                    <th className="py-4 px-6 font-bold text-center">نشط</th>
                    <th className="py-4 px-6 font-bold text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-[#E7DCC2]">
                  {boxes.map((box) => (
                    <tr key={box.id} className="hover:bg-[#FBEBCB]/15 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img 
                            src={box.image_url} 
                            alt={box.name} 
                            className="w-12 h-12 object-cover rounded-[8px]" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=60';
                            }}
                          />
                          <span className="font-bold text-slate-800 font-arabic">{box.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-arabic ${getStageColor(box.stage)}`}>
                          {getStageLabel(box.stage)}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-arabic text-slate-500">
                        {box.products?.length || 0} منتجات مضافة
                      </td>
                      <td className="py-4 px-6 font-black text-coral font-english">
                        {box.base_price} ج.م
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button onClick={() => toggleActive(box)} className="inline-block">
                          {box.is_active ? <ToggleRight className="w-7 h-7 text-sage" /> : <ToggleLeft className="w-7 h-7 text-slate-300" />}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => handleEditClick(box)} className="p-1.5 bg-slate-50 text-slate-500 hover:text-amber rounded-[8px] transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteBox(box.id)} className="p-1.5 bg-slate-50 text-slate-500 hover:text-rose-500 rounded-[8px] transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

          {/* 3. عرض القائمة (LIST VIEW) */}
          {viewMode === 'list' && (
            <motion.div 
              key="list"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {boxes.map((box) => (
                <motion.div 
                  layout
                  key={box.id} 
                  className="bg-white p-4 rounded-[16px] shadow-premium border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-premium-hover transition-all"
                >
                  <div className="flex items-center gap-4 text-right">
                    <img 
                      src={box.image_url} 
                      alt={box.name} 
                      className="w-16 h-16 object-cover rounded-[12px] border border-slate-100" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=60';
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 font-arabic">{box.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-arabic ${getStageColor(box.stage)}`}>
                          {getStageLabel(box.stage)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-arabic mt-1 line-clamp-1">{box.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-arabic block">سعر الحزمة:</span>
                      <span className="font-black text-lg text-[#2E7FD9] font-english">{box.base_price} ج.م</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleActive(box)}>
                        {box.is_active ? <ToggleRight className="w-7 h-7 text-emerald-500" /> : <ToggleLeft className="w-7 h-7 text-slate-300" />}
                      </button>
                      <button onClick={() => handleEditClick(box)} className="p-2 bg-slate-50 text-slate-500 hover:text-[#2E7FD9] rounded-[8px]"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteBox(box.id)} className="p-2 bg-slate-50 text-slate-500 hover:text-rose-500 rounded-[8px]"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        </>
    )}
    
    {/* Dialog for adding new stage */}
    {showAddStageDialog && (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-[24px] border border-[#E7DCC2] p-6 max-w-sm w-full space-y-4 shadow-xl text-right" dir="rtl">
          <div className="flex items-center justify-between border-b border-[#E7DCC2] pb-3">
            <span className="font-bold text-sm text-ink font-arabic">إضافة مرحلة تعليمية جديدة</span>
            <button type="button" onClick={() => setShowAddStageDialog(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            <Input
              label="اسم المرحلة التعليمية (بالعربية)"
              placeholder="مثال: المرحلة التمهيدية"
              value={newStageLabel}
              onChange={(e) => setNewStageLabel(e.target.value)}
              required
            />
            <Input
              label="رمز المرحلة (بالإنجليزي - اختياري)"
              placeholder="مثال: prep"
              value={newStageValue}
              onChange={(e) => setNewStageValue(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={handleAddStage}
              className="bg-amber hover:bg-amber-deep text-white text-xs font-bold px-4 py-2 rounded-[12px] transition-colors font-arabic"
            >
              حفظ وإضافة
            </button>
            <button
              type="button"
              onClick={() => setShowAddStageDialog(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-[12px] transition-colors font-arabic"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}

/* =========================================================
   BOX FORM PAGE (rendered when isFormOpen = true)
   ========================================================= */
function BoxFormPage({
  editingBox, formName, setFormName, formStage, setFormStage,
  formBasePrice, setFormBasePrice, formDesc, setFormDesc,
  formImageUrl, formIsActive, setFormIsActive,
  boxProducts, setBoxProducts,
  products, categories,
  handleImageUpload, handleSaveBox,
  searchProductQuery, setSearchProductQuery,
  showSearchResults, setShowSearchResults, searchResults,
  addProductToBox, removeProductFromBox, updateProductQty,
  runningTotalPrice,
  isCatalogOpen, setIsCatalogOpen,
  catalogSearch, setCatalogSearch,
  catalogCategory, setCatalogCategory,
  catalogProducts,
  onCancel,
  stages,
  setShowAddStageDialog
}: any) {
  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* هيدر صفحة الفورم */}
      <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-ink font-arabic">
            {editingBox ? 'تعديل حزمة البوكس المدرسي' : 'بناء بوكس تعليمي جديد متكامل'}
          </h3>
          <p className="text-xs text-slate-400 font-arabic mt-1">تحديد المرحلة والمواد والسعر التنافسي للحزمة</p>
        </div>
        <Button variant="outline" size="sm" className="font-arabic text-xs" onClick={onCancel}>
          العودة لقائمة البوكسات
        </Button>
      </div>

      <div className="bg-white p-6 rounded-[16px] shadow-premium border border-[#E7DCC2]">
        <form onSubmit={handleSaveBox} className="space-y-5">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="اسم البوكس" placeholder="مثال: بوكس أولى ابتدائي الممتاز" value={formName} onChange={(e: any) => setFormName(e.target.value)} required />
            
            <div className="w-full flex flex-col gap-1.5 text-right">
              <label className="text-sm font-semibold text-ink font-arabic">المرحلة التعليمية</label>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <select
                    value={formStage}
                    onChange={(e: any) => setFormStage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#E7DCC2] text-ink rounded-[12px] font-arabic appearance-none focus:outline-none focus:border-amber focus:ring-4 focus:ring-amber/10 transition-all duration-200"
                  >
                    {stages.map((opt: any) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-4 text-ink">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowAddStageDialog(true)}
                  className="bg-amber hover:bg-amber-deep text-white font-bold px-3.5 rounded-[12px] transition-colors flex items-center justify-center shadow-sm"
                  title="إضافة مرحلة تعليمية جديدة"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-sm font-semibold text-ink font-arabic">وصف البوكس وميزاته للعملاء</label>
            <textarea rows={2} placeholder="اكتب ما يميز هذا البوكس ومحتوياته ليظهر لزوار المتجر..." value={formDesc} onChange={(e: any) => setFormDesc(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-[#E7DCC2] text-ink rounded-[12px] font-arabic placeholder:text-slate-400 focus:outline-none focus:border-amber" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="سعر بيع البوكس للجمهور (ج.م)" type="number" value={formBasePrice === 0 ? '' : formBasePrice} onChange={(e: any) => setFormBasePrice(Number(e.target.value))} required />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-ink font-arabic">صورة الغلاف للبوكس</span>
              <label className="border border-[#E7DCC2] hover:bg-amber-light/20 px-4 py-2 rounded-[12px] flex items-center justify-between cursor-pointer text-slate-500 mt-1">
                <span className="text-xs font-arabic">{formImageUrl ? 'تم اختيار صورة' : 'اختر صورة...'}</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <span className="text-xs text-amber font-bold">رفع ملف</span>
              </label>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-ink font-arabic">حالة البوكس</span>
              <button type="button" onClick={() => setFormIsActive(!formIsActive)} className="flex items-center gap-2 py-2 px-3 border border-amber/20 rounded-[12px] bg-slate-50 hover:bg-slate-100/70 transition-colors justify-between text-slate-700 mt-1 w-full">
                <span className="text-xs font-arabic">عرض بالمتجر</span>
                {formIsActive ? <ToggleRight className="w-6 h-6 text-sage" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}
              </button>
            </div>
          </div>

          {/* منشئ المنتجات المضمنة */}
          <div className="border border-[#E7DCC2] rounded-[16px] bg-[#FBEBCB]/5 p-4 space-y-4">
            <div className="flex items-center justify-between gap-3 text-right">
              <div className="space-y-1">
                <span className="text-sm font-bold text-ink font-arabic">منشئ المنتجات المضمنة (Products Builder)</span>
                <p className="text-[10px] text-slate-400 font-arabic">ابحث عن الكتب والأدوات المكتبية وأضفها للبوكس</p>
              </div>
              <button type="button" onClick={() => setIsCatalogOpen(true)} className="px-3.5 py-2 bg-amber hover:bg-amber-deep text-white rounded-[12px] text-xs font-bold font-arabic flex items-center gap-1.5 shrink-0 transition-colors shadow-sm">
                <BookOpen className="w-4 h-4" />
                <span>تصفح كتالوج المتجر 🛒</span>
              </button>
            </div>

            <div className="bg-[#F6F1E4] p-3 border border-[#E7DCC2] rounded-[12px] flex items-start gap-2 text-[10px] text-ink leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-amber shrink-0 mt-0.5" />
              <div><strong className="block mb-0.5">سرية تسعير السلع للعملاء:</strong>المنتجات لن يظهر سعرها الفردي للمشترين، سيظهر إجمالي سعر الحزمة فقط.</div>
            </div>

            <div className="relative">
              <div className="relative">
                <Input placeholder="ابحث باسم الكتاب أو الأداة المكتبية لإضافتها..." value={searchProductQuery} onChange={(e: any) => { setSearchProductQuery(e.target.value); setShowSearchResults(e.target.value.trim() !== ''); }} className="pl-10" />
                <Search className="absolute left-3.5 bottom-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full right-0 left-0 bg-white border border-[#E7DCC2] rounded-[12px] shadow-lg mt-1 overflow-hidden z-20 divide-y divide-[#E7DCC2] text-right">
                  {searchResults.map((prod: any) => (
                    <button key={prod.id} type="button" onClick={() => addProductToBox(prod)} className="w-full px-4 py-2.5 hover:bg-slate-50 text-sm font-arabic font-bold text-slate-700 flex items-center justify-between">
                      <span>{prod.name}</span>
                      <span className="text-xs font-english text-amber bg-[#FBEBCB]/30 px-2 py-0.5 rounded">{prod.price_unit} ج.م</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {boxProducts.length > 0 ? (
              <div className="divide-y divide-dashed divide-[#E7DCC2] bg-white border border-[#E7DCC2] rounded-[12px] overflow-hidden">
                {boxProducts.map((item: any, idx: number) => {
                  const p = products.find((prod: any) => prod.id === item.product_id);
                  if (!p) return null;
                  return (
                    <div key={item.product_id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-arabic">
                      <div className="flex items-center gap-3 flex-1">
                        <img src={p.images?.[0]} alt={p.name} className="w-10 h-10 rounded-[8px] object-cover border border-[#E7DCC2] shrink-0" />
                        <div>
                          <span className="font-bold text-slate-700 block">{p.name}</span>
                          <span className="text-slate-400 text-[10px]">الترتيب في البوكس: #{idx + 1}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">الكمية:</span>
                          <input type="number" min="1" value={item.quantity} onChange={(e: any) => updateProductQty(item.product_id, Number(e.target.value))} className="w-16 bg-slate-50 border border-slate-200 rounded-[8px] py-1 text-center font-english font-bold text-slate-800 focus:outline-none focus:border-amber" />
                        </div>
                        <div className="w-24 text-left font-english font-bold text-ink">{p.price_unit * item.quantity} ج.م</div>
                        <button type="button" onClick={() => removeProductFromBox(item.product_id)} className="text-slate-400 hover:text-rose-500 p-1 hover:bg-rose-50 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 font-arabic text-xs border border-dashed border-[#E7DCC2] rounded-[12px] bg-white">
                لم يتم تضمين أي منتجات بعد. اضغط تصفح الكتالوج أو ابحث بالأعلى!
              </div>
            )}

            {boxProducts.length > 0 && (
              <div className="bg-white border border-[#E7DCC2] rounded-[12px] p-3 text-xs font-arabic space-y-2">
                <div className="flex justify-between text-slate-500"><span>مجموع المنتجات:</span><span className="font-english font-bold">{runningTotalPrice} ج.م</span></div>
                <div className="flex justify-between text-coral font-bold"><span>سعر بيع البوكس:</span><span className="font-english font-bold">{formBasePrice} ج.م</span></div>
                <div className="h-px bg-slate-100" />
                <div className="flex justify-between text-emerald-600 font-bold"><span>توفير الباقة:</span><span className="font-english font-bold">{runningTotalPrice - formBasePrice > 0 ? `${runningTotalPrice - formBasePrice} ج.م` : '0 ج.م'}</span></div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" className="font-arabic" onClick={onCancel}>إلغاء والعودة</Button>
            <Button type="submit" variant="primary" size="sm" className="font-arabic">{editingBox ? 'حفظ التعديلات' : 'حفظ البوكس التعليمي'}</Button>
          </div>
        </form>
      </div>

      {/* مودال تصفح الكتالوج - مقفل من الخارج */}
      <Dialog isOpen={isCatalogOpen} onClose={() => setIsCatalogOpen(false)} title="تصفح كتالوج المتجر واختيار المنتجات" size="xl" disableBackdropClose>
        <div className="space-y-4 font-arabic text-right" dir="rtl">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Input placeholder="ابحث باسم الكتاب أو الأداة..." value={catalogSearch} onChange={(e: any) => setCatalogSearch(e.target.value)} className="pl-10 text-xs" />
              <Search className="absolute left-3.5 bottom-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="w-48 shrink-0">
              <Select options={[{ value: 'all', label: 'كل الأقسام' }, ...categories.map((c: any) => ({ value: c.id, label: c.name }))]} value={catalogCategory} onChange={(e: any) => setCatalogCategory(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto py-1 scrollbar-thin">
            {catalogProducts.map((prod: any) => {
              const alreadyAdded = boxProducts.some((bp: any) => bp.product_id === prod.id);
              return (
                <button key={prod.id} type="button" onClick={() => { if (!alreadyAdded) { addProductToBox(prod); } }} disabled={alreadyAdded} className={`border rounded-[12px] overflow-hidden text-right transition-all ${alreadyAdded ? 'opacity-50 cursor-not-allowed border-emerald-300 bg-emerald-50' : 'hover:border-amber hover:shadow-md border-slate-200 bg-white'}`}>
                  <img src={prod.images?.[0] || ''} alt={prod.name} className="w-full h-28 object-cover" />
                  <div className="p-2.5">
                    <p className="text-[10px] font-bold text-slate-700 font-arabic line-clamp-2 leading-snug">{prod.name}</p>
                    <p className="text-xs text-coral font-english font-black mt-1">{prod.price_unit} ج.م</p>
                    {alreadyAdded && <span className="text-[9px] text-emerald-600 font-bold">✔ مضاف للبوكس</span>}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="border-t border-slate-100 pt-3 flex justify-end">
            <Button type="button" variant="primary" size="sm" className="font-arabic" onClick={() => setIsCatalogOpen(false)}>تم - أغلق الكتالوج</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
