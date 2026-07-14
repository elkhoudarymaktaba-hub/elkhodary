'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Minus, ArrowLeft, ArrowRight, ShoppingCart, Check, HelpCircle, Layers, GraduationCap, Package } from 'lucide-react';
import BoxVisualPreview from '@/components/store/box-visual-preview';
import { useCartStore } from '@/lib/store/cart';
import { trackClientEvent } from '@/lib/tracking';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  price_unit: number;
  price_box?: number | null;
  images: string[];
  category_id: string;
  categories?: { id: string; name: string } | null;
}

interface BaseBox {
  id: string;
  name: string;
  stage: string;
  base_price: number;
  image?: string;
  items: Array<{ product_id: string; qty: number }>;
}

interface BoxBuilderClientProps {
  categories: Category[];
  products: Product[];
  baseBoxes: BaseBox[];
  initialStageParam?: string;
  stagesContent?: any;
}

export default function BoxBuilderClient({
  categories,
  products,
  baseBoxes,
  initialStageParam,
  stagesContent,
}: BoxBuilderClientProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const [step, setStep] = useState(1);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  interface CustomBoxItem {
    productId: string;
    name: string;
    qty: number;
    price: number;
    image: string;
    categoryId: string;
    categoryName: string;
    unitType: 'piece' | 'box';
  }
  const [boxItems, setBoxItems] = useState<CustomBoxItem[]>([]);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (initialStageParam) {
      const stage = initialStageParam.toLowerCase();
      setSelectedStage(stage);
      loadBaseBoxForStage(stage);
      setStep(2);
    }
  }, [initialStageParam]);

  const loadBaseBoxForStage = (stage: string) => {
    const matchingBaseBox = baseBoxes.find((b) => b.stage.toLowerCase() === stage);
    if (matchingBaseBox && matchingBaseBox.items) {
      const itemsLoaded = matchingBaseBox.items.map((bItem) => {
        const prod = products.find((p) => p.id === bItem.product_id);
        return {
          productId: bItem.product_id,
          name: prod?.name || 'منتج غير معروف',
          qty: bItem.qty,
          price: prod?.price_unit || 0,
          image: prod?.images?.[0] || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=150&q=80',
          categoryId: prod?.category_id || '',
          categoryName: categories.find((c) => c.id === prod?.category_id)?.name || prod?.categories?.name || 'أدوات مدرسية',
          unitType: 'piece' as const,
        };
      });
      setBoxItems(itemsLoaded);
    } else {
      setBoxItems([]);
    }
  };

  const handleSelectStage = (stage: string) => {
    setSelectedStage(stage);
    loadBaseBoxForStage(stage);
    setStep(2);
  };

  const handleUpdateProductQty = (product: Product, delta: number, unitType: 'piece' | 'box' = 'piece') => {
    setBoxItems((prevItems) => {
      const existing = prevItems.find((i) => i.productId === product.id && i.unitType === unitType);

      if (existing) {
        const newQty = existing.qty + delta;
        if (newQty <= 0) {
          return prevItems.filter((i) => !(i.productId === product.id && i.unitType === unitType));
        }
        return prevItems.map((i) => (i.productId === product.id && i.unitType === unitType ? { ...i, qty: newQty } : i));
      } else if (delta > 0) {
        const itemPrice = unitType === 'box' ? (product.price_box || product.price_unit) : product.price_unit;
        const itemName = unitType === 'box' ? `${product.name} (علبة)` : product.name;
        return [
          ...prevItems,
          {
            productId: product.id,
            name: itemName,
            qty: 1,
            price: itemPrice,
            image: product.images?.[0] || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=150&q=80',
            categoryId: product.category_id,
            categoryName: categories.find((c) => c.id === product.category_id)?.name || product.categories?.name || 'أدوات مدرسية',
            unitType,
          },
        ];
      }
      return prevItems;
    });
  };

  const getQtyInBox = (productId: string, unitType: 'piece' | 'box') => {
    return boxItems.find((i) => i.productId === productId && i.unitType === unitType)?.qty || 0;
  };

  const totalPrice = useMemo(() => {
    return boxItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [boxItems]);

  const totalItemsCount = useMemo(() => {
    return boxItems.reduce((sum, item) => sum + item.qty, 0);
  }, [boxItems]);

  const filteredProducts = useMemo(() => {
    if (activeCategoryTab === 'all') return products;
    return products.filter((p) => p.category_id === activeCategoryTab);
  }, [products, activeCategoryTab]);

  const handleSaveBoxToCart = () => {
    if (boxItems.length === 0) return;

    const stageLabel = selectedStage
      ? selectedStage === 'kg' ? 'KG' : selectedStage === 'primary' ? 'ابتدائي' : selectedStage === 'middle' ? 'إعدادي' : 'ثانوي'
      : 'مخصص';

    addItem({
      type: 'box',
      name: `صندوق مخصص (${stageLabel})`,
      price: totalPrice,
      qty: 1,
      image: boxItems[0]?.image || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80',
      stage: selectedStage || 'custom',
      customItems: boxItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        qty: item.qty,
        price: item.price,
        image: item.image,
        category: item.categoryName,
        unitType: item.unitType,
      })),
    });

    trackClientEvent('AddToCart', {
      id: `custom_box_${Date.now()}`,
      name: `صندوق مخصص (${stageLabel})`,
      value: totalPrice,
      qty: 1,
    });

    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      router.push('/cart');
    }, 1500);
  };

  const getStageTitle = (stage: string) => {
    switch (stage) {
      case 'kg': return 'رياض الأطفال (KG)';
      case 'primary': return 'المرحلة الابتدائية';
      case 'middle': return 'المرحلة الإعدادية';
      case 'high': return 'المرحلة الثانوية';
      default: return stage;
    }
  };

  return (
    <div className="space-y-8 pt-32">
      {/* Steps Indicator */}
      <div className="flex items-center justify-center gap-6 text-xs sm:text-sm font-bold border-b border-paper-line pb-6 max-w-xl mx-auto font-cairo">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-ink text-white' : 'bg-paper border border-paper-line text-ink-soft/50'}`}>1</span>
          <span className={step >= 1 ? 'text-ink font-black' : 'text-ink-soft/50'}>اختيار المرحلة</span>
        </div>
        <div className="w-10 h-[1.5px] bg-paper-line" />
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-ink text-white' : 'bg-paper border border-paper-line text-ink-soft/50'}`}>2</span>
          <span className={step >= 2 ? 'text-ink font-black' : 'text-ink-soft/50'}>تخصيص الأدوات</span>
        </div>
      </div>

      {/* --- STEP 1: CHOOSE STAGE --- */}
      {step === 1 && (() => {
        const stageSettings = stagesContent || {
          title: 'اختر المرحلة الدراسية للبدء',
          subtitle: 'سنقوم بتحميل باقة مقترحة مسبقاً لتسهيل عملية التخصيص عليك.',
          kg_title: 'رياض الأطفال (KG)',
          kg_desc: 'باقة تحتوي على كراسات رسم، ألوان خشب، صلصال وأقلام تلوين تناسب سن الروضة.',
          kg_price: '320',
          primary_title: 'المرحلة الابتدائية',
          primary_desc: 'باقة تحتوي على كشاكيل كتابة عادية، أقلام رصاص، جوم ومستلزمات الحساب.',
          primary_price: '480',
          middle_title: 'المرحلة الإعدادية',
          middle_desc: 'باقة مجهزة بأدوات الهندسة، مقلمة، كشاكيل سلك وأقلام حبر متعددة.',
          middle_price: '620',
          high_title: 'المرحلة الثانوية',
          high_desc: 'باقة متكاملة تحوي كشاكيل جامعية كبيرة، أوراق فلوسكاب وأقلام حبر فارخرة.',
          high_price: '780',
          cta_text: 'تخصيص الباقة'
        };

        return (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center space-y-1">
              <h2 className="font-extrabold text-lg sm:text-xl text-ink">{stageSettings.title}</h2>
              <p className="text-ink-soft/50 text-xs">{stageSettings.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { id: 'kg', name: stageSettings.kg_title, price: stageSettings.kg_price, desc: stageSettings.kg_desc, color: 'bg-amber' },
                { id: 'primary', name: stageSettings.primary_title, price: stageSettings.primary_price, desc: stageSettings.primary_desc, color: 'bg-amber' },
                { id: 'middle', name: stageSettings.middle_title, price: stageSettings.middle_price, desc: stageSettings.middle_desc, color: 'bg-amber' },
                { id: 'high', name: stageSettings.high_title, price: stageSettings.high_price, desc: stageSettings.high_desc, color: 'bg-amber' },
              ].map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => handleSelectStage(stage.id)}
                  className="bg-white rounded-card p-6 border border-paper-line hover:border-amber/55 text-right hover:shadow-brand hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-52 relative pr-8 pl-5"
                >
                  {/* Book Spine */}
                  <div className={`w-3.5 h-full absolute right-0 top-0 bottom-0 ${stage.color} rounded-r-card z-10`} />

                  {/* Spiral wire rings */}
                  <div className="absolute right-[10px] top-6 bottom-6 flex flex-col justify-between pointer-events-none z-20">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full border-[1.5px] border-ink bg-paper" />
                    ))}
                  </div>

                  <div className="space-y-2 pr-2">
                    <div className="w-9 h-9 rounded-full bg-paper flex items-center justify-center text-ink border border-paper-line">
                      <GraduationCap size={16} />
                    </div>
                    <h3 className="font-black text-ink text-base sm:text-lg">{stage.name}</h3>
                    <p className="text-ink-soft/70 text-xs leading-relaxed font-medium">{stage.desc}</p>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-dashed border-paper-line pt-3 mt-2 w-full text-xs font-bold text-ink-soft pr-2">
                    <span className="font-numbers text-coral-deep">تبدأ من {stage.price} ج.م</span>
                    <span className="flex items-center gap-1 hover:text-coral transition-colors">
                      {stageSettings.cta_text || 'تخصيص الباقة'} <ArrowLeft size={14} className="text-amber" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* --- STEP 2: CUSTOMIZE BOX --- */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* RIGHT SIDE: Category selector & product lists */}
          <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
            <div className="bg-white rounded-card shadow-card border border-paper-line p-5">
              
              {/* Back to step 1 */}
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs text-ink-soft/50 hover:text-coral font-bold mb-4 transition-colors"
              >
                <ArrowRight size={14} className="text-amber" />
                <span>الرجوع لاختيار المرحلة</span>
              </button>

              <div className="flex items-center gap-2.5 mb-2">
                <h3 className="font-extrabold text-base text-ink">تخصيص محتويات صندوق:</h3>
                <span className="text-xs bg-sage/10 text-sage-deep font-bold px-2.5 py-0.5 rounded-full border border-sage/10">
                  {selectedStage ? getStageTitle(selectedStage) : ''}
                </span>
              </div>
              <p className="text-ink-soft/50 text-xs mb-6">تصفح التبويبات وأضف الكشاكيل، الأقلام والقرطاسية بالكميات المفضلة لديك.</p>

              {/* Category tabs */}
              <div className="flex gap-2 overflow-x-auto pb-3 border-b border-paper-line no-scrollbar">
                <button
                  onClick={() => setActiveCategoryTab('all')}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
                    activeCategoryTab === 'all'
                      ? 'bg-ink border-ink text-white shadow-sm'
                      : 'bg-paper border-paper-line text-ink-soft/80 hover:text-ink hover:border-amber/35'
                  }`}
                >
                  الكل
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryTab(cat.id)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
                      activeCategoryTab === cat.id
                        ? 'bg-ink border-ink text-white shadow-sm'
                        : 'bg-paper border-paper-line text-ink-soft/80 hover:text-ink hover:border-amber/35'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Products list within categories */}
              {filteredProducts.length > 0 ? (
                <div className="divide-y divide-paper-dark/60 mt-4">
                  {filteredProducts.map((prod) => {
                    const qtyPieces = getQtyInBox(prod.id, 'piece');
                    const qtyBoxes = getQtyInBox(prod.id, 'box');
                    return (
                      <div key={prod.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 last:border-0">
                        
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 bg-paper rounded-lg overflow-hidden shrink-0 border border-paper-line">
                            <Image
                              src={prod.images?.[0] || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=100&q=80'}
                              alt={prod.name}
                              fill
                              sizes="48px"
                              className="object-contain p-1"
                            />
                          </div>

                          <div className="min-w-0 text-right">
                            <h4 className="font-bold text-xs text-ink leading-snug">{prod.name}</h4>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                              <span className="text-[10px] text-ink-soft/60 font-numbers font-bold">
                                {prod.price_unit} ج.م <span className="font-cairo font-normal">/ قطعة</span>
                              </span>
                              {prod.price_box && prod.price_box > 0 && (
                                <>
                                  <span className="text-slate-300">|</span>
                                  <span className="text-[10px] text-sage-deep font-numbers font-bold">
                                    {prod.price_box} ... <span className="font-cairo font-normal">/ علبة</span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="shrink-0 flex items-center gap-4 self-end sm:self-center">
                          {/* Unit (Piece) Control */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-bold">قطعة:</span>
                            {qtyPieces > 0 ? (
                              <div className="flex items-center bg-paper border border-paper-line rounded-full p-0.5 shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateProductQty(prod, -1, 'piece')}
                                  className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-ink hover:bg-paper-dark border border-paper-line transition-all"
                                >
                                  <Minus size={9} />
                                </button>
                                <span className="w-5 text-center font-bold text-xs font-numbers text-ink">
                                  {qtyPieces}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateProductQty(prod, 1, 'piece')}
                                  className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-ink hover:bg-paper-dark border border-paper-line transition-all"
                                >
                                  <Plus size={9} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleUpdateProductQty(prod, 1, 'piece')}
                                className="py-1 px-3 bg-white border border-paper-line text-ink-soft hover:bg-ink hover:text-white hover:border-ink text-[10px] font-bold rounded-full transition-colors flex items-center gap-1 shadow-sm"
                              >
                                <Plus size={10} className="text-amber" />
                                <span>إضافة قطعة</span>
                              </button>
                            )}
                          </div>

                          {/* Wholesale (Box) Control */}
                          {prod.price_box && prod.price_box > 0 && (
                            <div className="flex items-center gap-2 border-r border-slate-100 pr-4">
                              <span className="text-[10px] text-slate-400 font-bold">علبة:</span>
                              {qtyBoxes > 0 ? (
                                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-full p-0.5 shadow-sm">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateProductQty(prod, -1, 'box')}
                                    className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-ink hover:bg-slate-200 border border-slate-200 transition-all"
                                  >
                                    <Minus size={9} />
                                  </button>
                                  <span className="w-5 text-center font-bold text-xs font-numbers text-ink">
                                    {qtyBoxes}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateProductQty(prod, 1, 'box')}
                                    className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-ink hover:bg-slate-200 border border-slate-200 transition-all"
                                  >
                                    <Plus size={9} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateProductQty(prod, 1, 'box')}
                                  className="py-1 px-3 bg-ink-soft/5 border border-ink-soft/30 text-ink-soft hover:bg-ink-soft hover:text-white text-[10px] font-bold rounded-full transition-all flex items-center gap-1 shadow-sm"
                                >
                                  <Plus size={10} className="text-amber" />
                                  <span>إضافة علبة</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <HelpCircle size={36} className="mx-auto text-ink-soft/20 mb-2" />
                  <p className="text-ink-soft/50 text-xs font-bold">لا تتوفر منتجات في هذا التصنيف حالياً.</p>
                </div>
              )}

            </div>
          </div>

          {/* LEFT SIDE: Visual box slots preview & Pricing card */}
          <div className="lg:col-span-5 space-y-6 order-1 lg:order-2 lg:sticky lg:top-28">
            <BoxVisualPreview
              items={boxItems}
              boxName={`صندوق مخصص - ${selectedStage ? getStageTitle(selectedStage) : 'مطور'}`}
              stageName={selectedStage || undefined}
            />

            {/* Pricing card */}
            <div className="bg-white rounded-card border border-paper-line shadow-card p-5 space-y-4">
              <h4 className="font-extrabold text-ink text-sm">ملخص الصندوق المخصص</h4>
              
              <div className="space-y-2 text-xs text-ink-soft/60 pt-3 border-t border-dashed border-paper-line font-bold">
                <div className="flex justify-between">
                  <span>العناصر الفريدة:</span>
                  <span className="font-numbers text-ink">{boxItems.length} منتجات</span>
                </div>
                <div className="flex justify-between">
                  <span>إجمالي القطع في الصندوق:</span>
                  <span className="font-numbers text-ink">{totalItemsCount} قطعة</span>
                </div>
                <div className="flex justify-between items-baseline pt-3 border-t border-paper-line text-ink text-sm font-bold">
                  <span>سعر الصندوق الإجمالي:</span>
                  <span className="text-coral-deep font-black font-numbers text-lg">
                    {totalPrice.toFixed(2)} ج.م
                  </span>
                </div>
              </div>

              {/* Add Box to Cart */}
              <button
                onClick={handleSaveBoxToCart}
                disabled={added || boxItems.length === 0}
                className={`w-full py-3.5 px-6 font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                  added
                    ? 'bg-emerald-500 text-white border-emerald-500 rounded-cta'
                    : 'btn-primary shadow-glow'
                }`}
              >
                {added ? (
                  <>
                    <Check size={18} />
                    <span>تم إضافة الصندوق المخصص للسلة!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} className="text-amber" />
                    <span>أضف الصندوق للسلة</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
