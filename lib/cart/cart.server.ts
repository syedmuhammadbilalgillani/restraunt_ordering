"use server";

import { API_URL, TENANT_ID } from "@/constants";
import { getSession } from "@/lib/iron-session/session";
import type { CartItem } from "@/types";

type NestCreateCartSessionDto = {
  orderType: "dine_in" | "takeaway" | "delivery" | "catering";
  orderSource: "pos" | "online" | "qr" | "kiosk" | "whatsapp" | "aggregator" | "group";
  deliveryAddressId?: string;
  tableNumber?: string;
  qrCodeId?: string;
  kioskTerminalId?: string;
  groupSessionId?: string;
};

type NestSetCartItemsDto = {
  items: Array<{
    menuItemId: string;
    quantity: number;
    specialInstructions?: string;
    modifiers?: Array<{ modifierId: string; quantity?: number }>;
  }>;
  clientUpdatedAt?: string;
};

export type NestQuoteResponse = {
  currency: string;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  deliveryFee: string;
  total: string;
  appliedDiscount: null | {
    discountId: string;
    code: string;
    type: string;
    value: string;
  };
  issues: Array<{ code: string; message: string; meta?: unknown }>;
};

function mustGetLocationId(session: Awaited<ReturnType<typeof getSession>>): string {
  const locationId = session.locationId;
  if (!locationId) throw new Error("Location is required to use cart");
  return locationId;
}

function bearerFromSession(
  session: Awaited<ReturnType<typeof getSession>>,
): string | undefined {
  const t = session.accessToken;
  return typeof t === "string" && t.trim() ? t.trim() : undefined;
}

function baseHeaders(args: {
  locationId: string;
  cartToken?: string;
  bearer?: string;
}) {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  headers.set("x-tenant-id", TENANT_ID);
  headers.set("x-location-id", args.locationId);
  if (args.cartToken) headers.set("x-cart-token", args.cartToken);
  if (args.bearer) headers.set("Authorization", `Bearer ${args.bearer}`);
  return headers;
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return await res.json();
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function messageFromBody(body: unknown, fallback: string) {
  if (typeof body === "object" && body !== null && "message" in body) {
    const msg = (body as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
    if (Array.isArray(msg) && msg.length > 0) {
      const parts = msg.filter((m): m is string => typeof m === "string" && m.trim().length > 0);
      if (parts.length) return parts.join("; ");
    }
  }
  if (typeof body === "string" && body.trim()) return body;
  return fallback;
}

function tokenFromBody(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const direct = (body as { sessionToken?: unknown }).sessionToken;
  if (typeof direct === "string" && direct) return direct;
  const data = (body as { data?: unknown }).data;
  if (typeof data === "object" && data !== null) {
    const nested = (data as { sessionToken?: unknown }).sessionToken;
    if (typeof nested === "string" && nested) return nested;
  }
  return null;
}

export async function ensureCartSessionToken(
  desired?: Partial<NestCreateCartSessionDto>,
): Promise<{ cartSessionToken: string }> {
  const session = await getSession();
  const locationId = mustGetLocationId(session);

  if (session.cartSessionToken) {
    return { cartSessionToken: session.cartSessionToken };
  }

  const dto: NestCreateCartSessionDto = {
    orderType: desired?.orderType ?? "takeaway",
    orderSource: desired?.orderSource ?? "online",
    ...(desired?.deliveryAddressId ? { deliveryAddressId: desired.deliveryAddressId } : {}),
    ...(desired?.tableNumber ? { tableNumber: desired.tableNumber } : {}),
    ...(desired?.qrCodeId ? { qrCodeId: desired.qrCodeId } : {}),
    ...(desired?.kioskTerminalId ? { kioskTerminalId: desired.kioskTerminalId } : {}),
    ...(desired?.groupSessionId ? { groupSessionId: desired.groupSessionId } : {}),
  };

  const res = await fetch(`${API_URL.replace(/\/$/, "")}/cart-sessions`, {
    method: "POST",
    headers: baseHeaders({ locationId, bearer: bearerFromSession(session) }),
    body: JSON.stringify(dto),
    cache: "no-store",
  });

  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(messageFromBody(body, "Failed to create cart session"));
  }

  const token = tokenFromBody(body);
  if (!token) throw new Error("Cart token missing in response");

  session.cartSessionToken = token;
  await session.save();

  return { cartSessionToken: token };
}

function toNestItems(lines: CartItem[]): NestSetCartItemsDto["items"] {
  return lines.map((line) => ({
    menuItemId: line.menuItem.id,
    quantity: line.quantity,
    ...(line.specialInstructions ? { specialInstructions: line.specialInstructions } : {}),
    ...(line.modifiers?.length
      ? {
          modifiers: line.modifiers.map((m) => ({
            modifierId: m.modifierId,
            ...(m.quantity != null && m.quantity !== 1 ? { quantity: m.quantity } : {}),
          })),
        }
      : {}),
  }));
}

export async function setCartItemsServer(args: {
  lines: CartItem[];
  clientUpdatedAt?: string;
}): Promise<{ ok: true; updatedAt?: string }> {
  const session = await getSession();
  const locationId = mustGetLocationId(session);
  const { cartSessionToken } = await ensureCartSessionToken();

  const dto: NestSetCartItemsDto = {
    items: toNestItems(args.lines),
    ...(args.clientUpdatedAt ? { clientUpdatedAt: args.clientUpdatedAt } : {}),
  };

  const res = await fetch(`${API_URL.replace(/\/$/, "")}/cart-sessions/items`, {
    method: "PUT",
    headers: baseHeaders({
      locationId,
      cartToken: cartSessionToken,
      bearer: bearerFromSession(session),
    }),
    body: JSON.stringify(dto),
    cache: "no-store",
  });

  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(messageFromBody(body, "Failed to update cart"));
  }

  const updatedAt =
    typeof body === "object" && body !== null && "updatedAt" in body
      ? String((body as { updatedAt?: unknown }).updatedAt ?? "")
      : undefined;
  return { ok: true, updatedAt };
}

