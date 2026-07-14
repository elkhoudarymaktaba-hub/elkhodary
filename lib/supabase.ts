// lib/supabase.ts
// عميل Supabase التفاعلي مع نظام المحاكاة الذكي (Supabase Simulation Fallback)

import { createClient } from '@supabase/supabase-js';
import { getMockData, saveMockData, Product, Category, Box, Order, Coupon, ShippingRate, PageData, TrackingPixel, ApiKey } from './mockData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// التحقق من توافر مفاتيح الاتصال الفعلية
export const isSupabaseConfigured = 
  supabaseUrl.trim() !== '' && 
  supabaseAnonKey.trim() !== '' &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder');

// عميل Supabase الفعلي (إن وجد)
export const realSupabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// -------------------------------------------------------------
// محاكاة نظام سوبابيس بالكامل (LocalStorage Mock Supabase Client)
// -------------------------------------------------------------

class MockSupabaseQueryBuilder {
  private table: string;
  private data: any[];
  private filters: ((item: any) => boolean)[] = [];
  private orderField: string = '';
  private orderAscending: boolean = true;
  private limitCount: number = 1000;
  private isSingle: boolean = false;
  private operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private operationValues: any = null;

  constructor(table: string) {
    this.table = table;
    this.data = this.getTableData(table);
  }

