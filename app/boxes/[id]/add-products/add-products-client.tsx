'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getMockData } from '@/lib/mockData';

interface AddProductsClientProps {
  box: {
    id: string;
    name: string;
  };
}

export default function AddProductsClient({ box }: AddProductsClientProps) {
  const router = useRouter();
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('all');
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load custom items count to show in header badge
  const [itemsCount, setItemsCount] = useState(0);

  const loadItemsCount = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`kh_custom_box_${box.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const count = parsed.reduce((sum: number, item: any) => sum + (item.qty || 1), 0);
          setItemsCount(count);
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  useEffect(() => {
    loadItemsCount();
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const { data: cats } = await supabase.from('categories').select('*').order('name');
        const { data: prods } = await supabase.from('products').select('*, categories(name)').eq('is_active', true);
        
        let finalProds = prods || [];
        let finalCats = cats || [];

        if (finalProds.length === 0) {
          finalProds = getMockData.products();
        }
        if (finalCats.length === 0) {
          finalCats = getMockData.categories();
        }

        setCatalogProducts(finalProds);
        setCatalogCategories(finalCats);
      } catch (e) {
        console.error(e);
        setCatalogProducts(getMockData.products());
        setCatalogCategories(getMockData.categories());
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, [box.id]);

  const filteredCatalogProducts = useMemo(() => {
    return catalogProducts.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(catalogSearch.toLowerCase());
      const matchesCategory = catalogCategory === 'all' || p.category_id === catalogCategory;
      return matchesSearch && matchesCategory;
    });
  }, [catalogProducts, catalogSearch, catalogCategory]);

  const handleAddCatalogProduct = (prod: any, qty: number, colors?: string[]) => {
    if (typeof window === 'undefined') return;
    
    const saved = localStorage.getItem(`kh_custom_box_${box.id}`);
    let items: any[] = [];
    if (saved) {
      try {
        items = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }

    const existing = items.find((item) => item.productId === prod.id);
    let updatedItems = [];
    if (existing) {
      updatedItems = items.map((item) => {
        if (item.productId === prod.id) {
          return {
            ...item,
            qty: item.qty + qty,
            colors: item.colors ? [...item.colors, ...(colors || [])] : colors
          };
        }
        return item;
      });
    } else {
      updatedItems = [
        ...items,
        {
          productId: prod.id,
          name: prod.name,
          qty: qty,
          price: prod.price_unit,
          image: prod.images?.[0] || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=150&q=80',
          categoryId: prod.category_id,
          categoryName: prod.categories?.name || 'أدوات مدرسية',
          colors: colors
        }
      ];
    }

    localStorage.setItem(`kh_custom_box_${box.id}`, JSON.stringify(updatedItems));
    loadItemsCount();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Header section */}
      <div className="bg-white p-6 rounded-[24px] border border-paper-line shadow-premium flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 mb-1 flex-row-reverse">
            <h1 className="font-extrabold text-lg text-ink font-arabic">إضافة منتجات للباقة:</h1>
            <span className="text-lg font-black text-amber font-arabic">{box.name}</span>
          </div>
          <p className="text-xs text-slate-400 font-arabic">تصفح منتجات المكتبة وقم بإضافتها مباشرة للباقة وتحديد خياراتها.</p>
        </div>
        
        <div className="flex items-center gap-3 flex-row-reverse">
          <Link
            href={`/boxes/${box.id}`}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-paper-line text-xs font-bold text-slate-700 rounded-xl transition-all font-arabic shadow-sm"
          >
            <ArrowRight size={14} />
            <span>العودة لتعديل الباقة</span>
          </Link>
          
          <Link
            href={`/boxes/${box.id}`}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber hover:bg-amber-deep text-white text-xs font-bold rounded-xl transition-all font-arabic shadow-md shadow-amber/20"
          >
            <ShoppingBag size={14} />
            <span>محتويات الباقة</span>
            <span className="bg-white text-amber rounded-full px-2 py-0.5 text-[10px] font-black font-numbers">{itemsCount}</span>
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white rounded-[16px] border border-paper-line shadow-premium flex flex-col sm:flex-row gap-3" dir="rtl">
        <input
          type="text"
          placeholder="ابحث عن منتج بالاسم..."
          value={catalogSearch}
          onChange={(e) => setCatalogSearch(e.target.value)}
          className="flex-grow px-4 py-2.5 border border-paper-line rounded-xl text-xs font-arabic focus:outline-none focus:border-amber bg-white text-right"
        />
        <select
          value={catalogCategory}
          onChange={(e) => setCatalogCategory(e.target.value)}
          className="px-4 py-2.5 border border-paper-line rounded-xl text-xs font-arabic focus:outline-none focus:border-amber bg-white cursor-pointer sm:w-56 text-right"
        >
          <option value="all">كل الأقسام</option>
          {catalogCategories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Grid of products */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-ink">
          <svg className="animate-spin h-8 w-8 text-amber" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="font-bold font-arabic text-sm">جاري تحميل المنتجات...</span>
        </div>
      ) : filteredCatalogProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" dir="rtl">
          {filteredCatalogProducts.map((prod) => {
            const desc = prod.description || '';
            const colorsMatch = desc.match(/\[COLORS\]:\s*(.+)$/m);
            const prodColors = colorsMatch && colorsMatch[1]
              ? colorsMatch[1].split(',').map((c: string) => c.trim()).filter(Boolean)
              : [];

            return (
              <CatalogProductItem 
                key={prod.id} 
                product={prod} 
                colors={prodColors} 
                boxId={box.id} 
                onAdd={(qty, selectedColors) => handleAddCatalogProduct(prod, qty, selectedColors)} 
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-[24px] border border-paper-line shadow-premium w-full">
          <p className="text-slate-400 font-arabic text-sm">لا توجد منتجات مطابقة لخيارات البحث حالياً.</p>
        </div>
      )}
    </div>
  );
}

function CatalogProductItem({ 
  product, 
  colors, 
  boxId, 
  onAdd 
}: { 
  product: any, 
  colors: string[], 
  boxId: string, 
  onAdd: (qty: number, selectedColors: string[]) => void 
}) {
  const [qty, setQty] = useState(1);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (colors.length > 0) {
      setSelectedColors(prev => {
        const next = [...prev];
        while (next.length < qty) {
          next.push(colors[0]);
        }
        next.length = qty;
        return next;
      });
    }
  }, [qty, colors]);

  const handleAdd = () => {
    onAdd(qty, colors.length > 0 ? selectedColors : []);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="p-4 border border-paper-line rounded-card flex flex-col justify-between gap-4 hover:border-amber/40 hover:shadow-brand transition-all duration-300 bg-white text-right" dir="rtl">
      
      {/* Image & Title */}
      <div className="space-y-3">
        <Link href={`/products/${product.id}?boxId=${boxId}`} className="relative block aspect-square w-full bg-slate-50/50 rounded-xl overflow-hidden border border-slate-100 group">
          <img
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80'}
            alt={product.name}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        
        <div>
          <Link href={`/products/${product.id}?boxId=${boxId}`} className="block hover:text-amber transition-colors">
            <h5 className="font-extrabold text-sm text-ink line-clamp-1 leading-snug font-arabic">{product.name}</h5>
          </Link>
          <span className="text-xs text-amber font-extrabold font-numbers mt-1 block">{product.price_unit} ج.م</span>
        </div>
      </div>

      {/* Colors selectors if any */}
      {colors.length > 0 && (
        <div className="space-y-1.5 p-2 bg-slate-50 rounded-lg text-right" dir="rtl">
          <span className="block text-[9px] font-bold text-slate-500 font-arabic">اختر الألوان:</span>
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: qty }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-[9px]">
                <span className="text-slate-400 font-arabic">القطعة {i + 1}:</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {colors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setSelectedColors(prev => {
                          const updated = [...prev];
                          updated[i] = color;
                          return updated;
                        });
                      }}
                      className={`px-2 py-0.5 rounded-full border text-[8px] font-bold transition-all ${
                        selectedColors[i] === color
                          ? 'bg-amber border-amber text-white'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-dashed border-slate-100">
        <div className="flex items-center bg-slate-50 border border-paper-line rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-ink border border-paper-line text-sm font-bold active:scale-90 transition-all"
          >
            -
          </button>
          <span className="w-8 text-center font-bold text-sm font-numbers text-ink">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty(qty + 1)}
            className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-ink border border-paper-line text-sm font-bold active:scale-90 transition-all"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={added}
          className={`py-2 px-4 font-bold text-xs rounded-lg transition-all ${
            added
              ? 'bg-emerald-500 text-white'
              : 'bg-ink hover:bg-ink-soft text-white'
          }`}
        >
          {added ? 'تمت الإضافة للباقة!' : 'إضافة للباقة'}
        </button>
      </div>
    </div>
  );
}
