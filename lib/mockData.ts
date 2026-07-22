// lib/mockData.ts
// البيانات التجريبية الغنية ومحرر التخزين المحلي (LocalStorage) لتجربة بريميوم تفاعلية بالكامل

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  is_active: boolean;
  product_count?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category_id: string;
  category_ids?: string[];
  price_unit: number;
  price_box: number;
  box_qty_label: string;
  images: string[];
  stock: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  sort_order_general?: number;
  sort_order_category?: number;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  badge?: string;
}

export interface Box {
  id: string;
  name: string;
  stage: 'kg' | 'primary' | 'middle' | 'high';
  base_price: number;
  description: string;
  image_url: string;
  products: { product_id: string; quantity: number }[];
  is_active: boolean;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  type: 'product' | 'box';
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  governorate: string;
  items: OrderItem[];
  total_amount: number;
  status: 'new' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
  created_at: string;
}

export interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order?: number;
  usage_limit?: number;
  usage_count: number;
  is_active: boolean;
}

export interface ShippingRate {
  governorate: string;
  shipping_fee: number;
  delivery_time: string;
  is_active: boolean;
}

export interface PageBlock {
  id: string;
  type: 'text' | 'image' | 'mixed' | 'hero' | 'stats' | 'packages_section' | 'box_builder_section' | 'contact_section' | 'products_row' | 'about_header' | 'about_story' | 'about_values' | 'box_builder_stages';
  content: {
    text?: string;
    imageUrl?: string;
    caption?: string;
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaLink?: string;
    align?: 'right' | 'left';
    // Dynamic products row settings
    categoryId?: string;
    limit?: number;
    layout?: 'grid' | 'scroll';
    // Dynamic stats and contact settings
    [key: string]: any;
  };
  order: number;
}

export interface PageData {
  slug: string;
  title: string;
  blocks: PageBlock[];
  updated_at: string;
}

export interface TrackingPixel {
  platform: string;
  pixel_id: string;
  active: boolean;
  conversion_api_token?: string;
  events: string[];
}

export interface ApiKey {
  id: string;
  label: string;
  key_hash: string;
  created_at: string;
  last_used?: string;
}

// -------------------------------------------------------------
// البيانات الافتراضية
// -------------------------------------------------------------

export const defaultCategories: Category[] = [
  { id: 'cat-1', name: 'الكتب الدراسية', slug: 'textbooks', icon: '📚', is_active: true },
  { id: 'cat-2', name: 'الأدوات المكتبية', slug: 'stationery', icon: '✏️', is_active: true },
  { id: 'cat-3', name: 'الروايات والكتب العامة', slug: 'novels', icon: '📖', is_active: true },
  { id: 'cat-4', name: 'قصص الأطفال ورسم', slug: 'kids', icon: '🎨', is_active: true },
  { id: 'cat-5', name: 'الوسائل التعليمية', slug: 'educational-toys', icon: '🧩', is_active: true },
];

