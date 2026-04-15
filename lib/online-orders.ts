import { createApiClient, ApiError } from "@/lib/apiClient";
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
): Promise<OnlineOrderResponse> {
  let last404: ApiError | null = null;

  for (const path of PATH_CANDIDATES) {
    try {
      const res = await proxyClient.post<OnlineOrderResponse>(
        path,
        body as unknown as Record<string, unknown>,
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