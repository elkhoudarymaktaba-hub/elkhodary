'use client';

import { useState, useMemo } from 'react';
import ProductCard, { Product } from '@/components/store/product-card';
import { Search, SlidersHorizontal, Trash2, HelpCircle } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductsClientProps {
  categories: Category[];
  initialProducts: Product[];
}

export default function ProductsClient({ categories, initialProducts }: ProductsClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setMinPrice(0);
    setMaxPrice(1000);
  };

  // Live filter logic
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || product.category_id === selectedCategory;

      const matchesPrice =
        product.price_unit >= minPrice && product.price_unit <= maxPrice;

      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [initialProducts, searchTerm, selectedCategory, minPrice, maxPrice]);

  return (
    <div className="space-y-8">
      {/* Search and action bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        
        {/* Search Input */}
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="ابحث عن كشكول، قلم، مسطرة أو أي مستلزمات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-11 py-3 bg-white rounded-input border border-paper-line focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber shadow-sm text-sm"
          />
          <Search size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-ink-soft/40" />
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-cta text-xs font-bold border transition-colors ${
            showFilters
              ? 'bg-ink border-ink text-white shadow-brand'
              : 'bg-white border-paper-line text-ink-soft hover:bg-paper-dark'
          }`}
        >
          <SlidersHorizontal size={14} />
          <span>تصفية متقدمة</span>
        </button>
      </div>

      {/* Advanced Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-card border border-paper-line p-6 shadow-brand animate-fade-in-down grid grid-cols-1 md:grid-cols-2 gap-6 relative z-30">
          {/* Price Range */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-xs text-ink">نطاق السعر (ج.م)</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[10px] text-ink-soft/50 block mb-1 font-bold">الحد الأدنى</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full p-2 bg-paper rounded-input border border-paper-line focus:outline-none text-xs font-numbers text-center font-bold"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-ink-soft/50 block mb-1 font-bold">الحد الأقصى</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full p-2 bg-paper rounded-input border border-paper-line focus:outline-none text-xs font-numbers text-center font-bold"
                />
              </div>
            </div>
          </div>

          {/* Reset Filters */}
          <div className="flex items-end justify-start md:justify-end">
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 text-xs text-rose-600 font-bold hover:bg-rose-50 px-4 py-2.5 rounded-full border border-rose-100 transition-colors"
            >
              <Trash2 size={14} />
              <span>إعادة ضبط الفلاتر</span>
            </button>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2.5 border-b border-paper-line no-scrollbar">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
            selectedCategory === 'all'
              ? 'bg-ink border-ink text-white shadow-sm'
              : 'bg-white border-paper-line text-ink-soft/80 hover:border-amber/35 hover:text-ink'
          }`}
        >
          الكل
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
              selectedCategory === cat.id
                ? 'bg-ink border-ink text-white shadow-sm'
                : 'bg-white border-paper-line text-ink-soft/80 hover:border-amber/35 hover:text-ink'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="flex items-center justify-between text-xs text-ink-soft/50 font-bold">
        <p>
          تم العثور على <strong className="font-numbers text-coral">{filteredProducts.length}</strong> منتج
        </p>
        {(searchTerm || selectedCategory !== 'all' || minPrice > 0 || maxPrice < 1000) && (
          <p className="text-amber-deep">تصفية نشطة حالياً</p>
        )}
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-card border border-paper-line p-16 text-center shadow-card">
          <HelpCircle size={40} className="mx-auto text-ink-soft/20 mb-4 animate-bounce" />
          <h3 className="font-bold text-base text-ink mb-1">لم نجد أي نتائج تطابق بحثك</h3>
          <p className="text-ink-soft/60 text-xs max-w-sm mx-auto leading-relaxed mb-6">
            تأكد من كتابة الكلمات بشكل صحيح أو حاول إعادة ضبط فلاتر البحث ونطاقات الأسعار.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-6 py-2.5 bg-paper-dark text-ink font-bold text-xs rounded-cta hover:bg-ink hover:text-white transition-colors border border-paper-line"
          >
            عرض كافة المنتجات
          </button>
        </div>
      )}
    </div>
  );
}
