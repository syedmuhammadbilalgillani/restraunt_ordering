import { apiClient } from "@/lib/apiClient";
import { ApiError } from "@/lib/apiClient";
import type { CreateOnlineOrderPayload, OnlineOrderResponse } from "@/types";

const PATH_CANDIDATES = [
  "/api/v1/online-orders",
  "/api/online-orders",
] as const;

export async function createOnlineOrder(
  body: CreateOnlineOrderPayload,
  options?: { token?: string | null },
): Promise<OnlineOrderResponse> {
  let last404: ApiError | null = null;

  for (const path of PATH_CANDIDATES) {
    try {
      const res = await apiClient.post<OnlineOrderResponse>(path, body, {
        token: options?.token ?? undefined,
      });
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
