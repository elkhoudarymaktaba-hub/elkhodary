-- SQL Seed Data for Al-Khodary E-Commerce
-- Run this in your Supabase SQL Editor after running supabase_schema.sql.

-- 1. Insert Categories
insert into categories (id, name, slug, icon) values
('c1111111-1111-1111-1111-111111111111', 'أقلام وكتابة', 'pens-writing', 'PenTool'),
('c2222222-2222-2222-2222-222222222222', 'كشاكيل وكراسات', 'notebooks', 'BookOpen'),
('c3333333-3333-3333-3333-333333333333', 'أدوات هندسية ومساطر', 'geometry-rulers', 'Ruler'),
('c4444444-4444-4444-4444-444444444444', 'ممحاة ومبراة', 'erasers-sharpeners', 'Eraser'),
('c5555555-5555-5555-5555-555555555555', 'ألوان ورسم', 'colors-painting', 'Palette');

-- 2. Insert Products (UUIDs must start with valid hex chars a-f or 0-9)
insert into products (id, name, description, price_unit, price_box, category_id, images, is_featured, stock, active) values
-- Pens & Writing
('a1111111-1111-1111-1111-111111111111', 'قلم جاف أزرق سيلو 0.7 مم', 'قلم جاف أزرق ممتاز للكتابة السلسة وتدفق الحبر المنتظم.', 5.00, 50.00, 'c1111111-1111-1111-1111-111111111111', array['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=300&q=80'], true, 500, true),
('a1111112-1111-1111-1111-111111111112', 'قلم رصاص روترينج HB', 'قلم رصاص أصلي للرسم والكتابة الدراسية اليومية.', 10.00, 100.00, 'c1111111-1111-1111-1111-111111111111', array['https://images.unsplash.com/photo-1596401057633-5310d579870a?auto=format&fit=crop&w=300&q=80'], true, 200, true),
('a1111113-1111-1111-1111-111111111113', 'طقم أقلام تظليل ملونة (4 ألوان)', 'أقلام تحديد وتظليل عالية الوضوح باللون الفسفوري والوردي والأصفر والأخضر.', 40.00, null, 'c1111111-1111-1111-1111-111111111111', array['https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?auto=format&fit=crop&w=300&q=80'], false, 150, true),

-- Notebooks
('a2222221-2222-2222-2222-222222222221', 'كشكول مسطرة 60 ورقة ديزني', 'كشكول مسطرة بغلاف جذاب بتصميم ديزني وأوراق ناعمة سميكة.', 15.00, 140.00, 'c2222222-2222-2222-2222-222222222222', array['https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=300&q=80'], true, 400, true),
('a2222222-2222-2222-2222-222222222222', 'كشكول سلك جامعي 100 ورقة A4', 'كشكول سلك كبير مقسم للدراسة الجامعية والدروس الخصوصية.', 45.00, 400.00, 'c2222222-2222-2222-2222-222222222222', array['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300&q=80'], true, 180, true),
('a2222223-2222-2222-2222-222222222223', 'كراسة رسم 20 ورقة كانسون', 'ورق رسم فاخر سميك ممتاز للتلوين المائي والخشبي.', 25.00, null, 'c2222222-2222-2222-2222-222222222222', array['https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=300&q=80'], false, 100, true),

-- Geometry
('a3333331-3333-3333-3333-333333333331', 'علبة أدوات هندسية روترينج', 'طقم هندسي متكامل يحوي برجل، منقلة، مسطرة ومثلثات.', 85.00, null, 'c3333333-3333-3333-3333-333333333333', array['https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=300&q=80'], true, 80, true),
('a3333332-3333-3333-3333-333333333332', 'مسطرة بلاستيك مرنة 30 سم', 'مسطرة متينة لا تنكسر آمنة تماماً للأطفال.', 8.00, 80.00, 'c3333333-3333-3333-3333-333333333333', array['https://images.unsplash.com/photo-1416339306562-f3d12fefd36f?auto=format&fit=crop&w=300&q=80'], false, 300, true),

-- Erasers
('a4444441-4444-4444-4444-444444444441', 'ممحاة فابر كاستل كبيرة', 'ممحاة ناعمة تزيل أثر الرصاص بنظافة دون إتلاف الأوراق.', 6.00, 60.00, 'c4444444-4444-4444-4444-444444444444', array['https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=300&q=80'], false, 400, true),
('a4444442-4444-4444-4444-444444444442', 'براية معدن ألماني بفتحتين', 'براية معدنية متينة لشحذ الأقلام الرصاص السميكة والرفيعة.', 12.00, null, 'c4444444-4444-4444-4444-444444444444', array['https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=300&q=80'], false, 250, true),

-- Colors
('a5555551-5555-5555-5555-555555555551', 'علبة ألوان خشبية فابر كاستل (12 لون)', 'ألوان زاهية وناعمة وسهلة الدمج ومقاومة للكسر.', 50.00, null, 'c5555555-5555-5555-5555-555555555555', array['https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=300&q=80'], true, 120, true);

