import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Database } from '@/types/supabase'

type Product = Database['public']['Tables']['products']['Row']

export type CartItem = {
  product: Product
  quantity: number
  customization?: any
}

type CartStore = {
  items: CartItem[]
  addItem: (product: Product, quantity: number, customization?: any) => void
  removeItem: (productId: string) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, quantity, customization) =>
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product.id === product.id && 
            JSON.stringify(item.customization) === JSON.stringify(customization)
          )
          if (existingItem) {
             return {
               items: state.items.map((item) =>
                 item === existingItem
                   ? { ...item, quantity: item.quantity + quantity }
                   : item
               ),
             }
          }
          return {
            items: [...state.items, { product, quantity, customization }],
          }
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage',
    }
  )
)