export async function quoteCartServer(opts?: {
  includeUnavailableItems?: boolean;
}): Promise<NestQuoteResponse> {
  const session = await getSession();
  const locationId = mustGetLocationId(session);
  const { cartSessionToken } = await ensureCartSessionToken();

  const quotePayload: Record<string, boolean> = {};
  if (opts?.includeUnavailableItems === true) {
    quotePayload.includeUnavailableItems = true;
  }

  const res = await fetch(`${API_URL.replace(/\/$/, "")}/cart-sessions/quote`, {
    method: "POST",
    headers: baseHeaders({
      locationId,
      cartToken: cartSessionToken,
      bearer: bearerFromSession(session),
    }),
    body: JSON.stringify(quotePayload),
    cache: "no-store",
  });

  const resBody = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(messageFromBody(resBody, "Failed to quote cart"));
  }

  return resBody as NestQuoteResponse;
}

export async function applyPromoCartServer(code: string): Promise<{ promoCode: string }> {
  const session = await getSession();
  const locationId = mustGetLocationId(session);
  const { cartSessionToken } = await ensureCartSessionToken();
  const trimmed = code.trim();
  if (!trimmed) throw new Error("Enter a promo code");

  const res = await fetch(`${API_URL.replace(/\/$/, "")}/cart-sessions/promo`, {
    method: "POST",
    headers: baseHeaders({
      locationId,
      cartToken: cartSessionToken,
      bearer: bearerFromSession(session),
    }),
    body: JSON.stringify({ code: trimmed }),
    cache: "no-store",
  });

  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(messageFromBody(body, "Could not apply promo code"));
  }

  if (typeof body !== "object" || body === null || !("promoCode" in body)) {
    throw new Error("Unexpected response when applying promo");
  }
  const promoCode = (body as { promoCode?: unknown }).promoCode;
  if (typeof promoCode !== "string" || !promoCode) {
    throw new Error("Unexpected response when applying promo");
  }
  return { promoCode };
}

export async function removePromoCartServer(): Promise<{ promoCode: null }> {
  const session = await getSession();
  const locationId = mustGetLocationId(session);
  const { cartSessionToken } = await ensureCartSessionToken();

  const res = await fetch(`${API_URL.replace(/\/$/, "")}/cart-sessions/promo`, {
    method: "DELETE",
    headers: baseHeaders({
      locationId,
      cartToken: cartSessionToken,
      bearer: bearerFromSession(session),
    }),
    cache: "no-store",
  });

  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(messageFromBody(body, "Could not remove promo code"));
  }

  return { promoCode: null };
}

