"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Item, MenuItemDetails } from "@/types";

function isMenuItemDetails(x: Item | MenuItemDetails): x is MenuItemDetails {
  return "modifierGroups" in x;
}

function toItemSnapshot(menuItem: Item | MenuItemDetails): Item {
  if (!isMenuItemDetails(menuItem)) return menuItem;
  return {
    id: menuItem.id,
    slug: menuItem.slug,
    categoryId: menuItem.categoryId,
    sku: menuItem.sku,
    name: menuItem.name,
    description: menuItem.description ?? null,
    imageUrl: menuItem.imageUrl ?? null,
    uom: menuItem.uom,
    basePrice: Number(menuItem.basePrice),
    compareAtPrice: menuItem.compareAtPrice ?? null,
    discountPrice: menuItem.discountPrice ?? null,
    isFeatured: Boolean(menuItem.isFeatured),
    displayOrder: Number(menuItem.displayOrder ?? 0),
    prepTimeSeconds: menuItem.prepTimeSeconds ?? null,
  };
}

function stableLineId(args: {
  menuItemId: string;
  modifiers: Array<{ modifierId: string; quantity?: number }>;
  specialInstructions?: string;
}) {
  const mods = [...args.modifiers]
    .map((m) => `${m.modifierId}:${m.quantity ?? 1}`)
    .sort()
    .join("|");
  const instr = (args.specialInstructions ?? "").trim();
  return `${args.menuItemId}__${mods}__${instr}`;
}

type AddArgs = {
  menuItem: Item | MenuItemDetails;
  quantity?: number;
  modifiers?: Array<{ modifierId: string; name?: string; quantity?: number; priceDelta?: number }>;
  specialInstructions?: string;
};

type CartState = {
  lines: CartItem[];
  lastSyncedAt?: string;

  add: (args: AddArgs) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;

  countItems: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      lastSyncedAt: undefined,

      add: ({ menuItem, quantity = 1, modifiers = [], specialInstructions }) => {
        const lineId = stableLineId({
          menuItemId: menuItem.id,
          modifiers: modifiers.map((m) => ({ modifierId: m.modifierId, quantity: m.quantity })),
          specialInstructions,
        });

        set((state) => {
          const existing = state.lines.find((l) => l.lineId === lineId);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.lineId === lineId ? { ...l, quantity: Math.min(50, l.quantity + quantity) } : l,
              ),
            };
          }

          const snapshot = toItemSnapshot(menuItem);

          const newLine: CartItem = {
            lineId,
            menuItem: snapshot,
            quantity: Math.min(50, Math.max(1, quantity)),
            ...(specialInstructions ? { specialInstructions } : {}),
            modifiers: modifiers.map((m) => ({
              modifierId: m.modifierId,
              ...(m.name ? { name: m.name } : {}),
              ...(m.quantity != null ? { quantity: m.quantity } : {}),
              ...(m.priceDelta != null ? { priceDelta: m.priceDelta } : {}),
            })),
          };

          return { lines: [newLine, ...state.lines] };
        });
      },

      setQuantity: (lineId, quantity) => {
        const q = Math.max(0, Math.min(50, Math.floor(quantity)));
        set((state) => ({
          lines:
            q <= 0
              ? state.lines.filter((l) => l.lineId !== lineId)
              : state.lines.map((l) => (l.lineId === lineId ? { ...l, quantity: q } : l)),
        }));
      },

      remove: (lineId) => set((state) => ({ lines: state.lines.filter((l) => l.lineId !== lineId) })),

      clear: () => set({ lines: [] }),

      countItems: () => get().lines.reduce((sum, l) => sum + (l.quantity || 0), 0),
    }),
    {
      name: "fh-cart-v1",
      partialize: (s) => ({ lines: s.lines, lastSyncedAt: s.lastSyncedAt }),
    },
  ),
);