  private getTableData(table: string): any[] {
    switch (table) {
      case 'categories': return getMockData.categories();
      case 'products': return getMockData.products();
      case 'boxes': return getMockData.boxes();
      case 'orders': return getMockData.orders();
      case 'coupons': return getMockData.coupons();
      case 'shipping_rates': return getMockData.shippingRates();
      case 'tracking_pixels': return getMockData.trackingPixels();
      case 'api_keys': return getMockData.apiKeys();
      case 'pages': return getMockData.pages();
      case 'cart_events': return getMockData.cartEvents();
      case 'visit_sources': return getMockData.visitSources();
      case 'contact_submissions':
        if (typeof window !== 'undefined') {
          const stored = window.localStorage.getItem('kh_contact_submissions');
          return stored ? JSON.parse(stored) : [
            { id: 'msg-1', name: 'أحمد محمود', phone: '01012345678', email: 'ahmed@gmail.com', message: 'مرحباً، هل يتوفر لديكم شحن لمحافظة أسوان وبكم التكلفة؟', created_at: new Date(Date.now() - 3600000 * 2).toISOString(), read: false },
            { id: 'msg-2', name: 'سارة أحمد', phone: '01298765432', email: 'sara@yahoo.com', message: 'أريد حجز 5 باقات للمرحلة الابتدائية، هل يوجد خصم للكميات؟', created_at: new Date(Date.now() - 3600000 * 5).toISOString(), read: true }
          ];
        }
        return [];
      case 'supply_lists':
        if (typeof window !== 'undefined') {
          const stored = window.localStorage.getItem('kh_supply_lists');
          return stored ? JSON.parse(stored) : [
            { id: 'list-1', name: 'محمد علي', phone: '01098765432', file_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80', notes: 'أحتاج أدوات مخصصة لمدرسة اللغات بمحافظة الجيزة', status: 'new', created_at: new Date(Date.now() - 3600000 * 3).toISOString() }
          ];
        }
        return [];
      case 'site_settings':
        const settings = getMockData.settings();
        return Object.entries(settings).map(([key, value]) => ({ key, value }));
      default: return [];
    }
  }

  private saveTableData(table: string, data: any[]) {
    switch (table) {
      case 'categories': saveMockData.categories(data as Category[]); break;
      case 'products': saveMockData.products(data as Product[]); break;
      case 'boxes': saveMockData.boxes(data as Box[]); break;
      case 'orders': saveMockData.orders(data as Order[]); break;
      case 'coupons': saveMockData.coupons(data as Coupon[]); break;
      case 'shipping_rates': saveMockData.shippingRates(data as ShippingRate[]); break;
      case 'tracking_pixels': saveMockData.trackingPixels(data as TrackingPixel[]); break;
      case 'api_keys': saveMockData.apiKeys(data as ApiKey[]); break;
      case 'pages': saveMockData.pages(data as PageData[]); break;
      case 'contact_submissions':
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('kh_contact_submissions', JSON.stringify(data));
        }
        break;
      case 'supply_lists':
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('kh_supply_lists', JSON.stringify(data));
        }
        break;
      case 'site_settings':
        const settingsObj: any = {};
        data.forEach(item => {
          settingsObj[item.key] = item.value;
        });
        saveMockData.settings(settingsObj);
        break;
    }
  }

  select(columns?: string) {
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push((item) => item[field] === value);
    return this;
  }

  neq(field: string, value: any) {
    this.filters.push((item) => item[field] !== value);
    return this;
  }

  in(field: string, values: any[]) {
    this.filters.push((item) => values.includes(item[field]));
    return this;
  }

  order(field: string, { ascending = true } = {}) {
    this.orderField = field;
    this.orderAscending = ascending;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async then(resolve: any) {
    this.data = this.getTableData(this.table);

    if (this.operation === 'select') {
      let result = [...this.data];
      for (const filter of this.filters) {
        result = result.filter(filter);
      }

      if (this.orderField) {
        result.sort((a, b) => {
          const valA = a[this.orderField];
          const valB = b[this.orderField];
          if (valA < valB) return this.orderAscending ? -1 : 1;
          if (valA > valB) return this.orderAscending ? 1 : -1;
          return 0;
        });
      }

      result = result.slice(0, this.limitCount);

      if (this.isSingle) {
        resolve({ data: result[0] || null, error: null });
      } else {
        resolve({ data: result, error: null });
      }
    } else if (this.operation === 'insert') {
      const rowsToInsert = Array.isArray(this.operationValues) ? this.operationValues : [this.operationValues];
      const updatedData = [...this.data];

      const insertedRows = rowsToInsert.map((row) => {
        const newRow = { 
          id: row.id || `mock-${Math.random().toString(36).substr(2, 9)}`,
          created_at: row.created_at || new Date().toISOString(),
          ...row 
        };
        updatedData.push(newRow);
        return newRow;
      });

      this.saveTableData(this.table, updatedData);
      resolve({ data: Array.isArray(this.operationValues) ? insertedRows : insertedRows[0], error: null });
    } else if (this.operation === 'update') {
      let updatedCount = 0;
      const updatedData = this.data.map((item) => {
        let match = true;
        for (const filter of this.filters) {
          if (!filter(item)) {
            match = false;
            break;
          }
        }
        if (match) {
          updatedCount++;
          return { ...item, ...this.operationValues };
        }
        return item;
      });

      this.saveTableData(this.table, updatedData);
      
      const updatedRows = updatedData.filter((item) => {
        let match = true;
        for (const filter of this.filters) {
          if (!filter(item)) return false;
        }
        return true;
      });
      
      resolve({ data: updatedRows, error: null, count: updatedCount });
    } else if (this.operation === 'upsert') {
      const rowsToUpsert = Array.isArray(this.operationValues) ? this.operationValues : [this.operationValues];
      let updatedData = [...this.data];

      rowsToUpsert.forEach((row) => {
        const key = this.table === 'coupons' ? 'code' : (this.table === 'shipping_rates' ? 'governorate' : (this.table === 'site_settings' ? 'key' : 'id'));
        const index = updatedData.findIndex(item => item[key] === row[key]);
        
        if (index >= 0) {
          updatedData[index] = { ...updatedData[index], ...row };
        } else {
          updatedData.push({
            id: row.id || `mock-${Math.random().toString(36).substr(2, 9)}`,
            created_at: row.created_at || new Date().toISOString(),
            ...row
          });
        }
      });

      this.saveTableData(this.table, updatedData);
      resolve({ data: this.operationValues, error: null });
    } else if (this.operation === 'delete') {
      let deletedCount = 0;
      const remainingData = this.data.filter((item) => {
        let match = true;
        for (const filter of this.filters) {
          if (!filter(item)) {
            match = false;
            break;
          }
        }
        if (match) {
          deletedCount++;
          return false;
        }
        return true;
      });

      this.saveTableData(this.table, remainingData);
      resolve({ data: null, error: null, count: deletedCount });
    }
  }

  insert(values: any | any[]) {
    this.operation = 'insert';
    this.operationValues = values;
    return this;
  }

  update(values: any) {
    this.operation = 'update';
    this.operationValues = values;
    return this;
  }

  upsert(values: any | any[]) {
    this.operation = 'upsert';
    this.operationValues = values;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }
}

class MockStorageBuilder {
  private bucket: string;

  constructor(bucket: string) {
    this.bucket = bucket;
  }

  async upload(path: string, file: File) {
    return { data: null, error: { message: 'Mock storage mode: using base64 local fallback' } };
  }

  getPublicUrl(path: string) {
    if (path.startsWith('data:image') || path.startsWith('http')) {
      return { data: { publicUrl: path } };
    }
    return { data: { publicUrl: '' } };
  }
}