export const defaultProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'سلاح التلميذ - اللغة العربية - الصف السادس الابتدائي',
    description: 'كتاب الشرح الخارجي لمادة اللغة العربية للفصلين الدراسيين الأول والثاني، يتضمن نماذج امتحانات وتدريبات مكثفة.',
    category_id: 'cat-1',
    price_unit: 145,
    price_box: 1620,
    box_qty_label: 'كرتونة 12 كتاب',
    images: ['https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=60'],
    stock: 120,
    is_featured: true,
    is_active: true,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    badge: 'bestseller',
  },
  {
    id: 'prod-2',
    name: 'الأضواء - الرياضيات - الصف الأول الإعدادي',
    description: 'كتاب شرح المنهج الجديد المطور في الرياضيات لطلاب الصف الأول الإعدادي بالتفصيل والأمثلة المحلولة.',
    category_id: 'cat-1',
    price_unit: 160,
    price_box: 1800,
    box_qty_label: 'كرتونة 12 كتاب',
    images: ['https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=60'],
    stock: 95,
    is_featured: true,
    is_active: true,
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    badge: 'limited_offer',
  },
  {
    id: 'prod-3',
    name: 'علبة ألوان خشبية فابر كاستل 24 لون',
    description: 'ألوان خشبية ذات جودة عالية لا تنكسر بسهولة، مثالية للرسم والنشاطات المدرسية المتقدمة.',
    category_id: 'cat-2',
    price_unit: 85,
    price_box: 960,
    box_qty_label: 'علبة 12 عبوة ألوان',
    images: ['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=60'],
    stock: 350,
    is_featured: false,
    is_active: true,
    created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'prod-4',
    name: 'دفتر تحضير دروس فاخر 100 ورقة مقوى',
    description: 'دفتر تحضير للمعلمين مع غلاف جلد سميك وتخطيط داخلي مريح للجدول والحصص الدراسية.',
    category_id: 'cat-2',
    price_unit: 50,
    price_box: 540,
    box_qty_label: 'علبة 12 دفتر',
    images: ['https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&auto=format&fit=crop&q=60'],
    stock: 80,
    is_featured: false,
    is_active: true,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'prod-5',
    name: 'قصص الأنبياء للأطفال - مجلد ملون كامل',
    description: 'سلسلة قصص الأنبياء بأسلوب سهل يناسب الأطفال مع رسومات كرتونية ملونة جذابة لترسيخ القيم.',
    category_id: 'cat-4',
    price_unit: 195,
    price_box: 1080,
    box_qty_label: 'طقم 6 مجلدات',
    images: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&auto=format&fit=crop&q=60'],
    stock: 45,
    is_featured: true,
    is_active: true,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    badge: 'last_5_pieces',
  },
  {
    id: 'prod-6',
    name: 'كشكول سلك مقسم A4 - 5 فواصل 200 ورقة',
    description: 'كشكول جامعي مقسم فواصل ملونة لتنظيم المواد الدراسية المختلفة، ورق عالي الجودة متوافق مع الحبر السائل.',
    category_id: 'cat-2',
    price_unit: 95,
    price_box: 1080,
    box_qty_label: 'كرتونة 12 كشكول',
    images: ['https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=60'],
    stock: 180,
    is_featured: false,
    is_active: true,
    created_at: new Date().toISOString(),
  }
];

export const defaultBoxes: Box[] = [
  {
    id: 'box-1',
    name: 'بوكس انطلاق الروضة (KG)',
    stage: 'kg',
    base_price: 380,
    description: 'يحتوي على كتب التهيئة والحساب، ألوان شمعية، كراسات تلوين، صلصال طبيعي، ومقلمة هدايا متكاملة لبدء رحلة التعلم.',
    image_url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&auto=format&fit=crop&q=60',
    products: [
      { product_id: 'prod-3', quantity: 1 },
      { product_id: 'prod-5', quantity: 1 }
    ],
    is_active: true
  },
  {
    id: 'box-2',
    name: 'حقيبة متفوقي الابتدائي المدرسية',
    stage: 'primary',
    base_price: 520,
    description: 'تتضمن كتب سلاح التلميذ الأساسية في اللغات والرياضيات، مع تشكيلة من الأقلام والكشاكيل ودفاتر الرسم الفاخرة.',
    image_url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=60',
    products: [
      { product_id: 'prod-1', quantity: 1 },
      { product_id: 'prod-3', quantity: 1 },
      { product_id: 'prod-4', quantity: 2 }
    ],
    is_active: true
  },
  {
    id: 'box-3',
    name: 'حقيبة الطالب الإعدادي المتكاملة',
    stage: 'middle',
    base_price: 680,
    description: 'مجموعة المنهج الأساسية لصفوف المرحلة الإعدادية بالإضافة إلى الآلة الحاسبة وأدوات الهندسة والكشاكيل الجامعية الفاخرة.',
    image_url: 'https://images.unsplash.com/photo-1527891751199-7225231a68dd?w=600&auto=format&fit=crop&q=60',
    products: [
      { product_id: 'prod-2', quantity: 1 },
      { product_id: 'prod-6', quantity: 2 }
    ],
    is_active: true
  }
];

// إنشاء تواريخ للأيام السبعة الماضية لتسجيل الطلبات التجريبية
const getPastDateStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0] + 'T' + d.toTimeString().split(' ')[0];
};

