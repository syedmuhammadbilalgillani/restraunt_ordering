import { TENANT_ID } from "@/constants";
import { ApiError, createApiClient } from "@/lib/apiClient";
import type { CreateOnlineOrderPayload, OnlineOrderResponse } from "@/types";

// Same-origin client so cookies (fh_at/fh_rt) are included,
// and Next proxy can attach Authorization: Bearer <fh_at>
const proxyClient = createApiClient();

const PATH_CANDIDATES = [
  "/api/proxy/online-orders",
  "/api/proxy/online-orders",
] as const;

export async function createOnlineOrder(
  body: CreateOnlineOrderPayload,
  locationId?: string,
): Promise<OnlineOrderResponse> {
  let last404: ApiError | null = null;

  for (const path of PATH_CANDIDATES) {
    try {
      const res = await proxyClient.post<OnlineOrderResponse>(
        path,
        body as unknown as Record<string, unknown>,
        {
          headers: {
            ...(locationId ? { "x-location-id": locationId } : {}),
          },
        },
      );
      return res.data;
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        last404 = e;
        continue;
      }
      throw e;
    }
  }

  throw last404 ?? new ApiError("Online order endpoint not found", 404);
}

/** Map cart lines → API lines (only whitelisted fields) */
export function cartToOrderLines(
  items: import("@/types").CartItem[],
): CreateOnlineOrderPayload["lines"] {
  return items.map((line) => ({
    menuItemId: line.menuItem.id,
    quantity: line.quantity,
    ...(line.specialInstructions
      ? { specialInstructions: line.specialInstructions }
      : {}),
    ...(line.modifiers.length
      ? {
          modifiers: line.modifiers.map((m) => ({
            modifierId: m.modifierId,
            ...(m.quantity != null && m.quantity !== 1
              ? { quantity: m.quantity }
              : {}),
          })),
        }
      : {}),
  }));
}

export type OrdersListResponse = {
  data: Array<{
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    orderType: string;
    orderSource: string;
    locationId: string;
    subtotal: string;
    discountAmount: string;
    taxAmount: string;
    deliveryFee: string;
    total: string;
    currency: string;
    createdAt: string;
    updatedAt: string;
  }>;
  nextCursor: string | null;
};
export type OrderDetailResponse = {
  order: Record<string, unknown>;
  address: Record<string, unknown> | null;
  discount: Record<string, unknown> | null;
  items: Array<Record<string, unknown>>;
  payments: Array<Record<string, unknown>>;
  delivery:
    | (Record<string, unknown> & {
        trackingHistory?: Array<Record<string, unknown>>;
      })
    | null;
  statusLogs: Array<Record<string, unknown>>;
};
type ListMyOrdersArgs = {
  limit?: number;
  cursor?: string;
  status?: string;
  locationId?: string;
};
export async function listMyOrders(args: ListMyOrdersArgs = {}) {
 
  const res = await proxyClient.get<OrdersListResponse>(
    "/api/proxy/online-orders/me",
    {
      params: {
        limit: args.limit ?? 20,
        cursor: args.cursor,
        status: args.status,
        locationId: args.locationId,
      },
      headers: {
        "x-tenant-id": TENANT_ID,
        ...(args.locationId ? { "x-location-id": args.locationId } : {}),
      },
    },
  );
  return res.data;
}
export async function getMyOrderById(
  orderId: string,
  args?: { locationId?: string },
) {
  const res = await proxyClient.get<OrderDetailResponse>(
    `/api/proxy/online-orders/me/${encodeURIComponent(orderId)}`,
    {
      headers: {
        "x-tenant-id": TENANT_ID,
        ...(args?.locationId ? { "x-location-id": args.locationId } : {}),
      },
    },
  );
  return res.data;
}
