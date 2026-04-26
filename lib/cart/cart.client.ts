"use client";

import { toast } from "sonner";
import type { CartItem } from "@/types";
import {
  applyPromoCartServer,
  quoteCartServer,
  removePromoCartServer,
  setCartItemsServer,
} from "./cart.server";
import type { NestQuoteResponse } from "./cart.server";

export type { NestQuoteResponse } from "./cart.server";

/** Push lines to the server and return an authoritative quote (subtotal, discounts, issues). */
export async function syncCartToServer(
  lines: CartItem[],
): Promise<NestQuoteResponse | undefined> {
  if (lines.length === 0) return undefined;
  try {
    await setCartItemsServer({ lines });
    return await quoteCartServer();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to sync cart";
    toast.error(msg);
    throw e;
  }
}

export async function applyPromoToCart(code: string): Promise<NestQuoteResponse> {
  try {
    await applyPromoCartServer(code);
    return await quoteCartServer();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to apply promo";
    toast.error(msg);
    throw e;
  }
}

export async function removePromoFromCart(): Promise<NestQuoteResponse> {
  try {
    await removePromoCartServer();
    return await quoteCartServer();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to remove promo";
    toast.error(msg);
    throw e;
  }
}