export const defaultOrders: Order[] = [
  {
    id: 'ORD-1001',
    customer_name: 'أحمد محمود العشري',
    customer_phone: '01012345678',
    governorate: 'القاهرة',
    items: [
      { id: 'prod-1', name: 'سلاح التلميذ - اللغة العربية - الصف السادس الابتدائي', quantity: 2, price: 145, type: 'product' },
      { id: 'prod-3', name: 'علبة ألوان خشبية فابر كاستل 24 لون', quantity: 1, price: 85, type: 'product' }
    ],
    total_amount: 375, // 375 + 35 shipping = 410 total
    status: 'delivered',
    created_at: getPastDateStr(6)
  },
  {
    id: 'ORD-1002',
    customer_name: 'سارة عبد الرحمن',
    customer_phone: '01298765432',
    governorate: 'الجيزة',
    items: [
      { id: 'box-2', name: 'حقيبة متفوقي الابتدائي المدرسية', quantity: 1, price: 520, type: 'box' }
    ],
    total_amount: 520, // Free shipping (>= 500)
    status: 'delivered',
    created_at: getPastDateStr(5)
  },
  {
    id: 'ORD-1003',
    customer_name: 'محمد علي النجار',
    customer_phone: '01124681357',
    governorate: 'الإسكندرية',
    items: [
      { id: 'prod-2', name: 'الأضواء - الرياضيات - الصف الأول الإعدادي', quantity: 1, price: 160, type: 'product' },
      { id: 'prod-4', name: 'دفتر تحضير دروس فاخر 100 ورقة مقوى', quantity: 3, price: 50, type: 'product' }
    ],
    total_amount: 350, // 310 + 40 shipping = 350
    status: 'confirmed',
    created_at: getPastDateStr(4)
  },
  {
    id: 'ORD-1004',
    customer_name: 'منة الله كريم',
    customer_phone: '01511223344',
    governorate: 'الشرقية',
    items: [
      { id: 'box-1', name: 'بوكس انطلاق الروضة (KG)', quantity: 2, price: 380, type: 'box' }
    ],
    total_amount: 760,
    status: 'new',
    created_at: getPastDateStr(2)
  },
  {
    id: 'ORD-1005',
    customer_name: 'كريم أشرف السقا',
    customer_phone: '01065432109',
    governorate: 'المنوفية',
    items: [
      { id: 'prod-5', name: 'قصص الأنبياء للأطفال - مجلد ملون كامل', quantity: 1, price: 195, type: 'product' }
    ],
    total_amount: 240, // 195 + 45 shipping
    status: 'cancelled',
    created_at: getPastDateStr(3)
  },
  {
    id: 'ORD-1006',
    customer_name: 'إبراهيم توفيق',
    customer_phone: '01235711131',
    governorate: 'القاهرة',
    items: [
      { id: 'box-3', name: 'حقيبة الطالب الإعدادي المتكاملة', quantity: 1, price: 680, type: 'box' },
      { id: 'prod-6', name: 'كشكول سلك مقسم A4 - 5 فواصل 200 ورقة', quantity: 1, price: 95, type: 'product' }
    ],
    total_amount: 775,
    status: 'shipping',
    created_at: getPastDateStr(1)
  },
  {
    id: 'ORD-1007',
    customer_name: 'شريفة متولي',
    customer_phone: '01099887766',
    governorate: 'الدقهلية',
    items: [
      { id: 'prod-1', name: 'سلاح التلميذ - اللغة العربية - الصف السادس الابتدائي', quantity: 1, price: 145, type: 'product' },
      { id: 'prod-4', name: 'دفتر تحضير دروس فاخر 100 ورقة مقوى', quantity: 2, price: 50, type: 'product' }
    ],
    total_amount: 290, // 245 + 45 shipping = 290
    status: 'new',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
  },
  {
    id: 'ORD-1008',
    customer_name: 'حازم رأفت البدري',
    customer_phone: '01155443322',
    governorate: 'المنيا',
    items: [
      { id: 'box-2', name: 'حقيبة متفوقي الابتدائي المدرسية', quantity: 2, price: 520, type: 'box' }
    ],
    total_amount: 1040,
    status: 'delivered',
    created_at: getPastDateStr(5)
  },
  {
    id: 'ORD-1009',
    customer_name: 'ياسمين مروان',
    customer_phone: '01004455667',
    governorate: 'أسوان',
    items: [
      { id: 'prod-5', name: 'قصص الأنبياء للأطفال - مجلد ملون كامل', quantity: 3, price: 195, type: 'product' }
    ],
    total_amount: 585,
    status: 'delivered',
    created_at: getPastDateStr(4)
  },
  {
    id: 'ORD-1010',
    customer_name: 'سليمان خالد الصاوي',
    customer_phone: '01555889922',
    governorate: 'الغربية',
    items: [
      { id: 'prod-2', name: 'الأضواء - الرياضيات - الصف الأول الإعدادي', quantity: 2, price: 160, type: 'product' }
    ],
    total_amount: 365,
    status: 'confirmed',
    created_at: getPastDateStr(2)
  }
];

