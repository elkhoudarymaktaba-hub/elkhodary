// app/admin/staff/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Shield, Eye, Package, ShoppingBag, X, Check, KeyRound, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { showToast } from '@/lib/toast';

import { useRole } from '@/lib/useRole';

// =================== أنواع الصلاحيات ===================
type Permission = 'full_admin' | 'product_manager' | 'order_manager' | 'viewer';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  password: string; // مُخزّن mock — في الإنتاج يُشفَّر بـ bcrypt
  role: Permission;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

// قاموس بيانات الصلاحيات لكل دور
const roleConfig: Record<Permission, { label: string; color: string; description: string; icon: React.ReactNode; permissions: string[] }> = {
  full_admin: {
    label: 'مدير كامل',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'تحكم كامل في كافة أقسام الموقع والإعدادات وإدارة الموظفين',
    icon: <Shield className="w-4 h-4" />,
    permissions: ['عرض لوحة التحكم', 'إدارة المنتجات', 'إدارة الطلبات', 'إدارة الأقسام والبوكسات', 'إدارة الشحن والكوبونات', 'الإعدادات والتتبع', 'إدارة مفاتيح API', 'إدارة الصفحات', 'إدارة الموظفين والصلاحيات'],
  },
  product_manager: {
    label: 'مدير منتجات',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'إضافة وتعديل وحذف المنتجات والأقسام والبوكسات فقط',
    icon: <Package className="w-4 h-4" />,
    permissions: ['عرض لوحة التحكم', 'إدارة المنتجات (إضافة/تعديل/حذف)', 'إدارة الأقسام', 'إدارة البوكسات', 'عرض الطلبات (قراءة فقط)'],
  },
  order_manager: {
    label: 'مدير مبيعات',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'تعديل حالات الطلبات ومتابعتها وطباعة الفواتير فقط',
    icon: <ShoppingBag className="w-4 h-4" />,
    permissions: ['عرض لوحة التحكم', 'عرض الطلبات وتعديل حالاتها', 'طباعة الفواتير', 'عرض العملاء'],
  },
  viewer: {
    label: 'مراقب فقط',
    color: 'bg-slate-50 text-slate-600 border-slate-200',
    description: 'صلاحية المشاهدة والقراءة فقط بدون أي تعديلات',
    icon: <Eye className="w-4 h-4" />,
    permissions: ['عرض لوحة التحكم والإحصائيات', 'عرض المنتجات (بدون تعديل)', 'عرض الطلبات (بدون تعديل)', 'عرض التقارير والتحليلات'],
  },
};

// =================== القراءة والحفظ من localStorage ===================
const STAFF_KEY = 'elkhodary_staff';

function loadStaff(): StaffMember[] {
  if (typeof window === 'undefined') return defaultStaff;
  try {
    const stored = localStorage.getItem(STAFF_KEY);
    return stored ? JSON.parse(stored) : defaultStaff;
  } catch {
    return defaultStaff;
  }
}

function saveStaff(list: StaffMember[]) {
  localStorage.setItem(STAFF_KEY, JSON.stringify(list));
}