-- 3. Insert Base Boxes for Stages (updated product references starting with "a")
insert into boxes (id, name, stage, base_price, image, description, items, active) values
(
  'b1111111-1111-1111-1111-111111111111', 
  'صندوق باقة الابتدائي الشاملة', 
  'primary', 
  480.00, 
  'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=600&q=80',
  'الباقة المقترحة المثالية لطلاب المرحلة الابتدائية تحتوي على الكشاكيل الأساسية وأقلام الرصاص والرسم الجاهزة للتوصيل.',
  '[
    {"product_id": "a1111112-1111-1111-1111-111111111112", "qty": 5},
    {"product_id": "a2222221-2222-2222-2222-222222222221", "qty": 10},
    {"product_id": "a3333332-3333-3333-3333-333333333332", "qty": 2},
    {"product_id": "a4444441-4444-4444-4444-444444444441", "qty": 3},
    {"product_id": "a5555551-5555-5555-5555-555555555551", "qty": 1}
  ]'::jsonb,
  true
),
(
  'b2222222-2222-2222-2222-222222222222', 
  'صندوق باقة الإعدادية المطورة', 
  'middle', 
  620.00, 
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80',
  'الباقة المقترحة لطلاب الإعدادي تشمل كشاكيل سلك هندسية وأدوات البرجل وأقلام الحبر والتظليل للدراسة والامتحانات.',
  '[
    {"product_id": "a1111111-1111-1111-1111-111111111111", "qty": 5},
    {"product_id": "a2222222-2222-2222-2222-222222222222", "qty": 4},
    {"product_id": "a3333331-3333-3333-3333-333333333331", "qty": 1},
    {"product_id": "a4444441-4444-4444-4444-444444444441", "qty": 2},
    {"product_id": "a1111113-1111-1111-1111-111111111113", "qty": 1}
  ]'::jsonb,
  true
),
(
  'b3333333-3333-3333-3333-333333333333', 
  'باقة رياض الأطفال الترفيهية', 
  'kg', 
  320.00, 
  'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
  'باقة تلوين وترفيه خفيفة تهدف لتشجيع أطفال الكي جي على المهارات اليدوية والرسم الممتع.',
  '[
    {"product_id": "a1111112-1111-1111-1111-111111111112", "qty": 3},
    {"product_id": "a2222223-2222-2222-2222-222222222223", "qty": 2},
    {"product_id": "a4444441-4444-4444-4444-444444444441", "qty": 2},
    {"product_id": "a5555551-5555-5555-5555-555555555551", "qty": 1}
  ]'::jsonb,
  true
);

-- 4. Insert Shipping Zones
insert into shipping_zones (governorate_name, price, delivery_days, free_shipping_threshold, active) values
('القاهرة', 35.00, 2, 500.00, true),
('الجيزة', 35.00, 2, 500.00, true),
('الإسكندرية', 45.00, 3, 600.00, true),
('القليوبية', 40.00, 3, 500.00, true),
('طنطا / الغربية', 50.00, 3, 700.00, true),
('المنصورة / الدقهلية', 50.00, 4, 700.00, true),
('أسيوط / صعيد مصر', 65.00, 5, 800.00, true);

-- 5. Insert Coupons
insert into coupons (code, type, value, min_order, active) values
('KHODARY10', 'percentage', 10.00, 200.00, true),
('BACK2SCHOOL', 'fixed', 50.00, 400.00, true),
('FREEGIFT', 'percentage', 5.00, 100.00, true);

-- 6. Insert Default Site Settings
insert into site_settings (key, value) values
('store_name', 'مكتبة الخضري'),
('logo_url', 'https://vrrvblkvongtskadahpm.supabase.co/storage/v1/object/public/assets/logo.png'),
('maintenance_mode', 'false');

-- 7. Insert About page content
insert into pages (slug, title, content) values
(
  'about', 
  'من نحن - مسيرة مكتبة الخضري',
  '[
    {"type": "heading", "value": "مكتبة الخضري - ريادة الأدوات المدرسية والقرطاسية في مصر"},
    {"type": "text", "value": "تأسست مكتبة الخضري لتكون المرجع الأول للطلاب وأولياء الأمور في كافة المراحل التعليمية. نعمل بشغف لتوفير مستلزمات دراسية فائقة الجودة تدعم طفلك في رحلته العلمية."},
    {"type": "heading", "value": "فكرة الباقات المدرسية الذكية"},
    {"type": "text", "value": "اخترعنا نظام الباقات الذكية لنحل مشكلة الشراء الطويل للأدوات المدرسية، حيث نجمع كافة الكشاكيل والأقلام والألوان المطلوبة من المدارس وننسقها في صندوق مجهز وجميل يصلك إلى باب المنزل."}
  ]'::jsonb
);

-- 8. Insert dummy Tracking Pixel config (inactive by default, replace with real ones in dashboard)
insert into tracking_pixels (platform, pixel_id, active) values
('facebook', 'fb_pixel_id_123456', false),
('google', 'G-GA_TRACK_ID_123', false);