export const defaultCoupons: Coupon[] = [
  { code: 'KHODARY10', type: 'percentage', value: 10, min_order: 200, usage_limit: 100, usage_count: 34, is_active: true },
  { code: 'FREE50', type: 'fixed', value: 50, min_order: 400, usage_limit: 50, usage_count: 12, is_active: true },
  { code: 'WELCOME', type: 'percentage', value: 5, usage_count: 145, is_active: true },
  { code: 'OFF200', type: 'fixed', value: 200, min_order: 1000, usage_limit: 10, usage_count: 10, is_active: false },
];

export const defaultShippingRates: ShippingRate[] = [
  { governorate: 'القاهرة', shipping_fee: 35, delivery_time: '24 ساعة', is_active: true },
  { governorate: 'الجيزة', shipping_fee: 35, delivery_time: '24-48 ساعة', is_active: true },
  { governorate: 'الإسكندرية', shipping_fee: 40, delivery_time: '2-3 أيام', is_active: true },
  { governorate: 'القليوبية', shipping_fee: 40, delivery_time: '2-3 أيام', is_active: true },
  { governorate: 'الدقهلية', shipping_fee: 45, delivery_time: '3-4 أيام', is_active: true },
  { governorate: 'الشرقية', shipping_fee: 45, delivery_time: '3-4 أيام', is_active: true },
  { governorate: 'المنوفية', shipping_fee: 45, delivery_time: '3-4 أيام', is_active: true },
  { governorate: 'البحيرة', shipping_fee: 45, delivery_time: '3-4 أيام', is_active: true },
  { governorate: 'الفيوم', shipping_fee: 50, delivery_time: '4-5 أيام', is_active: true },
  { governorate: 'المنيا', shipping_fee: 55, delivery_time: '4-5 أيام', is_active: true },
  { governorate: 'أسيوط', shipping_fee: 60, delivery_time: '5-6 أيام', is_active: true },
  { governorate: 'سوهاج', shipping_fee: 60, delivery_time: '5-6 أيام', is_active: true },
  { governorate: 'الأقصر', shipping_fee: 65, delivery_time: '5-6 أيام', is_active: true },
  { governorate: 'أسوان', shipping_fee: 70, delivery_time: '6-7 أيام', is_active: true },
];

export const defaultTrackingPixels: TrackingPixel[] = [
  { platform: 'facebook', pixel_id: '123456789012345', active: true, conversion_api_token: 'EAAD...fake_token...ZZ', events: ['PageView', 'AddToCart', 'Purchase'] },
  { platform: 'google', pixel_id: 'G-AB12CDE3FG', active: true, events: ['PageView', 'Purchase'] },
  { platform: 'snapchat', pixel_id: 'snap-pixel-id-1122', active: false, events: ['PageView'] },
  { platform: 'tiktok', pixel_id: 'tiktok-pixel-id-3344', active: false, events: ['PageView'] },
];

export const defaultApiKeys: ApiKey[] = [
  { id: 'key-1', label: 'تكامل شركة الشحن (أرامكس)', key_hash: 'kh_live_8f3d...9a2e', created_at: getPastDateStr(10), last_used: getPastDateStr(0) },
  { id: 'key-2', label: 'لوحة التحليلات الخارجية', key_hash: 'kh_live_2e4a...6b1c', created_at: getPastDateStr(4), last_used: getPastDateStr(1) },
];

