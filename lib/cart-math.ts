import type { CartItem, Item } from "@/types";

export function unitPriceWithModifiers(item: Item, modifiers: CartItem["modifiers"]): number {
  const base = Number(item.basePrice) || 0;
  const modSum = modifiers.reduce((sum, m) => {
    const q = m.quantity ?? 1;
    const delta = m.priceDelta ?? 0;
    return sum + delta * q;
  }, 0);
  return base + modSum;
}

export function lineTotal(line: CartItem): number {
  return unitPriceWithModifiers(line.menuItem, line.modifiers) * line.quantity;
}