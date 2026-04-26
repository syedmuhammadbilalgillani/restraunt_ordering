"use client";

import { toast } from "sonner";
import {
  checkoutCartServer,
  clearCartSessionAfterOrder,
  type NestCheckoutOrder,
} from "@/lib/cart/cart.server";
import { syncCartToServer } from "@/lib/cart/cart.client";
import { useCartStore } from "@/lib/cart/cart.store";

export type { NestCheckoutOrder };

/**
 * Server-backed checkout: verifies totals with `clientTotal`, creates the order,
 * clears the HttpOnly cart token, and clears the client cart store.
 */
export async function submitCheckout(payload: {
  clientTotal: string;
  customerNotes?: string;
  kitchenNotes?: string;
  guestName?: string;
  guestPhone?: string;
}): Promise<NestCheckoutOrder> {
  try {
    const latest = useCartStore.getState().lines;
    await syncCartToServer(latest);
    const order = await checkoutCartServer(payload);
    await clearCartSessionAfterOrder();
    return order;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Checkout failed";
    toast.error(msg);
    throw e;
  }
}