export const defaultCartEvents = [
  { product_id: 'prod-1', count: 48 },
  { product_id: 'prod-2', count: 32 },
  { product_id: 'prod-3', count: 75 },
  { product_id: 'prod-4', count: 18 },
  { product_id: 'prod-5', count: 62 },
  { product_id: 'prod-6', count: 14 }
];

export const defaultVisitSources = [
  { source: 'فيسبوك / إنستغرام', count: 1245 },
  { source: 'جوجل (بحث عضوي)', count: 856 },
  { source: 'زيارة مباشرة', count: 412 },
  { source: 'حملة جوجل المدفوعة', count: 320 },
  { source: 'تيك توك', count: 190 },
  { source: 'مصادر أخرى', count: 88 }
];

export const defaultSiteSettings = {
  store_name: 'مكتبة الخضري',
  logo_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop&q=80',
  developer_name: 'حلول الخضري التقنية',
  developer_url: 'https://elkhodary-dev.com',
  maintenance_mode: 'false',
  free_shipping_enabled: 'true',
  free_shipping_min: 500,
  free_shipping_label: 'شحن مجاني للطلبات فوق 500 جنيه!',
  top_ribbon_text: 'عروض العودة للمدارس: شحن مجاني لكافة المحافظات للطلبات بقيمة 500 ج.م أو أكثر!',
  hero_card_type: 'box',
  hero_card_id: 'box-2',
  featured_box_id: 'box-2',
  box_builder_title: 'اصنع باقتك المدرسية المخصصة بنفسك!',
  box_builder_desc: 'لا تتقيد بالباقات الجاهزة. اختر الكشكول، القلم، المسطرة، وكل ما تحتاجه بالكميات التي تناسبك تماماً، ودع الباقي علينا لتعبئته وتوصيله لباب منزلك.',
  box_builder_image: '',
  box_builder_step1: 'اختر المرحلة الدراسية',
  box_builder_step2: 'عدّل وزد الأدوات والكميات',
  box_builder_step3: 'أضف الصندوق للسلة',
  box_builder_img1: '',
  box_builder_img2: '',
  box_builder_img3: '',
  box_builder_img4: '',
  box_builder_img5: '',
  box_builder_img6: ''
};

