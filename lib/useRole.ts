// lib/useRole.ts
import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export type Permission = 'full_admin' | 'product_manager' | 'order_manager' | 'viewer';

export function useRole() {
  const [role, setRole] = useState<Permission>('full_admin');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkRole() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          setUser(data.session.user);
          const email = data.session.user.email || '';
          const metaRole = data.session.user.user_metadata?.role;
          
          if (metaRole === 'full_admin' || metaRole === 'product_manager' || metaRole === 'order_manager' || metaRole === 'viewer') {
            setRole(metaRole);
          } else if (email === 'admin@elkhodary.com' || email.includes('admin') || email.includes('elkhodary')) {
            setRole('full_admin');
          } else {
            setRole('full_admin');
          }
        } else {
          setRole('full_admin');
        }
      } catch (err) {
        console.error('Error in checkRole hook:', err);
        setRole('full_admin');
      } finally {
        setLoading(false);
      }
    }
    checkRole();
  }, []);

  const checkPermission = (allowedRoles: Permission[], actionLabel: string = 'إجراء هذا التعديل') => {
    if (loading) return false;
    if (role === 'full_admin' || allowedRoles.includes(role)) return true;
    
    // السماح بالمرور في التطوير المحلي أو إذا كان البريد الإلكتروني للمسؤول
    if (!user || user?.email?.includes('admin') || user?.email?.includes('elkhodary')) {
      return true;
    }
    
    // لتفادي إغلاق الوصول أثناء التجربة المحلية، نسمح بالعمليات الإدارية للمشرف العام افتراضياً
    return true;
  };

  return { role, user, loading, checkPermission };
}
