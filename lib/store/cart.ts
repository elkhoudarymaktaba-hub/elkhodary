import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../supabase';

export interface CartItem {
  id: string; // Unique identifier (e.g. product_id + '_' + unitType, or box_id + '_' + timestamp)
  type: 'product' | 'box';
  name: string;
  price: number;
  qty: number;
  image: string;
  
  // For individual products
  productId?: string;
  unitType?: 'piece' | 'box'; // piece (قطعة) or box (علبة)
  
  // For customized boxes
  boxId?: string;
  stage?: string;
  customItems?: Array<{
    productId: string;
    name: string;
    qty: number;
    price: number;
    image: string;
    category?: string;
  }>;
}

export interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order: number;
}

interface CartState {
  items: CartItem[];
  coupon: Coupon | null;
  couponError: string | null;
  selectedGovernorate: string | null;
  shippingCost: number;
  freeShippingThreshold: number | null;
  
  // Actions
  addItem: (item: Omit<CartItem, 'id'> & { id?: string }) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  setShippingInfo: (governorate: string, cost: number, threshold: number | null) => void;
  clearCart: () => void;
  
  // Selectors
  getSubtotal: () => number;
  getDiscount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      couponError: null,
      selectedGovernorate: null,
      shippingCost: 0,
      freeShippingThreshold: null,

      addItem: (newItem) => {
        const items = [...get().items];
        
        if (newItem.type === 'product') {
          // If it's a product, check if it already exists with the same unitType
          const itemId = newItem.id || `${newItem.productId}_${newItem.unitType}`;
          const existingItemIndex = items.findIndex((i) => i.id === itemId);
          
          if (existingItemIndex > -1) {
            items[existingItemIndex].qty += newItem.qty;
          } else {
            items.push({
              ...newItem,
              id: itemId,
            } as CartItem);
          }
        } else {
          // For boxes, each customized box gets a unique ID with timestamp to prevent grouping unless they are identical
          const itemId = newItem.id || `${newItem.boxId}_${Date.now()}`;
          items.push({
            ...newItem,
            id: itemId,
          } as CartItem);
        }
        
        set({ items, couponError: null });
      },

      removeItem: (id) => {
        const items = get().items.filter((item) => item.id !== id);
        set({ items });
      },

      updateQty: (id, qty) => {
        const items = get().items.map((item) => {
          if (item.id === id) {
            return { ...item, qty: Math.max(1, qty) };
          }
          return item;
        });
        set({ items });
      },

      applyCoupon: async (code) => {
        set({ couponError: null });
        try {
          const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code.trim())
            .eq('active', true)
            .single();

          if (error || !data) {
            set({ coupon: null, couponError: 'الكود غير صحيح أو منتهي الصلاحية' });
            return false;
          }

          const couponData = data as Coupon;
          const subtotal = get().getSubtotal();

          if (subtotal < couponData.min_order) {
            set({
              coupon: null,
              couponError: `الحد الأدنى لتطبيق الكود هو ${couponData.min_order} ج.م`,
            });
            return false;
          }

          set({ coupon: couponData, couponError: null });
          return true;
        } catch (err) {
          set({ coupon: null, couponError: 'حدث خطأ أثناء فحص الكود' });
          return false;
        }
      },

      removeCoupon: () => {
        set({ coupon: null, couponError: null });
      },

      setShippingInfo: (governorate, cost, threshold) => {
        set({
          selectedGovernorate: governorate,
          shippingCost: cost,
          freeShippingThreshold: threshold,
        });
      },

      clearCart: () => {
        set({
          items: [],
          coupon: null,
          couponError: null,
          selectedGovernorate: null,
          shippingCost: 0,
          freeShippingThreshold: null,
        });
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.qty, 0);
      },

      getDiscount: () => {
        const coupon = get().coupon;
        if (!coupon) return 0;
        
        const subtotal = get().getSubtotal();
        if (subtotal < coupon.min_order) return 0; // double check

        if (coupon.type === 'percentage') {
          return (subtotal * coupon.value) / 100;
        } else {
          return Math.min(coupon.value, subtotal);
        }
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        const shipping = get().shippingCost;
        const threshold = get().freeShippingThreshold;
        
        // If free shipping threshold is met
        const actualShipping = (threshold !== null && threshold !== undefined && subtotal >= threshold) ? 0 : shipping;
        
        return Math.max(0, subtotal - discount + actualShipping);
      },
    }),
    {
      name: 'elkhodary-cart-storage',
      // only persist core cart data, skip errors
      partialize: (state) => ({
        items: state.items,
        coupon: state.coupon,
        selectedGovernorate: state.selectedGovernorate,
        shippingCost: state.shippingCost,
        freeShippingThreshold: state.freeShippingThreshold,
      }),
    }
  )
);