export const defaultPages: PageData[] = [
  {
    slug: 'home',
    title: 'الرئيسية',
    updated_at: getPastDateStr(1),
    blocks: [
      { id: 'b1', type: 'hero', order: 1, content: { title: 'مكتبة الخضري التعليمية', subtitle: 'بوابتكم لأفضل الكتب الدراسية والبوكسات التعليمية المتكاملة لجميع المراحل المدرسية في مصر.', imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&auto=format&fit=crop&q=80', ctaText: 'تصفح الكتب والبوكسات', ctaLink: '#categories' } },
      { id: 'b2', type: 'stats', order: 2, content: { stat1_emoji: '🎓', stat1_number: '2000+', stat1_label: 'طالب سعيد', stat2_emoji: '📦', stat2_number: '1500+', stat2_label: 'بوكس تم تسليمه', stat3_emoji: '⭐', stat3_number: '4.9', stat3_label: 'تقييم العملاء' } },
      { id: 'b3', type: 'packages_section', order: 3, content: { title: 'باقات المراحل الدراسية الجاهزة', subtitle: 'اختر الباقة المناسبة لمرحلة طفلك ووفر عناء شراء كل قطعة بمفردها', ctaText: 'عرض كل الباقات' } },
      { id: 'b5', type: 'products_row', order: 4, content: { title: 'المنتجات الأكثر طلباً', subtitle: 'أفضل الأدوات المكتبية والقرطاسية المدرسية بأعلى جودة وأفضل الأسعار', categoryId: 'all', limit: 8, layout: 'scroll' } },
      { 
        id: 'b7', 
        type: 'testimonials', 
        order: 5, 
        content: { 
          title: 'آراء عائلتنا الدافئة 🎓', 
          subtitle: 'قالوا عن مكتبة الخضري', 
          ctaText: 'شاركينا تقييمك وتجربتك معنا ✍️',
          rev1_name: 'ندى أحمد',
          rev1_city: 'دمياط',
          rev1_comment: 'الهدية كانت لابني في أول يوم دراسي، ملامحه وهو بيفتح العلبة وتفاصيل الأدوات لا تُقدر بثمن، متشكرة جداً.',
          rev1_rating: 5,
          rev2_name: 'سارة محمد',
          rev2_city: 'القاهرة',
          rev2_comment: 'طلبت الكتب المدرسية والمستلزمات، خامات ممتازة وتغليف فاخر ومنسق جداً، والتوصيل سريع لباب البيت.',
          rev2_rating: 5,
          rev3_name: 'مريم محمود',
          rev3_city: 'الإسكندرية',
          rev3_comment: 'الباقة المدرسية تجنن والتفاصيل والفرز نظيفة جداً. الأدوات جودتها عالية والشغل يستاهل كل قرش بجد.',
          rev3_rating: 5
        } 
      },
      { id: 'b6', type: 'text', order: 6, content: { text: 'نهدف في مكتبة الخضري إلى تيسير العملية التعليمية على أولياء الأمور والطلاب من خلال توفير باقات وبوكسات دراسية متكاملة لكل مرحلة تعليمية، تضم كافة الكتب الخارجية المعتمدة والأدوات المكتبية الأساسية بجودة ممتازة وسعر مخفض.' } },
    ]
  },
  {
    slug: 'about',
    title: 'من نحن',
    updated_at: getPastDateStr(12),
    blocks: [
      { id: 'ab1', type: 'about_header', order: 1, content: { title: 'من نحن', subtitle: 'عقدان من خدمة التعليم ونشر المعرفة' } },
      { id: 'ab2', type: 'about_story', order: 2, content: { title: 'قصة نجاح مكتبة الخضري', text1: 'تأسست مكتبة الخضري لقرابة عقدين من الزمان لتكون الشريك الأول لأولياء الأمور والطلاب في توفير أجود أنواع الأدوات والمستلزمات المدرسية والقرطاسية في مصر.', text2: 'نهدف إلى تسهيل التجهيز للدراسة من خلال فكرة "الباقات الذكية" المجهزة مسبقاً، لنخلص الآباء والأمهات من عناء التنقل والبحث لشراء متطلبات المدارس لكل طفل على حدة.', imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80' } },
      { id: 'ab3', type: 'about_values', order: 3, content: { card1_title: 'رسالتنا', card1_text: 'توفير الوقت والمال للأسرة المصرية عبر تقديم حقائب مدرسية وباقات جاهزة ومخصصة بدقة لكل طالب بأعلى جودة.', card1_emoji: '🎯', card2_title: 'رؤيتنا', card2_text: 'أن نكون المنصة الإلكترونية الرائدة والأولى في مصر لتجهيز وتوصيل المستلزمات والقرطاسية المدرسية والجامعية.', card2_emoji: '🏆', card3_title: 'تاريخنا', card3_text: 'عقود من التطوير المستمر وبناء شبكة علاقات مع كبرى مصانع وماركات المستلزمات المكتبية في الشرق الأوسط.', card3_emoji: '⏳' } }
    ]
  },
  {
    slug: 'packages',
    title: 'الباقات المدرسية',
    updated_at: getPastDateStr(2),
    blocks: [
      { id: 'pk1', type: 'hero', order: 1, content: { title: 'الباقات المدرسية الذكية', subtitle: 'وفرنا لك كافة مستلزمات المراحل التعليمية المختلفة في باقات مجمعة ومحسوبة بدقة.', imageUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1200&auto=format&fit=crop&q=80', badge_text: 'عرض العودة للمدارس', ctaText: 'تصفح الآن' } },
      { id: 'pk2', type: 'packages_section', order: 2, content: { title: 'الباقات المتاحة للطلب', subtitle: 'اختر الباقة المناسبة لمرحلة طفلك ووفر عناء شراء كل قطعة بمفردها', boxIds: [] } }
    ]
  },
  {
    slug: 'box-builder',
    title: 'صانع الصناديق',
    updated_at: getPastDateStr(3),
    blocks: [
      { id: 'bx1', type: 'hero', order: 1, content: { title: 'صانع الصناديق التفاعلي', subtitle: 'صمم بوكس أدواتك المدرسية بنفسك، اختر الكتب والكشاكيل واستمتع بخصم الحزمة الفوري.', imageUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=1200&auto=format&fit=crop&q=80' } },
      {
        id: 'bx2',
        type: 'box_builder_stages',
        order: 2,
        content: {
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
          high_desc: 'باقة متكاملة تحوي كشاكيل جامعية كبيرة، أوراق فلوسكاب وأقلام حبر فاخرة.',
          high_price: '780',
          cta_text: 'تخصيص الباقة'
        }
      }
    ]
  },
  {
    slug: 'contact',
    title: 'اتصل بنا',
    updated_at: getPastDateStr(5),
    blocks: [
      { id: 'co1', type: 'hero', order: 1, content: { title: 'تواصل معنا في أي وقت', subtitle: 'نحن هنا للإجابة على استفساراتكم حول الباقات وعمليات التوصيل طوال أيام الأسبوع.', imageUrl: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=1200&auto=format&fit=crop&q=80' } },
      { id: 'co2', type: 'contact_section', order: 2, content: { phone: '19000', email: 'info@alkhodary.eg', address: 'القاهرة، جمهورية مصر العربية', work_hours: 'يومياً من 9:00 ص إلى 10:00 م', phone_subtext: 'متاح طوال ساعات العمل للمكالمات السريعة.', email_subtext: 'للمراسلات العامة والاستفسارات التجارية.', address_subtext: 'يخدم المقر كافة عمليات الشحن والتعبئة.', work_hours_subtext: 'ما عدا يوم الجمعة والعطلات الرسمية.', ctaText: 'تواصل معنا واتساب', ctaLink: 'https://wa.me/201000000000' } }
    ]
  },
  {
    slug: 'products',
    title: 'صفحة المنتجات',
    updated_at: getPastDateStr(1),
    blocks: [
      { id: 'pr1', type: 'hero', order: 1, content: { title: 'منتجاتنا التعليمية المتميزة', subtitle: 'تصفح واشترِ أفضل الكتب الخارجية المعتمدة والأدوات المدرسية والقرطاسية المتميزة بأسعار تخدم نجاحك.', imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&auto=format&fit=crop&q=80' } }
    ]
  }
];

// -------------------------------------------------------------
// عمليات محاكاة التخزين (Storage Helpers)
// -------------------------------------------------------------

const getStorageItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'lib', 'mock_db.json');
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const db = JSON.parse(fileContent);
        if (db[key] !== undefined) {
          return db[key];
        }
      }
    } catch (e) {
      // silent fail on server
    }
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage`, error);
    return defaultValue;
  }
};

const setStorageItem = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    
    // Sync to local json file on server (for localhost development)
    fetch('/api/sync-mock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, data: value }),
    }).catch(err => console.error('Error syncing mock data to API:', err));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage`, error);
  }
};

export const getMockData = {
  categories: () => getStorageItem<Category[]>('kh_categories', defaultCategories),
  products: () => getStorageItem<Product[]>('kh_products', defaultProducts),
  boxes: () => getStorageItem<Box[]>('kh_boxes', defaultBoxes),
  orders: () => getStorageItem<Order[]>('kh_orders', defaultOrders),
  coupons: () => getStorageItem<Coupon[]>('kh_coupons', defaultCoupons),
  shippingRates: () => getStorageItem<ShippingRate[]>('kh_shipping_rates', defaultShippingRates),
  trackingPixels: () => getStorageItem<TrackingPixel[]>('kh_tracking_pixels', defaultTrackingPixels),
  apiKeys: () => getStorageItem<ApiKey[]>('kh_api_keys', defaultApiKeys),
  cartEvents: () => getStorageItem<typeof defaultCartEvents>('kh_cart_events', defaultCartEvents),
  visitSources: () => getStorageItem<typeof defaultVisitSources>('kh_visit_sources', defaultVisitSources),
  settings: () => getStorageItem<typeof defaultSiteSettings>('kh_settings', defaultSiteSettings),
  pages: () => {
    const pages = getStorageItem<PageData[]>('kh_pages', defaultPages);
    // نظام الفحص الذاتي لمعالجة نقص أي صفحات جديدة بالـ LocalStorage
    const requiredSlugs = ['home', 'about', 'packages', 'box-builder', 'contact', 'products'];
    let updated = false;
    const currentPages = pages.map(p => ({ ...p, blocks: p.blocks ? [...p.blocks] : [] }));
    
    requiredSlugs.forEach(slug => {
      if (!currentPages.some(p => p.slug === slug)) {
        const defaultPage = defaultPages.find(dp => dp.slug === slug);
        if (defaultPage) {
          currentPages.push(JSON.parse(JSON.stringify(defaultPage)));
          updated = true;
        }
      }
    });

    // التحديث التلقائي للكتل الافتراضية المفقودة بالصفحة الرئيسية (مثل صانع الصناديق والإحصائيات)
    const homePage = currentPages.find(p => p.slug === 'home');
    if (homePage) {
      const defaultHome = defaultPages.find(dp => dp.slug === 'home');
      if (defaultHome && defaultHome.blocks) {
        let homeUpdated = false;
        defaultHome.blocks.forEach(defaultBlock => {
          if (!homePage.blocks.some(b => b.type === defaultBlock.type)) {
            homePage.blocks.push(JSON.parse(JSON.stringify(defaultBlock)));
            homeUpdated = true;
          }
        });
        if (homeUpdated) {
          // إعادة الترتيب
          homePage.blocks = homePage.blocks.map((b, index) => ({ ...b, order: index + 1 }));
          updated = true;
        }
      }
    }

    // التحديث التلقائي لكتل صفحة من نحن لضمان وجود كرت القيم الثلاثة (about_values)
    const aboutPage = currentPages.find(p => p.slug === 'about');
    if (aboutPage) {
      const hasValues = aboutPage.blocks?.some(b => b.type === 'about_values');
      if (!hasValues) {
        const defaultAbout = defaultPages.find(dp => dp.slug === 'about');
        if (defaultAbout) {
          aboutPage.blocks = JSON.parse(JSON.stringify(defaultAbout.blocks));
          updated = true;
        }
      }
    }

    // التحديث التلقائي لكتل صفحة صانع الصناديق لضمان وجود كتل الهيرو والمراحل
    const builderPage = currentPages.find(p => p.slug === 'box-builder');
    if (builderPage) {
      const defaultBuilder = defaultPages.find(dp => dp.slug === 'box-builder');
      if (defaultBuilder && defaultBuilder.blocks) {
        let builderUpdated = false;
        defaultBuilder.blocks.forEach(defaultBlock => {
          if (!builderPage.blocks.some(b => b.type === defaultBlock.type)) {
            builderPage.blocks.push(JSON.parse(JSON.stringify(defaultBlock)));
            builderUpdated = true;
          }
        });
        if (builderUpdated) {
          builderPage.blocks = builderPage.blocks.map((b, index) => ({ ...b, order: index + 1 }));
          updated = true;
        }
      }
    }
    
    if (updated) {
      setStorageItem('kh_pages', currentPages);
    }
    return currentPages;
  },
};


export const saveMockData = {
  categories: (data: Category[]) => setStorageItem('kh_categories', data),
  products: (data: Product[]) => setStorageItem('kh_products', data),
  boxes: (data: Box[]) => setStorageItem('kh_boxes', data),
  orders: (data: Order[]) => setStorageItem('kh_orders', data),
  coupons: (data: Coupon[]) => setStorageItem('kh_coupons', data),
  shippingRates: (data: ShippingRate[]) => setStorageItem('kh_shipping_rates', data),
  trackingPixels: (data: TrackingPixel[]) => setStorageItem('kh_tracking_pixels', data),
  apiKeys: (data: ApiKey[]) => setStorageItem('kh_api_keys', data),
  settings: (data: typeof defaultSiteSettings) => setStorageItem('kh_settings', data),
  pages: (data: PageData[]) => setStorageItem('kh_pages', data),
};