export async function updateCartContextServer(payload: {
  orderType?: "takeaway" | "delivery" | "dine_in" | "catering";
  deliveryAddressId?: string;
}): Promise<void> {
  const session = await getSession();
  const locationId = mustGetLocationId(session);
  const { cartSessionToken } = await ensureCartSessionToken();

  const res = await fetch(`${API_URL.replace(/\/$/, "")}/cart-sessions/context`, {
    method: "PUT",
    headers: baseHeaders({
      locationId,
      cartToken: cartSessionToken,
      bearer: bearerFromSession(session),
    }),
    body: JSON.stringify({
      ...(payload.orderType ? { orderType: payload.orderType } : {}),
      ...(payload.deliveryAddressId ? { deliveryAddressId: payload.deliveryAddressId } : {}),
    }),
    cache: "no-store",
  });

  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(messageFromBody(body, "Failed to update cart"));
  }
}

export type NestCheckoutOrder = {
  id: string;
  orderNumber: string;
  total: string;
  status?: string;
  currency?: string;
};

export async function checkoutCartServer(payload: {
  clientTotal?: string;
  customerNotes?: string;
  kitchenNotes?: string;
  guestName?: string;
  guestPhone?: string;
}): Promise<NestCheckoutOrder> {
  const session = await getSession();
  const locationId = mustGetLocationId(session);
  const { cartSessionToken } = await ensureCartSessionToken();

  const res = await fetch(`${API_URL.replace(/\/$/, "")}/cart-sessions/checkout`, {
    method: "POST",
    headers: baseHeaders({
      locationId,
      cartToken: cartSessionToken,
      bearer: bearerFromSession(session),
    }),
    body: JSON.stringify({
      ...(payload.clientTotal != null && payload.clientTotal !== ""
        ? { clientTotal: payload.clientTotal }
        : {}),
      ...(payload.customerNotes?.trim()
        ? { customerNotes: payload.customerNotes.trim() }
        : {}),
      ...(payload.kitchenNotes?.trim()
        ? { kitchenNotes: payload.kitchenNotes.trim() }
        : {}),
      ...(payload.guestName?.trim() ? { guestName: payload.guestName.trim() } : {}),
      ...(payload.guestPhone?.trim()
        ? { guestPhone: payload.guestPhone.trim() }
        : {}),
    }),
    cache: "no-store",
  });

  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(messageFromBody(body, "Checkout failed"));
  }

  if (typeof body !== "object" || body === null) {
    throw new Error("Unexpected checkout response");
  }
  const o = body as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : "";
  const orderNumber = typeof o.orderNumber === "string" ? o.orderNumber : "";
  const total = typeof o.total === "string" ? o.total : "";
  if (!id || !orderNumber) {
    throw new Error("Unexpected checkout response");
  }
  return {
    id,
    orderNumber,
    total,
    ...(typeof o.status === "string" ? { status: o.status } : {}),
    ...(typeof o.currency === "string" ? { currency: o.currency } : {}),
  };
}

/** Link the current guest cart to the signed-in customer (call after login). */
export async function attachCartToCustomerServer(): Promise<void> {
  const session = await getSession();
  const locationId = mustGetLocationId(session);
  const bearer = bearerFromSession(session);
  if (!bearer) throw new Error("Sign in to link your cart");

  const token = session.cartSessionToken;
  if (!token) return;

  const res = await fetch(`${API_URL.replace(/\/$/, "")}/cart-sessions/attach`, {
    method: "POST",
    headers: baseHeaders({
      locationId,
      cartToken: token,
      bearer,
    }),
    cache: "no-store",
  });

  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(messageFromBody(body, "Could not link cart to your account"));
  }
}

/** Clear server-side cart token after a successful order (guest gets a new cart next time). */
export async function clearCartSessionAfterOrder(): Promise<void> {
  const session = await getSession();
  delete session.cartSessionToken;
  await session.save();
}

