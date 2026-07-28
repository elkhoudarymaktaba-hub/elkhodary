// app/admin/products/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { 
  Search, Plus, Star, StarOff, Edit2, Trash2, ToggleLeft, 
  ToggleRight, Check, AlertCircle, Upload, X, ChevronLeft, ChevronRight, Image as ImageIcon, Sparkles
} from 'lucide-react';
import { supabase, compressImageToWebP } from '@/lib/supabase';
import { getMockData, saveMockData, Product, Category } from '@/lib/mockData';
import { useRole } from '@/lib/useRole';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function ProductsPage() {
  const { checkPermission } = useRole();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // الفلترة والبحث
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, name, price_asc, price_desc, default
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel');
  const [exportRange, setExportRange] = useState<'all' | 'today' | 'week' | 'month' | 'year' | 'custom'>('all');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  // نافذة الإضافة والتعديل
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // نافذة التعديل الجماعي للأسعار
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [bulkTargetCategory, setBulkTargetCategory] = useState('all');
  const [bulkAdjustmentType, setBulkAdjustmentType] = useState('increase'); // 'increase' | 'decrease'
  const [bulkPercentage, setBulkPercentage] = useState(5);
  const [bulkRounding, setBulkRounding] = useState('none'); // 'none' | 'half' | 'integer'

  // حقول نموذج المنتج
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formCategories, setFormCategories] = useState<string[]>([]); // للأقسام المتعددة
  const [formPriceUnit, setFormPriceUnit] = useState(0);
  const [formPriceBox, setFormPriceBox] = useState(0);
  const [formBoxQtyLabel, setFormBoxQtyLabel] = useState('');
  const [formStock, setFormStock] = useState(0);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formSortOrderGeneral, setFormSortOrderGeneral] = useState(0);
  const [formSortOrderCategory, setFormSortOrderCategory] = useState(0);
  const [formBadge, setFormBadge] = useState('');
  
  // حقول السيو لمحركات البحث
  const [formSeoTitle, setFormSeoTitle] = useState('');
  const [formSeoDesc, setFormSeoDesc] = useState('');
  const [formSeoKeywords, setFormSeoKeywords] = useState('');

  // خيارات الألوان المتعددة للمنتج
  const [formColorsEnabled, setFormColorsEnabled] = useState(false);
  const [formColors, setFormColors] = useState<string[]>([]);
  const [newColorInput, setNewColorInput] = useState('');

  // خيارات المقاسات والأحجام المتعددة بأسعار خاصة لكل مقاس
  const [formSizesEnabled, setFormSizesEnabled] = useState(false);
  const [formSizes, setFormSizes] = useState<{ name: string; price: number }[]>([]);
  const [newSizeNameInput, setNewSizeNameInput] = useState('');
  const [newSizePriceInput, setNewSizePriceInput] = useState<number | ''>('');
  const [newSizeBoxPriceInput, setNewSizeBoxPriceInput] = useState<number | ''>('');
  const [sizeTypeIndividual, setSizeTypeIndividual] = useState(true);
  const [sizeTypeBox, setSizeTypeBox] = useState(false);

  // حالات ودوال السحب والإفلات لترتيب الصور
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newImages = [...formImages];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, draggedItem);

    setFormImages(newImages);
    setDraggedIndex(null);
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const newImages = [...formImages];
    // الرؤية RTL: الحركة لليمين تعني تقليل الاندكس (السابق)، واليسار زيادة الاندكس (التالي)
    const targetIndex = direction === 'right' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    setFormImages(newImages);
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    const newImages = [...formImages];
    const picked = newImages[index];
    newImages.splice(index, 1);
    newImages.unshift(picked);
    setFormImages(newImages);
  };
  
  // رفع الصور
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // دالة تغيير الترتيب مباشرة من الجدول
  const handleInlineSortChange = async (productId: string, field: 'sort_order_general' | 'sort_order_category', val: number) => {
    if (!checkPermission(['product_manager'], 'تعديل ترتيب المنتجات')) return;
    // 1. تحديث الحالة المحلية
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, [field]: val } : p));
    
    // 2. تحديث سوبابيس
    try {
      await supabase.from('products').update({ [field]: val }).eq('id', productId);
    } catch (err) {
      console.error(err);
    }
    
    // 3. تحديث الموك داتا
    const mockProds = getMockData.products();
    const updated = mockProds.map(p => p.id === productId ? { ...p, [field]: val } : p);
    saveMockData.products(updated);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    let localProds: Product[] = [];
    let localCats: Category[] = [];

    // Load from cache first for instant load
    if (typeof window !== 'undefined') {
      const p = localStorage.getItem('kh_products');
      if (p) {
        try { localProds = JSON.parse(p); } catch (e) {}
      } else {
        localProds = getMockData.products();
        localStorage.setItem('kh_products', JSON.stringify(localProds));
      }

      const c = localStorage.getItem('kh_categories');
      if (c) {
        try { localCats = JSON.parse(c); } catch (e) {}
      } else {
        localCats = getMockData.categories();
        localStorage.setItem('kh_categories', JSON.stringify(localCats));
      }
    }

    setProducts(localProds.length > 0 ? localProds : getMockData.products());
    setCategories(localCats.length > 0 ? localCats : getMockData.categories());
    setLoading(false);

    // Background fetch with 5 seconds timeout
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );

      const dbPromise = (async () => {
        const { data: pData, error: pErr } = await supabase.from('products').select('*');
        if (pErr) throw pErr;
        const { data: cData, error: cErr } = await supabase.from('categories').select('*');
        if (cErr) throw cErr;
        return { pData, cData };
      })();

      const { pData, cData } = await Promise.race([dbPromise, timeoutPromise]) as any;

      if (pData && pData.length > 0) {
        setProducts(pData);
        if (typeof window !== 'undefined') {
          localStorage.setItem('kh_products', JSON.stringify(pData));
        }
      }
      if (cData && cData.length > 0) {
        setCategories(cData);
        if (typeof window !== 'undefined') {
          localStorage.setItem('kh_categories', JSON.stringify(cData));
        }
      }
    } catch (err) {
      console.warn('Products background sync failed or timed out:', err);
    }
  };

  const handleExportProducts = () => {
    setIsExportModalOpen(false);

    let productsToExport = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || 
        p.category_id === selectedCategory || 
        (p.category_ids && p.category_ids.includes(selectedCategory));
      return matchesSearch && matchesCategory;
    });

    if (exportRange === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      productsToExport = productsToExport.filter(p => p.created_at.startsWith(todayStr));
    } else if (exportRange === 'week') {
      const minDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      productsToExport = productsToExport.filter(p => new Date(p.created_at) >= minDate);
    } else if (exportRange === 'month') {
      const minDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      productsToExport = productsToExport.filter(p => new Date(p.created_at) >= minDate);
    } else if (exportRange === 'year') {
      const currentYear = new Date().getFullYear();
      productsToExport = productsToExport.filter(p => new Date(p.created_at).getFullYear() === currentYear);
    } else if (exportRange === 'custom') {
      if (exportStartDate) {
        const start = new Date(exportStartDate);
        productsToExport = productsToExport.filter(p => new Date(p.created_at) >= start);
      }
      if (exportEndDate) {
        const end = new Date(exportEndDate);
        end.setHours(23, 59, 59, 999);
        productsToExport = productsToExport.filter(p => new Date(p.created_at) <= end);
      }
    }

    const headers = [
      'id',
      'name',
      'description',
      'price_unit',
      'price_box',
      'box_qty_label',
      'stock',
      'is_featured',
      'is_active',
      'images',
      'category_id',
      'seo_title',
      'seo_description',
      'seo_keywords',
      'badge',
      'created_at'
    ];

    if (exportFormat === 'csv') {
      const rows = productsToExport.map(p => {
        const imagesStr = Array.isArray(p.images) ? p.images.join(',') : p.images || '';
        
        return [
          p.id,
          `"${(p.name || '').replace(/"/g, '""')}"`,
          `"${(p.description || '').replace(/"/g, '""')}"`,
          p.price_unit,
          p.price_box,
          `"${(p.box_qty_label || '').replace(/"/g, '""')}"`,
          p.stock,
          p.is_featured,
          p.is_active,
          `"${imagesStr.replace(/"/g, '""')}"`,
          p.category_id,
          `"${(p.seo_title || '').replace(/"/g, '""')}"`,
          `"${(p.seo_description || '').replace(/"/g, '""')}"`,
          `"${(p.seo_keywords || '').replace(/"/g, '""')}"`,
          `"${(p.badge || '').replace(/"/g, '""')}"`,
          p.created_at
        ];
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `المنتجات-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const arabicHeaders = [
        'المعرف (ID)',
        'الاسم',
        'الوصف',
        'سعر القطعة',
        'سعر الكرتونة',
        'تعبئة الكرتونة',
        'المخزون',
        'مميز',
        'نشط',
        'رابط الصور',
        'معرف القسم',
        'عنوان السيو',
        'وصف السيو',
        'الكلمات الدلالية',
        'الشارة الترويجية',
        'تاريخ الإنشاء'
      ];

      let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
      html += `<head><meta charset="utf-8" /><style>table { border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }</style></head>`;
      html += `<body><table dir="rtl"><thead><tr style="background-color: #f2f2f2;">`;
      arabicHeaders.forEach(h => {
        html += `<th>${h}</th>`;
      });
      html += `</tr></thead><tbody>`;
      
      productsToExport.forEach(p => {
        const imagesStr = Array.isArray(p.images) ? p.images.join(', ') : p.images || '';
        html += `<tr>`;
        html += `<td>${p.id}</td>`;
        html += `<td>${p.name || ''}</td>`;
        html += `<td>${p.description || ''}</td>`;
        html += `<td>${p.price_unit}</td>`;
        html += `<td>${p.price_box}</td>`;
        html += `<td>${p.box_qty_label || ''}</td>`;
        html += `<td>${p.stock}</td>`;
        html += `<td>${p.is_featured ? 'نعم' : 'لا'}</td>`;
        html += `<td>${p.is_active ? 'نعم' : 'لا'}</td>`;
        html += `<td>${imagesStr}</td>`;
        html += `<td>${p.category_id}</td>`;
        html += `<td>${p.seo_title || ''}</td>`;
        html += `<td>${p.seo_description || ''}</td>`;
        html += `<td>${p.seo_keywords || ''}</td>`;
        html += `<td>${p.badge || ''}</td>`;
        html += `<td>${new Date(p.created_at).toLocaleString('ar-EG')}</td>`;
        html += `</tr>`;
      });
      
      html += `</tbody></table></body></html>`;

      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `المنتجات-${new Date().toISOString().split('T')[0]}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // فتح نموذج الإضافة
  const handleAddClick = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDesc('');
    setFormCategory('');
    setFormCategories([]);
    setFormPriceUnit(0);
    setFormPriceBox(0);
    setFormBoxQtyLabel('علبة 12 قطعة');
    setFormStock(50);
    setFormIsFeatured(false);
    setFormIsActive(true);
    setFormImages([]);
    setFormSortOrderGeneral(0);
    setFormSortOrderCategory(0);
    setFormBadge('');
    setFormSeoTitle('');
    setFormSeoDesc('');
    setFormSeoKeywords('');
    setFormColorsEnabled(false);
    setFormColors([]);
    setNewColorInput('');
    setFormSizesEnabled(false);
    setFormSizes([]);
    setNewSizeNameInput('');
    setNewSizePriceInput('');
    setIsFormOpen(true);
  };

  // فتح نموذج التعديل
  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name || '');
    
    // Parse color options from description if present
    const desc = product.description || '';
    const colorsMatch = desc.match(/\[COLORS\]:\s*(.+)$/m);
    let colorsList: string[] = [];
    let cleanDesc = desc;
    if (colorsMatch && colorsMatch[1]) {
      colorsList = colorsMatch[1].split(',').map(c => c.trim()).filter(Boolean);
      cleanDesc = desc.replace(/\[COLORS\]:\s*(.+)$/m, '').trim();
    }
    setFormDesc(cleanDesc);
    
    setFormCategory(product.category_id || '');
    setFormCategories(product.category_ids && product.category_ids.length > 0 ? product.category_ids : [product.category_id]);
    setFormPriceUnit(product.price_unit || 0);
    setFormPriceBox(product.price_box || 0);
    setFormBoxQtyLabel(product.box_qty_label || 'علبة 12 قطعة');
    setFormStock(product.stock || 0);
    setFormIsFeatured(!!product.is_featured);
    setFormIsActive(!!product.is_active);
    setFormImages(product.images || []);
    setFormSortOrderGeneral(product.sort_order_general || 0);
    setFormSortOrderCategory(product.sort_order_category || 0);
    setFormBadge(product.badge || '');
    setFormSeoTitle(product.seo_title || '');
    setFormSeoDesc(product.seo_description || '');
    setFormSeoKeywords(product.seo_keywords || '');
    setFormColorsEnabled(colorsList.length > 0 || (product.colors && product.colors.length > 0));
    setFormColors(colorsList.length > 0 ? colorsList : (product.colors || []));
    setNewColorInput('');
    
    const hasSizes = !!(product.sizes && product.sizes.length > 0);
    setFormSizesEnabled(hasSizes);
    setFormSizes(product.sizes || []);
    setNewSizeNameInput('');
    setNewSizePriceInput('');
    setIsFormOpen(true);
  };

  // معالجة رفع الصور - يعرض الصورة فوراً ثم يرفعها على سوبابيس
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);

    const files = Array.from(e.target.files);

    // الخطوة 1: اعرض الصور فوراً كـ Object URL (تظهر في الحال بدون انتظار)
    const objectUrls = files.map(f => URL.createObjectURL(f));
    setFormImages(prev => [...prev, ...objectUrls]);

    // الخطوة 2: حاول الرفع على سوبابيس في الخلفية وابدل الـ URL
    const finalUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      let file = files[i];
      let url = objectUrls[i]; // الافتراضي هو مسار العرض المؤقت
      
      try {
        // تحويل وضغط الصورة تلقائياً لصيغة WebP فائقة الخفة
        try {
          file = await compressImageToWebP(file);
        } catch (compressErr) {
          console.warn('WebP compression fallback:', compressErr);
        }

        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.webp`;
        const filePath = `${fileName}`;

        const { error } = await supabase.storage
          .from('products')
          .upload(filePath, file, { upsert: true });

        if (error) {
          throw error;
        }

        const { data: publicData } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        if (publicData?.publicUrl && publicData.publicUrl.startsWith('http')) {
          url = publicData.publicUrl;
        }
      } catch (err) {
        // لو فشل الرفع على سوبابيس، نحول الـ Object URL إلى base64 للحفظ الدائم
        try {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          url = base64;
        } catch {
          // ابقى على الـ object URL للعرض المؤقت
        }
      }
      finalUrls.push(url);
    }

    // استبدال مسارات المعاينة بالمسارات النهائية (مرفوعة أو base64) دفعة واحدة لتفادي تضارب تحديث الحالة
    setFormImages(prev => {
      const updated = [...prev];
      objectUrls.forEach((objUrl, idx) => {
        const index = updated.indexOf(objUrl);
        if (index !== -1) {
          updated[index] = finalUrls[idx];
        } else {
          updated.push(finalUrls[idx]);
        }
      });
      return updated;
    });

    setSuccessMsg('تم رفع الصور بنجاح!');
    setTimeout(() => setSuccessMsg(''), 3000);
    setUploading(false);
  };

  // حذف صورة مضافة من قائمة الصور
  const handleRemoveImage = (indexToRemove: number) => {
    setFormImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // حفظ المنتج (إضافة / تعديل)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPermission(['product_manager'], editingProduct ? 'تعديل هذا المنتج' : 'إضافة منتج جديد')) return;
    
    if (formCategories.length === 0) {
      alert('الرجاء اختيار قسم واحد على الأقل للمنتج!');
      return;
    }

    let finalDesc = formDesc.trim();
    if (formColorsEnabled && formColors.length > 0) {
      finalDesc += `\n\n[COLORS]: ${formColors.join(',')}`;
    }

    const productPayload = {
      name: formName,
      description: finalDesc,
      category_id: formCategories[0], // القسم الرئيسي الافتراضي الأول
      category_ids: formCategories,   // مصفوفة الأقسام المتعددة
      price_unit: Number(formPriceUnit),
      price_box: Number(formPriceBox),
      box_qty_label: formBoxQtyLabel,
      stock: 9999,
      is_featured: formIsFeatured,
      is_active: formIsActive,
      images: formImages,
      sort_order_general: Number(formSortOrderGeneral),
      sort_order_category: Number(formSortOrderCategory),
      seo_title: formSeoTitle,
      seo_description: formSeoDesc,
      seo_keywords: formSeoKeywords,
      badge: formBadge,
      colors: formColorsEnabled ? formColors : [],
      sizes: formSizesEnabled ? formSizes : [],
    };

    setSubmitting(true);
    try {
      if (editingProduct) {
        // تعديل منتج قائم
        try {
          const { error: dbError } = await supabase.from('products').update(productPayload).eq('id', editingProduct.id);
          if (dbError) throw dbError;
        } catch (dbErr) {
          console.warn('Database update failed, using localStorage fallback:', dbErr);
        }
        
        // مزامنة الموك داتا / الكاش المحلي
        const mockProds = getMockData.products();
        const updated = mockProds.map(p => p.id === editingProduct.id ? { ...p, ...productPayload } : p);
        saveMockData.products(updated);

        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...productPayload } : p));
        alert('تم تعديل المنتج بنجاح!');
      } else {
        // إضافة منتج جديد
        const newId = `prod-${Math.random().toString(36).substring(2, 9)}`;
        const newProduct: Product = {
          id: newId,
          ...productPayload,
          created_at: new Date().toISOString(),
        };

        try {
          const { error: dbError } = await supabase.from('products').insert([newProduct]);
          if (dbError) throw dbError;
        } catch (dbErr) {
          console.warn('Database insert failed, using localStorage fallback:', dbErr);
        }
        
        // مزامنة الموك داتا / الكاش المحلي
        const mockProds = getMockData.products();
        saveMockData.products([...mockProds, newProduct]);

        setProducts(prev => [...prev, newProduct]);
        alert('تم إضافة المنتج بنجاح!');
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ المنتج.');
    } finally {
      setSubmitting(false);
    }
  };

  // التعديل الجماعي للأسعار للمنتجات
  const handleApplyBulkPriceUpdate = async () => {
    if (!checkPermission(['product_manager'], 'التعديل الجماعي للأسعار')) return;
    
    if (bulkPercentage <= 0) {
      alert('الرجاء إدخال نسبة مئوية أكبر من الصفر!');
      return;
    }

    const factor = bulkAdjustmentType === 'increase' ? (1 + bulkPercentage / 100) : (1 - bulkPercentage / 100);
    
    // فلترة المنتجات المستهدفة
    const targetProducts = products.filter(p => 
      bulkTargetCategory === 'all' || 
      p.category_id === bulkTargetCategory || 
      (p.category_ids && p.category_ids.includes(bulkTargetCategory))
    );
    
    if (targetProducts.length === 0) {
      alert('لا توجد منتجات مطابقة للقسم المختار!');
      return;
    }
    
    const confirmMsg = `هل أنت متأكد من ${bulkAdjustmentType === 'increase' ? 'زيادة' : 'تخفيض'} أسعار ${targetProducts.length} منتج بنسبة ${bulkPercentage}%؟`;
    if (!window.confirm(confirmMsg)) return;
    
    setSubmitting(true);
    let successCount = 0;
    
    try {
      const updatedProductsList = [...products];
      
      for (const prod of targetProducts) {
        let newPriceUnit = prod.price_unit * factor;
        let newPriceBox = prod.price_box ? prod.price_box * factor : null;
        
        // التقريب
        if (bulkRounding === 'half') {
          newPriceUnit = Math.round(newPriceUnit * 2) / 2;
          if (newPriceBox !== null) newPriceBox = Math.round(newPriceBox * 2) / 2;
        } else if (bulkRounding === 'integer') {
          newPriceUnit = Math.round(newPriceUnit);
          if (newPriceBox !== null) newPriceBox = Math.round(newPriceBox);
        } else {
          newPriceUnit = Math.round(newPriceUnit * 100) / 100;
          if (newPriceBox !== null) newPriceBox = Math.round(newPriceBox * 100) / 100;
        }
        
        const updatePayload = {
          price_unit: newPriceUnit,
          price_box: newPriceBox
        };
        
        // تحديث قاعدة البيانات الفعلية (سوبابيس)
        try {
          const { error: dbError } = await supabase.from('products').update(updatePayload).eq('id', prod.id);
          if (dbError) throw dbError;
        } catch (dbErr) {
          console.warn(`Failed database update for product ${prod.id}:`, dbErr);
        }
        
        // تحديث القائمة المحلية
        const idx = updatedProductsList.findIndex(p => p.id === prod.id);
        if (idx !== -1) {
          updatedProductsList[idx] = {
            ...updatedProductsList[idx],
            ...updatePayload
          };
        }
        
        successCount++;
      }
      
      // حفظ التغييرات محلياً ومزامنتها مع الموك داتا
      saveMockData.products(updatedProductsList);
      setProducts(updatedProductsList);
      
      // إرسال التحديث لملف mock_db.json بالخلفية
      try {
        await fetch('/api/sync-mock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key: 'kh_products', data: updatedProductsList }),
        });
      } catch (syncErr) {
        console.error('Mock data sync failed:', syncErr);
      }
      
      alert(`تم تعديل أسعار ${successCount} منتج بنجاح!`);
      setIsBulkPriceModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تعديل الأسعار جماعياً.');
    } finally {
      setSubmitting(false);
    }
  };

  // التبديل السريع للمميز (Toggle Featured)
  const toggleFeatured = async (product: Product) => {
    if (!checkPermission(['product_manager'], 'تعديل خيارات المنتجات المميزة')) return;
    const newVal = !product.is_featured;
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_featured: newVal } : p));
    try {
      await supabase.from('products').update({ is_featured: newVal }).eq('id', product.id);
    } catch (err) {
      console.error(err);
    }
  };

  // التبديل السريع للنشط (Toggle Active)
  const toggleActive = async (product: Product) => {
    if (!checkPermission(['product_manager'], 'تعديل حالة المنتجات')) return;
    const newVal = !product.is_active;
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: newVal } : p));
    try {
      await supabase.from('products').update({ is_active: newVal }).eq('id', product.id);
    } catch (err) {
      console.error(err);
    }
  };

  // حذف منتج
  const handleDeleteProduct = async (productId: string) => {
    if (!checkPermission(['product_manager'], 'حذف المنتج نهائياً')) return;
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً؟')) return;

    try {
      await supabase.from('products').delete().eq('id', productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      alert('تم حذف المنتج بنجاح.');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حذف المنتج.');
    }
  };

  // التصفية والترتيب (الترتيب العام لجميع المنتجات، وترتيب القسم عند اختيار قسم معين)
  const filteredProducts = products
    .filter(product => {
      const matchSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'all' || 
                       product.category_id === selectedCategory ||
                       (product.category_ids && product.category_ids.includes(selectedCategory));
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'ar');
      }
      if (sortBy === 'price_asc') {
        return a.price_unit - b.price_unit;
      }
      if (sortBy === 'price_desc') {
        return b.price_unit - a.price_unit;
      }

      if (selectedCategory === 'all') {
        return (a.sort_order_general || 0) - (b.sort_order_general || 0);
      } else {
        return (a.sort_order_category || 0) - (b.sort_order_category || 0);
      }
    });

  if (isFormOpen) {
    return (
      <div className="space-y-6 text-right" dir="rtl">
        {/* هيدر الصفحة الجديدة للفورم */}
        <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-ink font-arabic">
              {editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد للدليل'}
            </h3>
            <p className="text-xs text-slate-400 font-arabic mt-1">تعبئة مواصفات الكتاب والـ SEO ومرفقات الصور</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="font-arabic text-xs hover:bg-slate-50 transition-all rounded-[12px] px-4 py-2 border border-slate-200" 
            onClick={() => setIsFormOpen(false)}
          >
            <span>العودة لقائمة المنتجات</span>
          </Button>
        </div>

        {/* جسم فورم التعديل */}
        <div className="bg-white p-6 rounded-[16px] shadow-premium border border-[#E7DCC2]">
          <form onSubmit={handleSaveProduct} className="space-y-5">
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="اسم المنتج"
                placeholder="مثال: سلاح التلميذ - العلوم - الصف الخامس"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />

              <div className="flex flex-col gap-1.5 text-right w-full">
                <label className="text-xs font-bold text-ink font-arabic">أقسام المنتج (اختر قسم واحد أو أكثر):</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 bg-slate-50 p-3 rounded-[12px] border border-slate-100">
                  {categories.map((cat) => {
                    const isChecked = formCategories.includes(cat.id);
                    return (
                      <label 
                        key={cat.id} 
                        className={`flex items-center gap-2 px-3 py-2 border rounded-[10px] cursor-pointer transition-all select-none text-xs font-bold font-arabic ${
                          isChecked 
                            ? 'bg-amber-light border-amber text-ink shadow-sm' 
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormCategories(prev => [...prev, cat.id]);
                            } else {
                              setFormCategories(prev => prev.filter(id => id !== cat.id));
                            }
                          }}
                          className="rounded border-slate-300 text-amber focus:ring-amber w-4 h-4 cursor-pointer"
                        />
                        <span>{cat.icon} {cat.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-right">
              <label className="text-sm font-semibold text-ink">وصف المنتج</label>
              <textarea
                rows={3}
                placeholder="اكتب تفاصيل وميزات الكتاب الخارجي أو الأداة المكتبية..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#E7DCC2] text-ink rounded-[12px] font-arabic placeholder:text-slate-400 focus:outline-none focus:border-amber focus:ring-4 focus:ring-amber/10 transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="السعر للقطعة الواحدة (ج.م)"
                type="number"
                value={formPriceUnit === 0 ? '' : formPriceUnit}
                onChange={(e) => setFormPriceUnit(Number(e.target.value))}
                required
              />
              <Input
                label="السعر للعلبة/الجملة (ج.م)"
                type="number"
                value={formPriceBox === 0 ? '' : formPriceBox}
                onChange={(e) => setFormPriceBox(Number(e.target.value))}
                required
              />
              <Input
                label="تسمية العلبة (مثال: علبة 12 قطعة)"
                placeholder="علبة 12 كشكول"
                value={formBoxQtyLabel}
                onChange={(e) => setFormBoxQtyLabel(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* خيارات الألوان */}
              <div className="flex flex-col justify-center gap-1">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-arabic">خيارات الألوان</span>
                <button
                  type="button"
                  onClick={() => setFormColorsEnabled(!formColorsEnabled)}
                  className="flex items-center gap-2 mt-1.5 py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-[12px] bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all justify-between text-slate-800 dark:text-slate-100 font-black shadow-2xs active:scale-98"
                >
                  <span className="text-sm font-arabic font-bold">تفعيل اختيار الألوان</span>
                  {formColorsEnabled ? <ToggleRight className="w-8 h-8 text-[#2E7FD9]" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
                </button>
              </div>

              {/* خيارات المقاسات والأحجام بأسعار مختلفة */}
              <div className="flex flex-col justify-center gap-1">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-arabic">المقاسات والأحجام</span>
                <button
                  type="button"
                  onClick={() => setFormSizesEnabled(!formSizesEnabled)}
                  className="flex items-center gap-2 mt-1.5 py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-[12px] bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all justify-between text-slate-800 dark:text-slate-100 font-black shadow-2xs active:scale-98"
                >
                  <span className="text-sm font-arabic font-bold">تفعيل المقاسات والأسعار</span>
                  {formSizesEnabled ? <ToggleRight className="w-8 h-8 text-[#2E7FD9]" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
                </button>
              </div>

              {/* مفتاح مميز */}
              <div className="flex flex-col justify-center gap-1">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-arabic">منتج مميز بالرئيسية</span>
                <button
                  type="button"
                  onClick={() => setFormIsFeatured(!formIsFeatured)}
                  className="flex items-center gap-2 mt-1.5 py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-[12px] bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all justify-between text-slate-800 dark:text-slate-100 font-black shadow-2xs active:scale-98"
                >
                  <span className="text-sm font-arabic font-bold">تفعيل في الرئيسي</span>
                  {formIsFeatured ? <ToggleRight className="w-8 h-8 text-amber-500" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
                </button>
              </div>

              {/* مفتاح نشط */}
              <div className="flex flex-col justify-center gap-1">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-arabic">حالة المنتج</span>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className="flex items-center gap-2 mt-1.5 py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-[12px] bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all justify-between text-slate-800 dark:text-slate-100 font-black shadow-2xs active:scale-98"
                >
                  <span className="text-sm font-arabic font-bold">متاح للطلب</span>
                  {formIsActive ? <ToggleRight className="w-8 h-8 text-emerald-500" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
                </button>
              </div>
            </div>

            {/* تفاصيل إدارة الألوان إذا كانت مفعلة */}
            {formColorsEnabled && (
              <div className="bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-[16px] p-4 space-y-3 text-right transition-colors">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block font-arabic">قائمة الألوان المتاحة للمنتج:</span>
                
                {formColors.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {formColors.map((color, index) => (
                      <span 
                        key={index}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm"
                      >
                        <span>{color}</span>
                        <button 
                          type="button" 
                          onClick={() => setFormColors(prev => prev.filter((_, idx) => idx !== index))}
                          className="text-red-500 hover:text-red-700 font-bold ml-1"
                          title="حذف هذا اللون"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 font-arabic">⚠️ لم يتم إضافة أي ألوان بعد. يرجى إضافة لون واحد على الأقل أدناه.</p>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="مثال: أحمر، أزرق، أسود..."
                    value={newColorInput}
                    onChange={(e) => setNewColorInput(e.target.value)}
                    className="flex-grow px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs rounded-[10px] focus:outline-none focus:border-[#2E7FD9] font-arabic text-slate-800 dark:text-slate-100"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newColorInput.trim() && !formColors.includes(newColorInput.trim())) {
                          setFormColors(prev => [...prev, newColorInput.trim()]);
                          setNewColorInput('');
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newColorInput.trim() && !formColors.includes(newColorInput.trim())) {
                        setFormColors(prev => [...prev, newColorInput.trim()]);
                        setNewColorInput('');
                      }
                    }}
                    className="bg-[#2E7FD9] hover:bg-[#1B4F8A] text-white font-bold text-xs px-4 py-1.5 rounded-[10px] transition-colors font-arabic"
                  >
                    إضافة
                  </button>
                </div>

                <div className="flex flex-wrap gap-1 items-center pt-1.5 border-t border-dashed border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 font-arabic ml-1">إضافة سريعة:</span>
                  {['أحمر', 'أزرق', 'أسود', 'أخضر', 'أصفر', 'رصاصي', 'برتقالي', 'بنفسجي', 'وردي', 'بني', 'أبيض'].map(c => (
                    <button
                      key={c}
                      type="button"
                      disabled={formColors.includes(c)}
                      onClick={() => setFormColors(prev => [...prev, c])}
                      className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-[#2E7FD9]/10 disabled:opacity-50 px-2 py-0.5 rounded transition-all font-arabic font-bold"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* تفاصيل إدارة المقاسات والأحجام بأسعار مختلفة إذا كانت مفعلة */}
            {formSizesEnabled && (
              <div className="bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-[16px] p-4 space-y-3 text-right transition-colors">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block font-arabic">قائمة المقاسات والأحجام مع السعر المخصص:</span>
                
                {formSizes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formSizes.map((size, index) => (
                      <span 
                        key={index}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-sm"
                      >
                        <span className="font-bold">{size.name}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-english font-black bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full text-[11px] border border-emerald-200 dark:border-emerald-800">{size.price} ج.م</span>
                        <button 
                          type="button" 
                          onClick={() => setFormSizes(prev => prev.filter((_, idx) => idx !== index))}
                          className="text-red-500 hover:text-red-700 font-bold mr-1"
                          title="حذف هذا المقاس"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 font-arabic">⚠️ لم تقم بإضافة أي مقاسات بعد. اضف المقاس واسمه وسعره الخاص أدناه.</p>
                )}

                <div className="space-y-3 pt-2 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  {/* اسم المقاس */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 font-arabic">
                      اسم المقاس / المنتج:
                    </label>
                    <input
                      type="text"
                      placeholder="أدخل الاسم (مثال: علبه صغيره / مقاس A4 / سلاح التلميذ)..."
                      value={newSizeNameInput}
                      onChange={(e) => setNewSizeNameInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs rounded-xl focus:outline-none focus:border-[#2E7FD9] font-arabic text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {/* خيارات تفعيل نوع السعر */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 font-arabic">
                      تحديد نوع السعر المطلوب تفعيله للمقاس (اختر واحد أو كلاهما):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSizeTypeIndividual(!sizeTypeIndividual)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-arabic border transition-all flex items-center gap-2 ${
                          sizeTypeIndividual
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] text-white font-bold ${sizeTypeIndividual ? 'bg-emerald-500' : 'border border-slate-300 dark:border-slate-600'}`}>
                          {sizeTypeIndividual && '✓'}
                        </span>
                        <span>🟢 سعر الفردي (قطعة)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSizeTypeBox(!sizeTypeBox)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-arabic border transition-all flex items-center gap-2 ${
                          sizeTypeBox
                            ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] text-white font-bold ${sizeTypeBox ? 'bg-blue-500' : 'border border-slate-300 dark:border-slate-600'}`}>
                          {sizeTypeBox && '✓'}
                        </span>
                        <span>📦 سعر العلبة (جملة)</span>
                      </button>
                    </div>
                  </div>

                  {/* حقول كتابة الأسعار طبقاً للتحديد */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {sizeTypeIndividual && (
                      <div className="space-y-1 animate-fade-in">
                        <label className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-arabic">
                          سعر القطعة الفردية (ج.م):
                        </label>
                        <input
                          type="number"
                          placeholder="أدخل السعر للفردي..."
                          value={newSizePriceInput === '' ? '' : newSizePriceInput}
                          onChange={(e) => setNewSizePriceInput(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-3 py-2 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 text-xs rounded-xl focus:outline-none focus:border-emerald-500 font-arabic text-slate-800 dark:text-slate-100 font-english"
                        />
                      </div>
                    )}

                    {sizeTypeBox && (
                      <div className="space-y-1 animate-fade-in">
                        <label className="block text-[11px] font-bold text-blue-600 dark:text-blue-400 font-arabic">
                          سعر العلبة الكاملة (ج.م):
                        </label>
                        <input
                          type="number"
                          placeholder="أدخل السعر للعلبة..."
                          value={newSizeBoxPriceInput === '' ? '' : newSizeBoxPriceInput}
                          onChange={(e) => setNewSizeBoxPriceInput(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-3 py-2 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-700 text-xs rounded-xl focus:outline-none focus:border-blue-500 font-arabic text-slate-800 dark:text-slate-100 font-english"
                        />
                      </div>
                    )}
                  </div>

                  {/* زر الإضافة */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!newSizeNameInput.trim()) {
                        alert('يرجى إدخال اسم المقاس أو المنتج أولاً!');
                        return;
                      }
                      if (!sizeTypeIndividual && !sizeTypeBox) {
                        alert('يرجى تفعيل خيار (سعر الفردي) أو (سعر العلبة) على الأقل!');
                        return;
                      }
                      if (sizeTypeIndividual && newSizePriceInput === '') {
                        alert('يرجى كتابة سعر الفردي!');
                        return;
                      }
                      if (sizeTypeBox && newSizeBoxPriceInput === '') {
                        alert('يرجى كتابة سعر العلبة!');
                        return;
                      }

                      const baseName = newSizeNameInput.trim();
                      const toAdd: { name: string; price: number }[] = [];

                      if (sizeTypeIndividual) {
                        toAdd.push({ name: `${baseName} (فردي)`, price: Number(newSizePriceInput) });
                      }
                      if (sizeTypeBox) {
                        toAdd.push({ name: `${baseName} (علبة)`, price: Number(newSizeBoxPriceInput) });
                      }

                      setFormSizes(prev => [...prev, ...toAdd]);
                      setNewSizeNameInput('');
                      setNewSizePriceInput('');
                      setNewSizeBoxPriceInput('');
                    }}
                    className="w-full bg-[#2E7FD9] hover:bg-[#1B4F8A] text-white font-bold text-xs py-2.5 rounded-xl transition-colors font-arabic flex items-center justify-center gap-1.5 shadow-sm mt-1"
                  >
                    <span>+ إضافة المقاس بالأسعار المحددة</span>
                  </button>
                </div>


                <div className="flex flex-wrap gap-1 items-center pt-1.5 border-t border-dashed border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 font-arabic ml-1">مقاسات سريعة:</span>
                  {[
                    { name: 'سعر فردي (قطعة)', price: formPriceUnit || 10 },
                    { name: 'سعر العلبة (جملة)', price: formPriceBox || 100 },
                    { name: 'قطعة واحدة', price: 10 },
                    { name: 'علبة كاملة', price: 100 },
                    { name: 'علبة 12 قلم', price: 75 },
                    { name: 'علبة 24 قطعة', price: 150 },
                    { name: 'كرتونة', price: 300 },
                    { name: 'مقاس A4', price: 45 },
                    { name: 'مقاس A5', price: 25 },
                    { name: '60 ورقة', price: 30 },
                    { name: '80 ورقة', price: 40 },
                    { name: '100 ورقة', price: 50 },
                    { name: 'مقاس صغير', price: 20 },
                    { name: 'مقاس وسط', price: 35 },
                    { name: 'مقاس كبير', price: 50 },
                  ].map(s => (
                    <button
                      key={s.name}
                      type="button"
                      disabled={formSizes.some(item => item.name === s.name)}
                      onClick={() => setFormSizes(prev => [...prev, s])}
                      className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-[#2E7FD9]/10 disabled:opacity-50 px-2 py-0.5 rounded transition-all font-arabic font-bold"
                    >
                      {s.name} ({s.price} ج.م)
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-50 pt-4">
              <Input
                label="الترتيب العام (ترقيم الترتيب العام للمنتج، الأصغر أولاً)"
                type="number"
                value={formSortOrderGeneral === 0 ? '' : formSortOrderGeneral}
                onChange={(e) => setFormSortOrderGeneral(Number(e.target.value))}
              />
              <Input
                label="الترتيب بالقسم (أولوية العرض داخل القسم المختار، الأصغر أولاً)"
                type="number"
                value={formSortOrderCategory === 0 ? '' : formSortOrderCategory}
                onChange={(e) => setFormSortOrderCategory(Number(e.target.value))}
              />
            </div>

            {/* شارة المنتج الترويجية */}
            <div className="grid grid-cols-1 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-100 block font-arabic">شارة المنتج الترويجية (Badge)</label>
                <select
                  value={formBadge}
                  onChange={(e) => setFormBadge(e.target.value)}
                  className="w-full rounded-[12px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs text-right text-slate-800 dark:text-slate-100 font-bold focus:border-[#2E7FD9] focus:outline-none font-arabic"
                >
                  <option value="">-- بدون شارة --</option>
                  <option value="bestseller">🔥 الأكثر طلباً</option>
                  <option value="last_piece">⚠️ آخر قطعة متبقية!</option>
                  <option value="limited_offer">⏱️ عرض لفترة محدودة</option>
                  <option value="last_5_pieces">⚡ المتبقي 5 قطع فقط!</option>
                  <option value="new">✨ جديدنا</option>
                  <option value="discount">🏷️ خصم خاص</option>
                </select>
              </div>
            </div>

            {/* 🌐 تهيئة وإعدادات سيو جوجل (Google SEO Settings) */}
            <div className="border border-[#E7DCC2] rounded-[16px] bg-[#F6F1E4]/40 p-4 space-y-4">
              <div className="border-r-4 border-amber pr-2">
                <span className="text-sm font-bold text-ink font-arabic block">إعدادات محركات البحث وتهيئة السيو لجوجل (Google SEO)</span>
                <p className="text-[10px] text-slate-400 font-arabic mt-0.5">⚠️ هذه الخانات مخصصة لمحركات بحث جوجل والـ Meta tags فقط ولن تظهر للزبون العادي في كارت المنتج</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="عنوان سيو لجوجل (SEO Title Tag)"
                  placeholder="مثال: كتاب سلاح التلميذ لغة عربية الصف السادس - مكتبة الخضري"
                  value={formSeoTitle}
                  onChange={(e) => setFormSeoTitle(e.target.value)}
                />
                <Input
                  label="الكلمات الدلالية لمحرك البحث (Meta Keywords)"
                  placeholder="سلاح التلميذ, لغة عربية, سادسة ابتدائي, مكتبة الخضري"
                  value={formSeoKeywords}
                  onChange={(e) => setFormSeoKeywords(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col gap-1 text-right">
                <label className="text-xs font-bold text-ink font-arabic">وصف سيو لجوجل (SEO Meta Description)</label>
                <textarea
                  rows={2}
                  placeholder="أدخل وصفاً تسويقياً موجزاً يظهر تحت اسم موقعك في نتائج بحث جوجل (يفضل بين 120-160 حرف)"
                  value={formSeoDesc}
                  onChange={(e) => setFormSeoDesc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E7DCC2] text-xs rounded-[12px] font-arabic placeholder:text-slate-400 focus:outline-none focus:border-amber"
                />
              </div>
            </div>

            {/* محمل الصور المتعددة */}
            <div className="space-y-2 text-right">
              <label className="text-sm font-semibold text-ink block">صور المنتج</label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/50 p-3.5 rounded-[16px] border border-slate-100/70">
                {formImages.map((imgUrl, index) => (
                  <div 
                    key={index} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className="relative aspect-square border-2 border-slate-200 hover:border-amber rounded-[16px] overflow-hidden group cursor-grab active:cursor-grabbing bg-white transition-all shadow-sm select-none"
                    title="اسحب الصورة لإعادة ترتيبها أو اضغط على النجمة لجعلها رئيسية"
                  >
                    <img 
                      src={imgUrl} 
                      alt="Product file" 
                      className="w-full h-full object-cover pointer-events-none" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=60';
                      }}
                    />
                    
                    {/* زر حذف الصورة */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-sm transition-colors opacity-90 z-20"
                      title="حذف الصورة"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    {/* زر تعيين كصورة رئيسية (Index 0) */}
                    <button
                      type="button"
                      onClick={() => handleSetPrimaryImage(index)}
                      className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-[6px] text-[9px] font-arabic font-bold transition-all shadow-sm z-20 ${
                        index === 0 
                          ? 'bg-amber text-white border border-amber-deep' 
                          : 'bg-white/90 hover:bg-amber text-amber-deep hover:text-white opacity-0 group-hover:opacity-100'
                      }`}
                      title={index === 0 ? 'هذه هي الصورة الرئيسية حالياً' : 'تعيين كصورة رئيسية للمنتج'}
                    >
                      {index === 0 ? '★ الرئيسية' : '★ تعيين رئيسية'}
                    </button>

                    {/* أزرار التحريك اليدوي السريع للترتيب */}
                    <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button
                        type="button"
                        onClick={() => handleMoveImage(index, 'right')}
                        disabled={index === 0}
                        className="p-1 bg-white/90 hover:bg-amber text-slate-700 hover:text-white rounded-[6px] shadow-sm disabled:opacity-30 border border-slate-100 transition-colors"
                        title="تحريك لليمين (ترقية)"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveImage(index, 'left')}
                        disabled={index === formImages.length - 1}
                        className="p-1 bg-white/90 hover:bg-amber text-slate-700 hover:text-white rounded-[6px] shadow-sm disabled:opacity-30 border border-slate-100 transition-colors"
                        title="تحريك لليصار (تخفيض)"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                    </div>

                    {/* مؤشر ترتيب الصورة */}
                    <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[8px] font-english px-1.5 py-0.5 rounded-[4px] font-bold z-10">
                      #{index + 1}
                    </div>
                  </div>
                ))}

                <label className="border-2 border-dashed border-amber/20 hover:border-amber/40 aspect-square rounded-[12px] flex flex-col items-center justify-center gap-1 cursor-pointer bg-[#F6F1E4]/20 hover:bg-[#F6F1E4]/50 transition-all">
                  {uploading ? (
                    <svg className="animate-spin h-6 w-6 text-amber" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-amber" />
                      <span className="text-[10px] font-bold text-slate-500 font-arabic">رفع صور جديدة</span>
                    </>
                  )}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
              
              {successMsg && (
                <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{successMsg}</span>
                </p>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFormOpen(false)}
                className="font-arabic"
              >
                إلغاء والعودة لقائمة المنتجات
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="font-arabic"
                disabled={uploading || submitting}
              >
                {uploading ? 'جاري رفع الصور...' : (submitting ? 'جاري الحفظ...' : (editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'))}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* هيدر التحكم والبحث */}
      <div className="bg-white p-5 rounded-[16px] shadow-premium border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* حقول البحث والفلترة */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[280px] flex-1 md:flex-none">
            <Input
              placeholder="ابحث باسم المنتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3.5 bottom-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>

          <div className="w-56">
            <Select
              options={[
                { value: 'all', label: 'كل الأقسام' },
                ...categories.map(c => ({ value: c.id, label: c.name }))
              ]}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            />
          </div>

          <div className="w-56">
            <Select
              options={[
                { value: 'newest', label: 'الترتيب: الأحدث أولاً' },
                { value: 'oldest', label: 'الترتيب: الأقدم أولاً' },
                { value: 'name', label: 'الترتيب: الاسم (أ-ي)' },
                { value: 'price_asc', label: 'السعر: من الأقل للأعلى' },
                { value: 'price_desc', label: 'السعر: من الأعلى للأقل' },
                { value: 'default', label: 'الترتيب المخصص للمدير' }
              ]}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            />
          </div>
        </div>

        {/* زر الإضافة والتصدير */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[12px] text-xs font-bold transition-all duration-200 font-arabic shadow-sm hover:shadow h-[40px]"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            <span>تصدير البيانات</span>
          </button>

          <button
            onClick={() => setIsBulkPriceModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-[12px] text-xs font-bold transition-all duration-200 font-arabic border border-amber-200/60 shadow-sm h-[40px]"
          >
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>تعديل جماعي للأسعار</span>
          </button>
          
          <Button 
            variant="primary" 
            onClick={handleAddClick}
            className="shadow-md shadow-amber/20 font-arabic flex items-center justify-center gap-2 h-[40px]"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة منتج جديد</span>
          </Button>
        </div>

      </div>

      {/* جدول المنتجات */}
      <div className="bg-[#F7F8FA] rounded-[16px] border border-slate-300 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-800">
            <svg className="animate-spin h-8 w-8 text-[#2E7FD9]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-bold font-arabic text-sm">جاري جلب المنتجات...</span>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="bg-slate-200/60 border-b border-slate-300 text-slate-900 font-arabic">
                  <th className="py-4 px-6 font-bold">الصورة</th>
                  <th className="py-4 px-6 font-bold">اسم المنتج</th>
                  <th className="py-4 px-6 font-bold">القسم</th>
                  <th className="py-4 px-6 font-bold text-center">الترتيب العام</th>
                  <th className="py-4 px-6 font-bold text-center">ترتيب القسم</th>
                  <th className="py-4 px-6 font-bold">السعر الفردي</th>
                  <th className="py-4 px-6 font-bold">سعر العلبة</th>
                  <th className="py-4 px-6 font-bold">المخزون</th>
                  <th className="py-4 px-6 font-bold text-center">مميز (Featured)</th>
                  <th className="py-4 px-6 font-bold text-center">نشط (Active)</th>
                  <th className="py-4 px-6 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-slate-300">
                {filteredProducts.map((product) => {
                  const catName = categories.find(c => c.id === product.category_id)?.name || 'غير مصنف';
                  const primaryImage = product.images?.[0] || '';

                  return (
                    <tr key={product.id} className="hover:bg-slate-100/70 transition-colors group">
                      <td className="py-3.5 px-6">
                        {primaryImage ? (
                          <img 
                            src={primaryImage} 
                            alt={product.name} 
                            className="w-12 h-12 object-cover rounded-[8px] border border-slate-100" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=60';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-[8px] flex items-center justify-center border border-slate-100">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-6 max-w-xs truncate" title={product.name}>
                        <div className="font-bold text-slate-800 font-arabic leading-snug flex flex-wrap items-center gap-1.5">
                          <span>{product.name}</span>
                          {product.badge && (
                            <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-amber-light/20 border border-amber/20 text-amber-deep">
                              {product.badge === 'bestseller' ? '🔥 الأكثر طلباً' :
                               product.badge === 'last_piece' ? '⚠️ آخر قطعة' :
                               product.badge === 'limited_offer' ? '⏱️ عرض محدود' :
                               product.badge === 'last_5_pieces' ? '⚡ آخر 5 قطع' :
                               product.badge === 'new' ? '✨ جديد' :
                               product.badge === 'discount' ? '🏷️ خصم' : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-600 font-arabic">
                        <p className="font-semibold">{catName}</p>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <input 
                          type="number" 
                          value={product.sort_order_general || 0}
                          onChange={(e) => handleInlineSortChange(product.id, 'sort_order_general', Number(e.target.value))}
                          className="w-16 px-2 py-1 text-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-[8px] text-xs font-english font-bold focus:bg-white focus:border-amber focus:outline-none transition-all"
                        />
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <input 
                          type="number" 
                          value={product.sort_order_category || 0}
                          onChange={(e) => handleInlineSortChange(product.id, 'sort_order_category', Number(e.target.value))}
                          className="w-16 px-2 py-1 text-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-[8px] text-xs font-english font-bold focus:bg-white focus:border-amber focus:outline-none transition-all"
                        />
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-800 font-english">
                        {product.price_unit} ج.م
                      </td>
                      <td className="py-3.5 px-6 text-slate-500 font-arabic">
                        <span className="font-english font-semibold">{product.price_box} ج.م</span>
                        <span className="text-[10px] block text-slate-400">{product.box_qty_label}</span>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`px-2 py-0.5 rounded-[6px] text-xs font-bold font-english ${
                          product.stock > 20 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-rose-50 text-rose-600'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <button 
                          onClick={() => toggleFeatured(product)}
                          className={`p-1 rounded-full transition-colors ${
                            product.is_featured 
                              ? 'text-amber hover:text-amber-deep' 
                              : 'text-slate-300 hover:text-slate-400'
                          }`}
                          title={product.is_featured ? 'إلغاء التمييز' : 'تمييز المنتج بالرئيسية'}
                        >
                          {product.is_featured ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
                        </button>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <button
                          onClick={() => toggleActive(product)}
                          className={`p-1.5 transition-colors ${
                            product.is_active ? 'text-emerald-500' : 'text-slate-300'
                          }`}
                        >
                          {product.is_active ? (
                            <ToggleRight className="w-7 h-7 text-sage" />
                          ) : (
                            <ToggleLeft className="w-7 h-7" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEditClick(product)}
                            className="p-1.5 text-slate-500 bg-slate-50 rounded-[8px] hover:bg-amber/10 hover:text-amber transition-colors"
                            title="تعديل المنتج"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1.5 text-slate-500 bg-slate-50 rounded-[8px] hover:bg-rose-50 hover:text-rose-500 transition-colors"
                            title="حذف المنتج"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-slate-400 font-arabic text-sm space-y-2">
            <p>لا توجد منتجات مسجلة في هذا القسم حالياً.</p>
          </div>
        )}
      </div>

      {/* 📥 نافذة تصدير البيانات (Export Configuration Modal) */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in font-arabic">
          <div className="bg-white rounded-[24px] border border-[#E7DCC2] shadow-premium max-w-md w-full overflow-hidden text-right">
            
            {/* Header */}
            <div className="bg-[#FBEBCB]/30 px-6 py-4 border-b border-[#E7DCC2] flex items-center justify-between">
              <span className="font-black text-sm text-ink font-arabic">تصدير بيانات المنتجات المتقدم</span>
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              
              {/* Format selection */}
              <div className="space-y-2">
                <span className="block text-xs font-bold text-slate-500">1. صيغة الملف المصدر</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportFormat('excel')}
                    className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                      exportFormat === 'excel'
                        ? 'border-amber bg-amber/5 text-amber-deep font-bold shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl">📊</span>
                    <span className="text-xs font-bold font-arabic">ملف Excel (للقراءة والطباعة)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat('csv')}
                    className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                      exportFormat === 'csv'
                        ? 'border-amber bg-amber/5 text-amber-deep font-bold shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl">⚙️</span>
                    <span className="text-xs font-bold font-arabic">ملف CSV (سوبابيس)</span>
                  </button>
                </div>
              </div>

              {/* Date range selection */}
              <div className="space-y-2">
                <span className="block text-xs font-bold text-slate-500">2. المدة الزمنية للبيانات</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'all', label: 'كامل البيانات' },
                    { id: 'today', label: 'اليوم' },
                    { id: 'week', label: 'هذا الأسبوع' },
                    { id: 'month', label: 'هذا الشهر' },
                    { id: 'year', label: 'هذه السنة' },
                    { id: 'custom', label: 'تحديد مخصص' },
                  ].map((range) => (
                    <button
                      key={range.id}
                      type="button"
                      onClick={() => setExportRange(range.id as any)}
                      className={`py-2 px-3 rounded-lg border text-center text-[10px] font-bold font-arabic transition-all ${
                        exportRange === range.id
                          ? 'border-amber bg-amber/5 text-amber-deep shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Pickers (only shown if range === 'custom') */}
              {exportRange === 'custom' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 animate-slide-down">
                  <CustomDatePicker
                    value={exportStartDate}
                    onChange={setExportStartDate}
                    label="من تاريخ"
                    placeholder="اختر البداية"
                  />
                  <CustomDatePicker
                    value={exportEndDate}
                    onChange={setExportEndDate}
                    label="إلى تاريخ"
                    placeholder="اختر النهاية"
                  />
                </div>
              )}

            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all font-arabic"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleExportProducts}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all font-arabic shadow-sm flex items-center gap-1.5"
              >
                <span>تنزيل الملف</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ⚙️ نافذة التعديل الجماعي للأسعار (Bulk Price Update Modal) */}
      {isBulkPriceModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-arabic">
          <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-300 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden text-right transition-colors">
            
            {/* Header */}
            <div className="bg-slate-100 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-300 dark:border-slate-700 flex items-center justify-between">
              <span className="font-black text-sm text-black dark:text-slate-100 font-arabic flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#2E7FD9]" />
                <span>تعديل جماعي لأسعار المنتجات</span>
              </span>
              <button 
                onClick={() => setIsBulkPriceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              
              {/* Category selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-black dark:text-slate-100">1. القسم المستهدف بالتعديل</label>
                <select
                  value={bulkTargetCategory}
                  onChange={(e) => setBulkTargetCategory(e.target.value)}
                  className="w-full rounded-[12px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs text-right text-black dark:text-slate-100 font-black focus:border-[#2E7FD9] focus:outline-none font-arabic cursor-pointer"
                >
                  <option value="all" className="bg-white dark:bg-slate-900 text-black dark:text-slate-100 font-black">كل الأقسام والمستلزمات</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-black dark:text-slate-100 font-black">{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Adjustment Type selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-black dark:text-slate-100">2. نوع التعديل على السعر</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBulkAdjustmentType('increase')}
                    className={`py-2.5 px-4 rounded-xl border text-center text-xs font-black font-arabic transition-all ${
                      bulkAdjustmentType === 'increase'
                        ? 'border-[#2E7FD9] bg-[#2E7FD9]/10 text-[#2E7FD9] dark:text-[#5B9FE6] font-black shadow-xs'
                        : 'border-slate-300 dark:border-slate-700 text-black dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    📈 زيادة الأسعار
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkAdjustmentType('decrease')}
                    className={`py-2.5 px-4 rounded-xl border text-center text-xs font-black font-arabic transition-all ${
                      bulkAdjustmentType === 'decrease'
                        ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black shadow-xs'
                        : 'border-slate-300 dark:border-slate-700 text-black dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    📉 تخفيض الأسعار (خصم)
                  </button>
                </div>
              </div>

              {/* Percentage input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-black dark:text-slate-100">3. نسبة التعديل (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={bulkPercentage}
                    onChange={(e) => setBulkPercentage(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-[12px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs text-center text-black dark:text-slate-100 focus:border-[#2E7FD9] focus:outline-none font-numbers font-black"
                  />
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xs font-black text-black dark:text-slate-300">%</span>
                </div>
              </div>

              {/* Rounding option */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-black dark:text-slate-100">4. استراتيجية تقريب الأسعار</label>
                <select
                  value={bulkRounding}
                  onChange={(e) => setBulkRounding(e.target.value)}
                  className="w-full rounded-[12px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs text-right text-black dark:text-slate-100 font-black focus:border-[#2E7FD9] focus:outline-none font-arabic cursor-pointer"
                >
                  <option value="none" className="bg-white dark:bg-slate-900 text-black dark:text-slate-100 font-black">لا تقريب (حساب النسبة الدقيقة)</option>
                  <option value="half">تقريب لأقرب 50 قرش (أمثلة: 14.50 ، 15.00)</option>
                  <option value="integer">تقريب لأقرب جنيه كامل (أمثلة: 14.00 ، 15.00)</option>
                </select>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsBulkPriceModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all font-arabic"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleApplyBulkPriceUpdate}
                disabled={submitting}
                className="px-5 py-2 bg-[#2E7FD9] hover:bg-[#1B4F8A] text-white rounded-xl text-xs font-bold transition-all font-arabic shadow-sm flex items-center gap-1.5"
              >
                {submitting ? (
                  <span>جاري التعديل...</span>
                ) : (
                  <>
                    <span>تطبيق التعديل الآن</span>
                    <Sparkles className="w-4 h-4" />
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