const defaultStaff: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'أحمد الخضري',
    email: 'admin@elkhodary.com',
    password: 'admin123',
    role: 'full_admin',
    is_active: true,
    created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    last_login: new Date().toISOString(),
  },
  {
    id: 'staff-2',
    name: 'محمد علي',
    email: 'products@elkhodary.com',
    password: 'products2025',
    role: 'product_manager',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'staff-3',
    name: 'سارة أحمد',
    email: 'sales@elkhodary.com',
    password: 'sales2025',
    role: 'order_manager',
    is_active: true,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// =================== الصفحة الرئيسية ===================
export default function StaffPage() {
  const { role, loading: roleLoading } = useRole();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [showPasswordFor, setShowPasswordFor] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // حقول الفورم
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<Permission>('viewer');
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    setStaff(loadStaff());
  }, []);

  if (roleLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 text-ink">
        <svg className="animate-spin h-8 w-8 text-amber" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="font-bold font-arabic text-sm">جاري التحقق من صلاحيات الحساب...</span>
      </div>
    );
  }

  if (role !== 'full_admin') {
    return (
      <div className="py-20 text-center bg-white rounded-[24px] border border-[#E7DCC2] shadow-premium max-w-xl mx-auto space-y-4 p-8 text-right" dir="rtl">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 border border-rose-100 rounded-[20px] flex items-center justify-center mx-auto text-3xl">
          🛡️
        </div>
        <h3 className="text-lg font-bold text-ink font-arabic text-center">عذراً، الوصول غير مصرح به</h3>
        <p className="text-xs text-slate-400 font-arabic leading-relaxed text-center">
          صفحة إدارة المشرفين وتخصيص الصلاحيات مخصصة فقط للمدير العام للحساب (Super Admin). دورك الحالي لا يسمح لك باستعراض أو تعديل هذه الحسابات.
        </p>
      </div>
    );
  }

  const openAddForm = () => {
    setEditingStaff(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('viewer');
    setFormIsActive(true);
    setIsFormOpen(true);
  };

  const openEditForm = (member: StaffMember) => {
    setEditingStaff(member);
    setFormName(member.name);
    setFormEmail(member.email);
    setFormPassword(member.password);
    setFormRole(member.role);
    setFormIsActive(member.is_active);
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      showToast('يرجى تعبئة جميع الحقول المطلوبة!', 'error');
      return;
    }

    let updated: StaffMember[];

    if (editingStaff) {
      updated = staff.map(s => s.id === editingStaff.id
        ? { ...s, name: formName, email: formEmail, password: formPassword, role: formRole, is_active: formIsActive }
        : s
      );
    } else {
      const newMember: StaffMember = {
        id: `staff-${Math.random().toString(36).substring(2, 9)}`,
        name: formName,
        email: formEmail,
        password: formPassword,
        role: formRole,
        is_active: formIsActive,
        created_at: new Date().toISOString(),
      };
      updated = [...staff, newMember];
    }

    setStaff(updated);
    saveStaff(updated);
    setIsFormOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    if (staff.filter(s => s.role === 'full_admin').length === 1 && staff.find(s => s.id === id)?.role === 'full_admin') {
      showToast('لا يمكن حذف المدير الوحيد ذو الصلاحية الكاملة!', 'error');
      return;
    }
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    const updated = staff.filter(s => s.id !== deleteConfirmId);
    setStaff(updated);
    saveStaff(updated);
    setDeleteConfirmId(null);
    showToast('تم حذف المشرف بنجاح.', 'success');
  };

  const toggleActive = (id: string) => {
    const updated = staff.map(s => s.id === id ? { ...s, is_active: !s.is_active } : s);
    setStaff(updated);
    saveStaff(updated);
  };

  if (isFormOpen) {
    return (
      <div className="space-y-6 text-right" dir="rtl">
        <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-ink font-arabic">
              {editingStaff ? 'تعديل بيانات المشرف' : 'إضافة مشرف جديد'}
            </h3>
            <p className="text-xs text-slate-400 font-arabic mt-1">تحديد اسم الحساب، البريد الإلكتروني، كلمة المرور، والصلاحية</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsFormOpen(false)} className="font-arabic">
            العودة لقائمة المشرفين
          </Button>
        </div>

        <div className="bg-white p-6 rounded-[16px] shadow-premium border border-[#E7DCC2]">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="الاسم الكامل للمشرف"
                placeholder="مثال: محمد أحمد"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
              <Input
                label="البريد الإلكتروني (اسم المستخدم)"
                type="email"
                placeholder="example@elkhodary.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="كلمة المرور"
                type="text"
                placeholder="كلمة مرور قوية"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                required
              />
              <Select
                label="مستوى الصلاحية"
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as Permission)}
                options={[
                  { value: 'full_admin', label: '🛡️ مدير كامل' },
                  { value: 'product_manager', label: '📦 مدير منتجات' },
                  { value: 'order_manager', label: '🛍️ مدير مبيعات' },
                  { value: 'viewer', label: '👁️ مراقب فقط' },
                ]}
              />
            </div>

            {/* عرض صلاحيات الدور المختار */}
            {formRole && (
              <div className="bg-[#FBEBCB]/10 border border-[#E7DCC2] rounded-[16px] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${roleConfig[formRole].color}`}>
                    {roleConfig[formRole].icon}
                    {roleConfig[formRole].label}
                  </span>
                  <p className="text-xs text-slate-500 font-arabic">{roleConfig[formRole].description}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {roleConfig[formRole].permissions.map((perm, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600 font-arabic">
                      <Check className="w-3 h-3 text-sage shrink-0" />
                      {perm}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <label className="text-sm font-bold text-ink font-arabic">حالة الحساب:</label>
              <button
                type="button"
                onClick={() => setFormIsActive(!formIsActive)}
                className={`px-4 py-1.5 rounded-[10px] text-xs font-bold font-arabic border transition-all ${
                  formIsActive
                    ? 'bg-[#DCEEE5] text-[#396A56] border-[#4F8F73]/20'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
              >
                {formIsActive ? '✅ حساب نشط ومفعّل' : '⛔ حساب موقوف'}
              </button>
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)} className="font-arabic">إلغاء</Button>
              <Button type="submit" variant="primary" size="sm" className="font-arabic">
                {editingStaff ? 'حفظ التعديلات' : 'إنشاء الحساب'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* هيدر */}
      <div className="bg-white p-5 rounded-[16px] shadow-premium border border-[#E7DCC2] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink font-arabic">إدارة المشرفين والصلاحيات</h2>
          <p className="text-xs text-slate-400 font-arabic mt-1">إنشاء حسابات مشرفين بأدوار وصلاحيات مختلفة لإدارة لوحة التحكم</p>
        </div>
        <Button variant="primary" onClick={openAddForm} className="font-arabic flex items-center gap-2 shadow-md shadow-amber/20">
          <Plus className="w-5 h-5" />
          <span>إضافة مشرف جديد</span>
        </Button>
      </div>

      {/* بطاقات شرح الأدوار */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(Object.keys(roleConfig) as Permission[]).map((role) => {
          const count = staff.filter(s => s.role === role).length;
          const cfg = roleConfig[role];
          return (
            <div key={role} className={`border rounded-[16px] p-4 text-right ${cfg.color} bg-opacity-30`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.color}`}>
                  {cfg.icon} {cfg.label}
                </span>
                <span className="text-2xl font-black font-english text-slate-700">{count}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-arabic leading-snug">{cfg.description}</p>
            </div>
          );
        })}
      </div>

      {/* جدول المشرفين */}
      <div className="bg-white rounded-[16px] shadow-premium border border-[#E7DCC2] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="bg-[#F6F1E4]/30 border-b border-[#E7DCC2] text-ink-soft font-arabic">
                <th className="py-4 px-6 font-bold">المشرف</th>
                <th className="py-4 px-6 font-bold">البريد الإلكتروني</th>
                <th className="py-4 px-6 font-bold">كلمة المرور</th>
                <th className="py-4 px-6 font-bold">الدور والصلاحية</th>
                <th className="py-4 px-6 font-bold text-center">الحالة</th>
                <th className="py-4 px-6 font-bold">آخر دخول</th>
                <th className="py-4 px-6 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-[#E7DCC2]">
              {staff.map((member) => {
                const cfg = roleConfig[member.role];
                return (
                  <tr key={member.id} className="hover:bg-[#FBEBCB]/15 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${cfg.color}`}>
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 font-arabic block">{member.name}</span>
                          <span className="text-[10px] text-slate-400 font-arabic">
                            منذ {new Date(member.created_at).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-english text-slate-600 text-xs">{member.email}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-english text-xs text-slate-600">
                          {showPasswordFor === member.id ? member.password : '••••••••'}
                        </span>
                        <button
                          onClick={() => setShowPasswordFor(showPasswordFor === member.id ? null : member.id)}
                          className="p-1 text-slate-400 hover:text-amber hover:bg-[#FBEBCB]/30 rounded-[6px] transition-colors"
                          title={showPasswordFor === member.id ? 'إخفاء' : 'إظهار كلمة المرور'}
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`flex items-center gap-1.5 w-fit px-3 py-1 rounded-full text-[10px] font-bold border ${cfg.color}`}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => toggleActive(member.id)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold font-arabic border transition-all ${
                          member.is_active
                            ? 'bg-[#DCEEE5] text-[#396A56] border-[#4F8F73]/20 hover:bg-[#4F8F73]/10'
                            : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {member.is_active ? '✅ نشط' : '⛔ موقوف'}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-xs font-arabic">
                      {member.last_login
                        ? new Date(member.last_login).toLocaleDateString('ar-EG', { dateStyle: 'medium' })
                        : '—'
                      }
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditForm(member)}
                          className="p-1.5 bg-slate-50 text-slate-500 hover:text-amber hover:bg-[#FBEBCB]/30 rounded-[8px] transition-colors"
                          title="تعديل"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(member.id)}
                          className="p-1.5 bg-slate-50 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-[8px] transition-colors"
                          title="حذف"
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
      </div>

      {/* تذكير أمني */}
      <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-4 text-right">
        <p className="text-xs text-amber-700 font-arabic leading-relaxed">
          ⚠️ <strong>ملاحظة أمنية:</strong> في بيئة الإنتاج الحقيقية، يجب تشفير كلمات المرور باستخدام bcrypt وتخزينها مشفرة في قاعدة البيانات. المعلومات الحالية محفوظة في المتصفح بشكل مؤقت للاختبار التجريبي فقط.
        </p>
      </div>
      {/* نافذة تأكيد الحذف المخصصة */}
      <Dialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="تأكيد الحذف"
        size="sm"
      >
        <div className="space-y-6 text-right font-arabic">
          <div className="flex items-center gap-3 text-rose-600 bg-rose-50 p-4 border border-rose-100 rounded-xl">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <p className="text-xs font-bold leading-relaxed">
              تحذير: هل أنت متأكد من رغبتك في حذف هذا المشرف؟ لا يمكن التراجع عن هذا الإجراء وسيتم حظر وصول هذا الحساب إلى لوحة التحكم فوراً.
            </p>
          </div>
          
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmId(null)}
              className="font-arabic"
            >
              إلغاء
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={confirmDelete}
              className="bg-rose-500 hover:bg-rose-600 text-white font-arabic border-none shadow-sm"
            >
              نعم، احذف الحساب
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
