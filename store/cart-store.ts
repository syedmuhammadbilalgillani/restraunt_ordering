import { CartItem, Item } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartState {
  items: CartItem[];
  addItem: (item: Item) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (menuItem) =>
        set((state) => {
          const existing = state.items.find((i) => i.menuItem.id === menuItem.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.menuItem.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { menuItem, quantity: 1 }] };
        }),
      removeItem: (itemId) =>
        set((state) => ({
          items: state.items.filter((i) => i.menuItem.id !== itemId),
        })),
      updateQuantity: (itemId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.menuItem.id !== itemId) };
          }
          return {
            items: state.items.map((i) =>
              i.menuItem.id === itemId ? { ...i, quantity } : i
            ),
          };
        }),
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.menuItem.basePrice * i.quantity, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "foodhub-cart" }
  )
);
