import type { CartItem, CartLineModifier, Item } from "@/types";
import { lineTotal } from "@/lib/cart-math";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AddToCartInput = {
  menuItem: Item;
  quantity?: number;
  modifiers?: CartLineModifier[];
  specialInstructions?: string;
};

function sortModifierKey(mods: CartLineModifier[]): string {
  const norm = [...mods].map((m) => ({
    id: m.modifierId,
    q: m.quantity ?? 1,
  }));
  norm.sort((a, b) => a.id.localeCompare(b.id));
  return JSON.stringify(norm);
}

function lineIdentityKey(
  menuItemId: string,
  mods: CartLineModifier[],
  specialInstructions: string,
): string {
  return `${menuItemId}|${sortModifierKey(mods)}|${specialInstructions.trim()}`;
}

function newLineId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `line-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export type AppliedDiscount =
  | null
  | {
      valid: true;
      code: string; // what user typed
      discountId: string;
      discountType: string;
      value: string;
      amountOff: string;
      message: string;
    };

interface CartState {
  items: CartItem[];
  addItem: (input: AddToCartInput) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;

  total: () => number;
  itemCount: () => number;

  couponCode: string;
  appliedDiscount: AppliedDiscount;

  setCouponCode: (code: string) => void;
  applyDiscount: (discount: NonNullable<AppliedDiscount>) => void;
  clearDiscount: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (input) => {
        const {
          menuItem,
          quantity = 1,
          modifiers = [],
          specialInstructions = "",
        } = input;

        const key = lineIdentityKey(
          menuItem.id,
          modifiers,
          specialInstructions,
        );

        set((state) => {
          const existing = state.items.find(
            (i) =>
              lineIdentityKey(
                i.menuItem.id,
                i.modifiers,
                i.specialInstructions ?? "",
              ) === key,
          );

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.lineId === existing.lineId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i,
              ),
            };
          }

          const line: CartItem = {
            lineId: newLineId(),
            menuItem,
            quantity,
            modifiers,
            specialInstructions: specialInstructions.trim() || undefined,
          };

          return { items: [...state.items, line] };
        });

        // safest: cart changed => coupon may no longer be valid
        set({ appliedDiscount: null });
      },

      removeItem: (lineId) => {
        set((state) => ({
          items: state.items.filter((i) => i.lineId !== lineId),
          appliedDiscount: null,
        }));
      },

      updateQuantity: (lineId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((i) => i.lineId !== lineId),
              appliedDiscount: null,
            };
          }
          return {
            items: state.items.map((i) =>
              i.lineId === lineId ? { ...i, quantity } : i,
            ),
            appliedDiscount: null,
          };
        });
      },

      clearCart: () => set({ items: [], couponCode: "", appliedDiscount: null }),

      total: () => get().items.reduce((sum, i) => sum + lineTotal(i), 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      couponCode: "",
      appliedDiscount: null,

      setCouponCode: (code) => set({ couponCode: code }),
      applyDiscount: (discount) => set({ appliedDiscount: discount }),
      clearDiscount: () => set({ appliedDiscount: null }),
    }),
    { name: "foodhub-cart-v2" },
  ),
);