const mockAuth = {
  async getSession() {
    if (typeof window === 'undefined') return { data: { session: null }, error: null };
    try {
      const sessionStr = window.localStorage.getItem('kh_admin_session');
      if (sessionStr) {
        const parsed = JSON.parse(sessionStr);
        if (parsed && typeof parsed === 'object') {
          return { data: { session: parsed }, error: null };
        }
      }
    } catch (err) {
      console.error('Error parsing session data:', err);
    }
    return { data: { session: null }, error: null };
  },

  async signInWithPassword({ email, password }: any) {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('elkhodary_staff');
      const staffList = stored ? JSON.parse(stored) : [
        { id: 'staff-1', name: 'أحمد الخضري', email: 'admin@elkhodary.com', password: 'admin123', role: 'full_admin', is_active: true }
      ];
      
      const found = staffList.find((s: any) => s.email === email && s.password === password);
      if (found) {
        if (!found.is_active) {
          return { data: null, error: { message: 'هذا الحساب موقوف حالياً من قبل الإدارة.' } };
        }
        const mockSession = {
          user: { id: found.id, email: found.email, name: found.name, role: found.role },
          expires_at: Math.floor(Date.now() / 1000) + 3600
        };
        window.localStorage.setItem('kh_admin_session', JSON.stringify(mockSession));
        return { data: mockSession, error: null };
      }
    } else {
      if (email === 'admin@elkhodary.com' && password === 'admin123') {
        const mockSession = {
          user: { id: 'staff-1', email: 'admin@elkhodary.com', name: 'أحمد الخضري', role: 'full_admin' },
          expires_at: Math.floor(Date.now() / 1000) + 3600
        };
        return { data: mockSession, error: null };
      }
    }
    return { data: null, error: { message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' } };
  },

  async signOut() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('kh_admin_session');
    }
    return { error: null };
  },

  onAuthStateChange(callback: any) {
    const handleStorageChange = () => {
      const sessionStr = window.localStorage.getItem('kh_admin_session');
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      const event = session ? 'SIGNED_IN' : 'SIGNED_OUT';
      callback(event, session);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }
    return {
      data: {
        subscription: {
          unsubscribe() {
            if (typeof window !== 'undefined') {
              window.removeEventListener('storage', handleStorageChange);
            }
          }
        }
      }
    };
  }
};

// Memory cache storage for custom data fetching functions to make page load instant
const globalFetchCache = new Map<string, { data: any; timestamp: number }>();

export function cachedFetch<T>(key: string, fetchFn: () => Promise<T>, ttlMs = 5000): Promise<T> {
  const now = Date.now();
  const cached = globalFetchCache.get(key);
  if (cached && (now - cached.timestamp < ttlMs)) {
    return Promise.resolve(cached.data);
  }
  return fetchFn().then(data => {
    globalFetchCache.set(key, { data, timestamp: now });
    return data;
  });
}

export function clearFetchCache() {
  globalFetchCache.clear();
}

export const mockSupabase = {
  from(table: string) {
    return new MockSupabaseQueryBuilder(table);
  },
  auth: mockAuth,
  storage: {
    from(bucket: string) {
      return new MockStorageBuilder(bucket);
    }
  }
};

const actualSupabase = isSupabaseConfigured ? realSupabase! : (mockSupabase as any);

// تصدير العميل الفعال مع تفريغ الكاش تلقائياً عند عمليات الكتابة
export const supabase = {
  ...actualSupabase,
  auth: actualSupabase.auth,
  storage: actualSupabase.storage,
  from(table: string) {
    const builder = actualSupabase.from(table);
    
    const origInsert = builder.insert;
    if (origInsert) {
      builder.insert = function(...args: any[]) {
        clearFetchCache();
        return origInsert.apply(this, args);
      };
    }
    const origUpdate = builder.update;
    if (origUpdate) {
      builder.update = function(...args: any[]) {
        clearFetchCache();
        return origUpdate.apply(this, args);
      };
    }
    const origUpsert = builder.upsert;
    if (origUpsert) {
      builder.upsert = function(...args: any[]) {
        clearFetchCache();
        return origUpsert.apply(this, args);
      };
    }
    const origDelete = builder.delete;
    if (origDelete) {
      builder.delete = function(...args: any[]) {
        clearFetchCache();
        return origDelete.apply(this, args);
      };
    }
    
    return builder;
  }
} as any;

// مهايئ الحصول على عميل الخدمة (للتوافق)
export const getServiceSupabase = () => {
  return supabase;
};
